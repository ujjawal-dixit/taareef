// app/api/recommendations/route.ts
// GET  — list all recommendations for the authenticated user
// POST — create a new recommendation
// All validation explicit. All errors logged server-side only.
// Never expose raw database errors to the client.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  ApiResponse,
  Recommendation,
  CreateRecommendationInput,
  Category,
  SourceType,
  Priority,
} from '@/lib/types'

// ============================================================
// GET /api/recommendations
// ============================================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Recommendation[]>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'You must be logged in' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as Category | null
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    // Base query — always filter by user_id and exclude dismissed
    let query = supabase
      .from('recommendations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'dismissed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/recommendations]', {
        userId: user.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { data: null, error: 'Something went wrong — please try again' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data as Recommendation[],
      error: null,
      meta: { total: count ?? 0, page: Math.floor(offset / limit) },
    })

  } catch (err) {
    console.error('[GET /api/recommendations] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST /api/recommendations
// ============================================================

// Valid category values
const VALID_CATEGORIES: Category[] = [
  'restaurant', 'bar', 'film', 'tv', 'music',
  'book', 'city', 'activity', 'podcast', 'person',
]

// Valid source types
const VALID_SOURCE_TYPES: SourceType[] = [
  'friend', 'family', 'colleague', 'instagram', 'twitter',
  'youtube', 'article', 'newsletter', 'podcast', 'self',
]

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Recommendation>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'You must be logged in' },
        { status: 401 }
      )
    }

    // Parse body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { data: null, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const input = body as Record<string, unknown>

    // Validate required fields
    if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: 'Title is required' },
        { status: 400 }
      )
    }

    if (input.title.length > 500) {
      return NextResponse.json(
        { data: null, error: 'Title must be under 500 characters' },
        { status: 400 }
      )
    }

    if (!input.category || !VALID_CATEGORIES.includes(input.category as Category)) {
      return NextResponse.json(
        { data: null, error: 'A valid category is required' },
        { status: 400 }
      )
    }

    if (!input.source_type || !VALID_SOURCE_TYPES.includes(input.source_type as SourceType)) {
      return NextResponse.json(
        { data: null, error: 'A valid source type is required' },
        { status: 400 }
      )
    }

    if (!input.source_name || typeof input.source_name !== 'string' || input.source_name.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: 'Source name is required' },
        { status: 400 }
      )
    }

    if (input.source_name.length > 200) {
      return NextResponse.json(
        { data: null, error: 'Source name must be under 200 characters' },
        { status: 400 }
      )
    }

    if (input.notes && typeof input.notes === 'string' && input.notes.length > 1000) {
      return NextResponse.json(
        { data: null, error: 'Notes must be under 1000 characters' },
        { status: 400 }
      )
    }

    // Build the insert payload
    // user_id always comes from the session — never the request body
    const insertPayload: Record<string, unknown> = {
      user_id:     user.id,
      title:       input.title.trim(),
      category:    input.category,
      source_type: input.source_type,
      source_name: input.source_name.toString().trim(),
      status:      'saved',
      reaction:    null,
      priority:    (input.priority as Priority) ?? 'medium',
      metadata:    (input.metadata as Record<string, unknown>) ?? {},
    }

    if (input.url && typeof input.url === 'string') {
      insertPayload.url = input.url
    }

    if (input.image_url && typeof input.image_url === 'string') {
      insertPayload.image_url = input.image_url
    }

    if (input.notes && typeof input.notes === 'string') {
      insertPayload.notes = input.notes.trim()
    }

    if (input.location && typeof input.location === 'object') {
      insertPayload.location = input.location
    }

    // Insert
    const { data, error } = await supabase
      .from('recommendations')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/recommendations]', {
        userId: user.id,
        category: input.category,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { data: null, error: 'Something went wrong — please try again' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: data as Recommendation, error: null },
      { status: 201 }
    )

  } catch (err) {
    console.error('[POST /api/recommendations] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}
