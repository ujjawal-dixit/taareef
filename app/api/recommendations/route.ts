// app/api/recommendations/route.ts
// GET  — list user's recommendations
// POST — create a new recommendation
// Both enforce auth via getUser(). RLS is additional guard.

import { createClient }  from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'
import type {
  ApiResponse,
  CreateRecommendationInput,
  Recommendation,
} from '@/lib/types'

const VALID_CATEGORIES = [
  'restaurant','bar','film','tv','music',
  'book','city','activity','podcast','person',
] as const

const VALID_SOURCE_TYPES = [
  'friend','family','colleague','instagram','twitter',
  'youtube','article','newsletter','podcast','self',
] as const

// ── GET /api/recommendations ──────────────────────────────────────

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category  = searchParams.get('category')
    const status    = searchParams.get('status')
    const limit     = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
    const offset    = parseInt(searchParams.get('offset') ?? '0', 10)

    let query = supabase
      .from('recommendations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'dismissed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      query = query.eq('category', category)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/recommendations]', { userId: user.id, error })
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Something went wrong — please try again' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Recommendation[]>>(
      { data: data ?? [], error: null, meta: { total: count ?? 0 } },
      { status: 200 }
    )

  } catch (err) {
    console.error('[GET /api/recommendations] Unexpected:', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}

// ── POST /api/recommendations ─────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' },
        { status: 401 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const input = body as Partial<CreateRecommendationInput>

    // Validation
    if (!input.title?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Title is required' }, { status: 400 }
      )
    }

    if (input.title.trim().length > 500) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Title must be under 500 characters' }, { status: 400 }
      )
    }

    if (!input.category || !VALID_CATEGORIES.includes(input.category as typeof VALID_CATEGORIES[number])) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Please select a category' }, { status: 400 }
      )
    }

    if (!input.source_name?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Source name is required' }, { status: 400 }
      )
    }

    if (input.source_name.trim().length > 200) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Source name must be under 200 characters' }, { status: 400 }
      )
    }

    const sourceType = input.source_type && VALID_SOURCE_TYPES.includes(input.source_type as typeof VALID_SOURCE_TYPES[number])
      ? input.source_type
      : 'friend'

    if (input.notes && input.notes.length > 1000) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Note must be under 1000 characters' }, { status: 400 }
      )
    }

    // Insert — user_id always from session, never from body
    const { data, error } = await supabase
      .from('recommendations')
      .insert({
        user_id:     user.id,
        title:       input.title.trim(),
        category:    input.category,
        source_type: sourceType,
        source_name: input.source_name.trim(),
        notes:       input.notes?.trim() ?? null,
        url:         input.url ?? null,
        image_url:   input.image_url ?? null,
        location:    input.location ?? null,
        priority:    input.priority ?? 'medium',
        metadata:    input.metadata ?? {},
        status:      'saved',
        reaction:    null,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/recommendations]', { userId: user.id, error })
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Something went wrong — please try again' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Recommendation>>(
      { data, error: null },
      { status: 201 }
    )

  } catch (err) {
    console.error('[POST /api/recommendations] Unexpected:', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}
