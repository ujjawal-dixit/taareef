// app/api/capture/audio/route.ts
// Audio transcription via Groq Whisper (whisper-large-v3-turbo).
// Free tier: 28,800 seconds/day. Same GROQ_API_KEY as OCR.
// 
// Flow: browser records audio → POST to this route →
// Groq transcribes → Groq Vision extracts recommendation →
// pre-filled card returned to client.
//
// Model: whisper-large-v3-turbo (faster) or whisper-large-v3 (more accurate).
// We use turbo — speed matters more than marginal accuracy for voice saves.

import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types'

const EXTRACT_PROMPT = `You are extracting a recommendation from a spoken note.
The person has verbally described something they want to save.

Return ONLY a valid JSON object. No prose. No markdown fences.

{
  "title": string or null,
  "category": one of [restaurant, bar, film, tv, music, book, city, activity] or null,
  "source_name": string or null,
  "source_type": one of [friend, family, colleague, instagram, twitter, youtube, article, newsletter, podcast, self] or null,
  "notes": string or null (max 15 words — capture the essence of what they said about it),
  "confidence": "high" or "medium" or "low"
}`

export async function POST(request: Request) {
  try {
    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Audio capture not configured' }, { status: 503 }
      )
    }

    const form  = await request.formData()
    const audio = form.get('audio') as File | null

    if (!audio) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No audio provided' }, { status: 400 }
      )
    }

    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Audio must be under 25MB' }, { status: 400 }
      )
    }

    // ── STEP 1: Transcribe with Groq Whisper ───────────────────
    // Point request to Groq audio endpoint, use whisper-large-v3-turbo
    const groqForm = new FormData()
    groqForm.append('file',  audio, audio.name || 'recording.webm')
    groqForm.append('model', 'whisper-large-v3-turbo')
    groqForm.append('response_format', 'json')

    const transcribeRes = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${groqKey}` },
        body:    groqForm,
      }
    )

    if (!transcribeRes.ok) {
      const err = await transcribeRes.text()
      console.error('[Audio] Groq transcription error:', transcribeRes.status, err)
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Couldn't hear that clearly — try again?" },
        { status: 503 }
      )
    }

    const transcription = await transcribeRes.json()
    const spokenText    = transcription.text?.trim()

    if (!spokenText) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Couldn't make out the audio — try again in a quieter spot?" },
        { status: 422 }
      )
    }

    // ── STEP 2: Extract recommendation with Groq LLM ───────────
    const extractRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          model:      'llama-3.3-70b-versatile',
          max_tokens: 512,
          messages: [
            { role: 'system', content: EXTRACT_PROMPT },
            {
              role:    'user',
              content: `Spoken note: "${spokenText}"`,
            },
          ],
        }),
      }
    )

    const extractData = await extractRes.json()
    const raw         = extractData.choices?.[0]?.message?.content?.trim() ?? ''

    // Strip markdown fences defensively
    const clean = raw
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(clean)
    } catch {
      // Extraction failed but transcription succeeded
      // Return the raw text as title so the user can still save it
      return NextResponse.json({
        data: {
          title:       spokenText,
          category:    null,
          source_name: null,
          source_type: null,
          notes:       null,
          confidence:  'low',
          transcription: spokenText,
        },
        error: null,
      }, { status: 200 })
    }

    return NextResponse.json({
      data: { ...parsed, transcription: spokenText },
      error: null,
    }, { status: 200 })

  } catch (err) {
    console.error('[Audio] Unexpected:', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}
