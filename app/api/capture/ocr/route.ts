import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import type { ApiResponse }          from '@/lib/types'
import type { UnderstandResult }     from '../understand/route'

// app/api/capture/ocr/route.ts
// Step 1: Read the image via Groq Vision (llama-4-scout — fast, handles screenshots well)
//         Extract raw text and any visible recommendation context from the image
// Step 2: Forward extracted text to /api/capture/understand for intelligent extraction
// The understand route handles all LLM logic — this route only does image reading.

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

    const visionRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:       'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens:  400,
        temperature: 0.0,
        messages: [
          {
            role:    'user',
            content: [
              {
                type: 'text',
                text: `Read this image carefully. It may be a screenshot of a WhatsApp message, Instagram post, tweet, article, or any other source containing a recommendation.

Extract and return ALL text visible in the image that relates to recommendations — titles, names, places, people, dates, descriptions. Preserve the original language including Hindi or Hinglish.

Return only the extracted text as plain prose. No JSON. No formatting. No commentary. Just the text content of the image that is relevant to identifying what is being recommended and who is recommending it.

If the image is too blurry or unclear to read, return only: UNCLEAR_IMAGE
If no recommendation is visible, return only: NO_RECOMMENDATION`,
              },
              {
                type:      'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
      }),
    })

    if (!visionRes.ok) {
      console.error('[ocr/vision]', await visionRes.text())
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Couldn't read the screenshot — please try again" }, { status: 503 }
      )
    }

    const visionJson  = await visionRes.json()
    const ocrText     = (visionJson.choices?.[0]?.message?.content ?? '') as string

    // Handle explicit failure signals from the vision model
    if (ocrText.trim() === 'UNCLEAR_IMAGE') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "The image is too blurry to read — try a clearer screenshot" },
        { status: 422 }
      )
    }
    if (ocrText.trim() === 'NO_RECOMMENDATION') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "We couldn't find a recommendation in this image" },
        { status: 422 }
      )
    }
    if (!ocrText.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Couldn't read anything from this image" }, { status: 422 }
      )
    }

    console.log(`[ocr] extracted text="${ocrText.slice(0, 80)}…"`)

    // ── STEP 2: UNDERSTAND ────────────────────────────────────────
    const understandRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/capture/understand`,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          input:      ocrText,
          input_type: 'ocr',
        }),
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
