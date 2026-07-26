import { NextRequest, NextResponse }  from 'next/server'
import { createClient }               from '@/lib/supabase/server'
import type { ApiResponse }           from '@/lib/types'
import type { UnderstandResult }      from '../understand/route'
import {
  MODEL_VISION,
  GROQ_CHAT_URL,
  stripReasoning,
}                                     from '@/lib/constants/models'

// app/api/capture/ocr/route.ts
// Step 1: Read the image via Groq Vision. Extract raw recommendation text.
// Step 2: Forward extracted text to /api/capture/understand for extraction.
// The understand route owns all extraction logic — this route only reads images.
//
// Session 15: model migrated off the shut-down Llama 4 Scout, errors are now
// differentiated by upstream status code, and transient failures retry once.

/** Groq failures worth retrying: rate limits and upstream wobbles. */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])

/** Maps an upstream Groq failure to an honest, actionable user-facing message. */
function messageForStatus(status: number): { error: string; status: number } {
  if (status === 400 || status === 404) {
    // Almost always a bad/retired model ID — an outage, not a user problem.
    return {
      error: 'Screenshot reading is temporarily unavailable — this is on us, not your image',
      status: 503,
    }
  }
  if (status === 401 || status === 403) {
    return { error: 'Screenshot reading is not configured', status: 503 }
  }
  if (status === 413) {
    return { error: 'That image is too large — try a cropped screenshot', status: 413 }
  }
  if (status === 429) {
    return { error: "We're a bit busy right now — try again in a moment", status: 429 }
  }
  return { error: "Couldn't read the screenshot — please try again", status: 503 }
}

async function callVision(
  apiKey:  string,
  prompt:  string,
  dataUrl: string,
): Promise<Response> {
  return fetch(GROQ_CHAT_URL, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:                 MODEL_VISION,
      max_completion_tokens: 500,
      temperature:           0.0,
      messages: [
        {
          role:    'user',
          content: [
            { type: 'text',      text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  })
}

// Tuned against real captures (Session 15): Instagram Reels, stacked multi-frame
// screenshots, overlay captions. The dominant failure mode is the model reporting
// interface chrome — view counts, button labels, nav icons — instead of content.
const VISION_PROMPT = `You are reading a screenshot someone saved because it contains a recommendation — something to watch, listen to, read, eat, do, or visit.

Screenshots are usually from Instagram Reels, TikTok, WhatsApp, X, or a browser. They often stack several video frames vertically in one image.

EXTRACT, in this order of importance:
1. The name of the thing being recommended — usually the largest overlay text, a title card, a poster, or album art. Titles often carry a year, e.g. "Little Buddha (1993)".
2. Any descriptive line about it — what it is, why it is good, where it is.
3. The creator or account who posted it (e.g. an @handle or username shown near the caption) — this is who recommended it.
4. Any place, city, or region mentioned.

IGNORE completely — this is interface furniture, not content:
- Like, comment, share, view and save counts (e.g. "97.5K", "308")
- Button labels: Follow, Subscribe, Add comment, Send
- Navigation icons, tab bars, the phone's status bar, battery, wifi, clock time
- Watermarks and app names ("Reels", "Shorts")

Preserve original language, including Hindi, Hinglish, or transliterated names — do not translate.

Return only the extracted text as plain prose. No JSON, no bullet points, no commentary, no preamble.

If several different things are recommended, list each on its own line.
If the image is too blurry or unclear to read, return exactly: UNCLEAR_IMAGE
If there is no recommendation in the image, return exactly: NO_RECOMMENDATION`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' }, { status: 401 }
      )
    }

    const formData  = await request.formData()
    const imageFile = formData.get('image') as File | null
    if (!imageFile) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No image provided' }, { status: 400 }
      )
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Screenshot reading is not configured' }, { status: 503 }
      )
    }

    // ── STEP 1: READ IMAGE ────────────────────────────────────────
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64      = Buffer.from(arrayBuffer).toString('base64')
    const mimeType    = imageFile.type || 'image/jpeg'
    const dataUrl     = `data:${mimeType};base64,${base64}`

    let visionRes = await callVision(groqApiKey, VISION_PROMPT, dataUrl)

    // One retry with a short backoff, for transient upstream failures only.
    if (!visionRes.ok && RETRYABLE_STATUSES.has(visionRes.status)) {
      console.warn(`[ocr/vision] status=${visionRes.status} — retrying once`)
      await new Promise(resolve => setTimeout(resolve, 600))
      visionRes = await callVision(groqApiKey, VISION_PROMPT, dataUrl)
    }

    if (!visionRes.ok) {
      // Log the real cause. A retired model ID surfaces here as 400/404 —
      // exactly the signal that went unread for nine days in July 2026.
      const detail = await visionRes.text()
      console.error(
        `[ocr/vision] model=${MODEL_VISION} status=${visionRes.status} body=${detail.slice(0, 300)}`
      )
      const mapped = messageForStatus(visionRes.status)
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: mapped.error }, { status: mapped.status }
      )
    }

    const visionJson = await visionRes.json()
    const rawText    = (visionJson.choices?.[0]?.message?.content ?? '') as string
    const ocrText    = stripReasoning(rawText)

    // Explicit failure signals from the vision model.
    if (ocrText === 'UNCLEAR_IMAGE') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'The image is too blurry to read — try a clearer screenshot' },
        { status: 422 }
      )
    }
    if (ocrText === 'NO_RECOMMENDATION') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "We couldn't find a recommendation in this image" },
        { status: 422 }
      )
    }
    if (!ocrText) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Couldn't read anything from this image" }, { status: 422 }
      )
    }

    console.log(`[ocr] model=${MODEL_VISION} extracted="${ocrText.slice(0, 80)}…"`)

    // ── STEP 2: UNDERSTAND ────────────────────────────────────────
    const understandRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/capture/understand`,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({ input: ocrText, input_type: 'ocr' }),
      }
    )

    const understandJson: ApiResponse<UnderstandResult> = await understandRes.json()

    if (!understandRes.ok || understandJson.error || !understandJson.data) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: understandJson.error ?? "Couldn't process the screenshot — please try again" },
        { status: 503 }
      )
    }

    return NextResponse.json<ApiResponse<UnderstandResult>>({
      data:  understandJson.data,
      error: null,
    })

  } catch (err) {
    console.error('[POST /api/capture/ocr] unexpected:', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}
