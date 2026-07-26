import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import type { ApiResponse }          from '@/lib/types'
import type { UnderstandResult }     from '../understand/route'
import { MODEL_TRANSCRIBE }          from '@/lib/constants/models'

// app/api/capture/audio/route.ts
// Step 1: Transcribe voice via Groq Whisper (fast, accurate, handles Indian accents)
// Step 2: Forward transcript to /api/capture/understand for intelligent extraction
// The understand route handles all LLM logic — this route only does transcription.

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

    // ── STEP 1: TRANSCRIBE ────────────────────────────────────────
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, 'audio.webm')
    whisperForm.append('model', MODEL_TRANSCRIBE)
    whisperForm.append('response_format', 'verbose_json') // verbose gives us word-level confidence
    whisperForm.append('language', 'en') // Hint English primary — still handles Hinglish well

    const transcribeRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method:  'POST',
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body:    whisperForm,
    })

    if (!transcribeRes.ok) {
      console.error('[audio/transcribe]', await transcribeRes.text())
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Couldn't hear that clearly — please try again" }, { status: 503 }
      )
    }

    const transcribeData = await transcribeRes.json()
    const transcript     = transcribeData.text as string | undefined

    if (!transcript || transcript.trim() === '') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "We didn't catch anything — please try again" }, { status: 400 }
      )
    }

    console.log(`[audio] transcript="${transcript.slice(0, 80)}…"`)

    // ── STEP 2: UNDERSTAND ────────────────────────────────────────
    // Forward to understand route with full auth cookie context
    const understandRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/capture/understand`,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward the auth cookie so the understand route can verify the user
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          input:      transcript,
          input_type: 'voice',
        }),
      }
    )

    const understandJson: ApiResponse<UnderstandResult> = await understandRes.json()

    if (!understandRes.ok || understandJson.error || !understandJson.data) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: understandJson.error ?? 'Could not process audio — please try again' },
        { status: 503 }
      )
    }

    // Attach the raw transcript so the capture screen can show it to the user
    return NextResponse.json<ApiResponse<UnderstandResult & { transcript: string }>>({
      data:  { ...understandJson.data, transcript },
      error: null,
    })

  } catch (err) {
    console.error('[POST /api/capture/audio] unexpected:', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}
