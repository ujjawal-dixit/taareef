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

    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    const visionRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Look at this screenshot and extract any recommendation it contains.
Return ONLY valid JSON, no prose, no markdown fences.

Valid categories: watch, listen, read, eat, drink, go, do, see
- watch: films, TV shows, series
- listen: music, albums, podcasts
- read: books
- eat: restaurants, food places
- drink: bars, cafes for drinks, wine bars
- go: cities, countries, travel destinations
- do: activities, experiences, adventures, hikes
- see: exhibitions, galleries, performances, theatre, concerts

Valid source types: friend, family, colleague, instagram, twitter, youtube, article, newsletter, podcast, self

JSON shape:
{
  "title": string or null,
  "category": one of the valid categories or null,
  "source_type": one of the valid source types or null,
  "source_name": string or null,
  "notes": string (max 100 chars) or null,
  "url": string or null,
  "location": { "city": string, "country": string } or null,
  "confidence": "high" | "medium" | "low"
}`,
              },
              {
                type: 'image_url',
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
        { data: null, error: 'Could not read the screenshot — please try again' }, { status: 503 }
      )
    }

    const visionJson = await visionRes.json()
    const rawContent = visionJson.choices?.[0]?.message?.content ?? ''

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(rawContent.replace(/```json|```/g, '').trim())
    } catch {
      console.error('[ocr/parse]', rawContent)
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Couldn't read a recommendation from this screenshot" }, { status: 422 }
      )
    }

    return NextResponse.json<ApiResponse<Record<string, unknown>>>({
      data: extracted,
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/capture/ocr] unexpected', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}
