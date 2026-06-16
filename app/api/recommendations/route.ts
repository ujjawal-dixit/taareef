// app/api/recommendations/route.ts
// GET (list) + POST (create). 6-category validation.

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil }                from '@vercel/functions'
import { createClient } from '@/lib/supabase/server'
import { VALID_CATEGORIES, isValidCategory } from '@/lib/types'
import type { ApiResponse, Recommendation, CreateRecommendationInput } from '@/lib/types'

const VALID_SOURCE_TYPES = ['friend','family','colleague','instagram','twitter','youtube','article','newsletter','podcast','self']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'You must be logged in' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status   = searchParams.get('status')
    const limit    = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
    const offset   = parseInt(searchParams.get('offset') ?? '0', 10)

    if (category && !isValidCategory(category)) return NextResponse.json<ApiResponse<null>>({ data: null, error: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })

    let query = supabase.from('recommendations').select('*', { count: 'exact' })
      .eq('user_id', user.id).neq('status', 'dismissed')
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)
    if (status)   query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) { console.error('[GET /api/recommendations]', error); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }

    return NextResponse.json<ApiResponse<Recommendation[]>>({ data: (data ?? []) as Recommendation[], error: null, meta: { total: count ?? 0 } })
  } catch (err) {
    console.error('[GET /api/recommendations] unexpected', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'You must be logged in' }, { status: 401 })

    const body: CreateRecommendationInput = await request.json()

    if (!body.title?.trim())                               return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Title is required' }, { status: 400 })
    if (body.title.length > 500)                           return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Title is too long' }, { status: 400 })
    if (!body.category || !isValidCategory(body.category)) return NextResponse.json<ApiResponse<null>>({ data: null, error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
    if (!body.source_type || !VALID_SOURCE_TYPES.includes(body.source_type)) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid source type' }, { status: 400 })
    if (!body.source_name?.trim())                         return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Source name is required' }, { status: 400 })
    if (body.notes && body.notes.length > 1000)            return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Note is too long' }, { status: 400 })
    if (body.url) { try { new URL(body.url) } catch { return NextResponse.json<ApiResponse<null>>({ data: null, error: 'URL is not valid' }, { status: 400 }) } }

    const { data, error } = await supabase.from('recommendations').insert({
      user_id: user.id, title: body.title.trim(), category: body.category,
      source_type: body.source_type, source_name: body.source_name.trim(),
      url: body.url ?? null, image_url: body.image_url ?? null,
      notes: body.notes?.trim() ?? null, location: body.location ?? null,
      priority: body.priority ?? 'medium', status: 'saved', reaction: null,
      metadata: body.metadata ?? {},
    }).select().single()

    if (error) { console.error('[POST /api/recommendations]', error); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }

    // ── Save-time enrichment ─────────────────────────────────────────
    // Fire enrichment immediately after save, server-side.
    // waitUntil keeps the serverless function alive until enrichment
    // completes — the save response has already been sent to the user.
    // Auth cookie is forwarded so the enrich route authenticates correctly.
    // Books use a dedicated route; dine/do/visit are enriched by Places (step 4).
    const enrichableCategories = ['watch', 'listen']
    if (enrichableCategories.includes(data.category)) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      if (appUrl) {
        waitUntil(
          fetch(`${appUrl}/api/enrich/${data.id}`, {
            method:  'POST',
            headers: { cookie: request.headers.get('cookie') ?? '' },
          }).catch((err) => console.error('[save-time enrich] failed for', data.id, err))
        )
      }
    }

    return NextResponse.json<ApiResponse<Recommendation>>({ data: data as Recommendation, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/recommendations] unexpected', err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 })
  }
}
