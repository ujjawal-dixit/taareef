import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' }, { status: 401 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    if (!audioFile) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No audio file provided' }, { status: 400 }
      )
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Audio capture is not configured' }, { status: 503 }
      )
    }

    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, 'audio.webm')
    whisperForm.append('model', 'whisper-large-v3-turbo')
    whisperForm.append('response_format', 'json')

    const transcribeRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body: whisperForm,
    })

    if (!transcribeRes.ok) {
      console.error('[audio/transcribe]', await transcribeRes.text())
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Could not transcribe audio — please try again' }, { status: 503 }
      )
    }

    const { text: transcript } = await transcribeRes.json()
    if (!transcript || transcript.trim() === '') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Couldn't catch that — please try again" }, { status: 400 }
      )
    }

    const extractRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `You extract recommendation data from spoken text.
Return ONLY valid JSON, no prose, no markdown.

Valid categories: watch, listen, read, dine, do, visit
- watch: films, TV shows, series, documentaries
- listen: music, albums, songs, podcasts, artists
- read: books, fiction, non-fiction, poetry
- dine: restaurants, bars, cafes, street food — anything food or drink related
- do: hikes, adventures, rides, activities, experiences
- visit: exhibitions, galleries, concerts, theatre, performances

Valid source types: friend, family, colleague, instagram, twitter, youtube, article, newsletter, podcast, self

JSON shape:
{
  "title": string or null,
  "category": one of the valid categories or null,
  "source_type": one of the valid source types or null,
  "source_name": string or null,
  "notes": string (max 100 chars) or null,
  "confidence": "high" | "medium" | "low"
}`,
          },
          {
            role: 'user',
            content: `Extract the recommendation from this spoken text:\n\n"${transcript}"`,
          },
        ],
      }),
    })

    if (!extractRes.ok) {
      console.error('[audio/extract]', await extractRes.text())
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Could not process audio — please try again' }, { status: 503 }
      )
    }

    const extractJson = await extractRes.json()
    const rawContent = extractJson.choices?.[0]?.message?.content ?? ''

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(rawContent.replace(/```json|```/g, '').trim())
    } catch {
      console.error('[audio/parse]', rawContent)
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Could not understand the recommendation — please try again' }, { status: 422 }
      )
    }

    return NextResponse.json<ApiResponse<Record<string, unknown>>>({
      data: { ...extracted, transcript },
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/capture/audio] unexpected', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}
