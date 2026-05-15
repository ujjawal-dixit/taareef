// app/api/capture/ocr/route.ts
// Screenshot OCR using Groq Vision (llama-4-scout-17b).
// Free tier. Same GROQ_API_KEY as audio transcription.
// No Anthropic key needed.
// 
// Flow: user uploads screenshot → Groq Vision reads it →
// returns structured recommendation → pre-filled card shown to user.

import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types'

const SYSTEM_PROMPT = `You are a recommendation extraction specialist.
You will receive a screenshot. It may be from WhatsApp, iMessage, Instagram, 
Twitter/X, a food delivery app, a streaming service, or any other context 
where someone recommends something.

Your job: extract the recommendation and return ONLY a valid JSON object.
No prose. No markdown fences. Just the JSON.

{
  "title": string or null,
  "category": one of [restaurant, bar, film, tv, music, book, city, activity, podcast, person] or null,
  "source_name": string or null,
  "source_type": one of [friend, family, colleague, instagram, twitter, youtube, article, newsletter, podcast, self] or null,
  "notes": string or null (max 15 words — why it might be worth experiencing),
  "location": { "city": string, "country": string } or null,
  "confidence": "high" or "medium" or "low"
}

If no clear recommendation exists in the image, return all null values with confidence "low".`

export async function POST(request: Request) {
  try {
    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'OCR not configured' }, { status: 503 }
      )
    }

    const form  = await request.formData()
    const file  = form.get('image') as File | null

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No image provided' }, { status: 400 }
      )
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Image must be under 20MB' }, { status: 400 }
      )
    }

    const bytes   = await file.arrayBuffer()
    const base64  = Buffer.from(bytes).toString('base64')
    const mime    = file.type || 'image/jpeg'

    // Groq Vision — same API key as Whisper audio
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:      'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 512,
        messages: [
          {
            role:    'system',
            content: SYSTEM_PROMPT,
          },
          {
            role:    'user',
            content: [
              {
                type:      'image_url',
                image_url: { url: `data:${mime};base64,${base64}` },
              },
              {
                type: 'text',
                text: 'Extract the recommendation from this screenshot.',
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[OCR] Groq error:', res.status, err)
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Could not read the screenshot — try again?' },
        { status: 503 }
      )
    }

    const groqData = await res.json()
    const text     = groqData.choices?.[0]?.message?.content?.trim() ?? ''

    // Strip markdown fences if Groq adds them despite instructions
    const clean = text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error('[OCR] Parse failed. Raw:', text)
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Could not extract a recommendation from this screenshot' },
        { status: 422 }
      )
    }

    return NextResponse.json({ data: parsed, error: null }, { status: 200 })

  } catch (err) {
    console.error('[OCR] Unexpected:', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}
