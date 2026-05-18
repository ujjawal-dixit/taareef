import { createClient }  from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'
import type { ApiResponse, CreateRecommendationInput, Recommendation } from '@/lib/types'

const VALID_CATEGORIES = ['restaurant','bar','film','tv','music','book','city','activity','podcast','person'] as const
const VALID_SOURCES    = ['friend','family','colleague','instagram','twitter','youtube','article','newsletter','podcast','self'] as const

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'You must be logged in' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit    = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 100)
    const offset   = parseInt(searchParams.get('offset') ?? '0', 10)
    let query = supabase.from('recommendations').select('*', { count: 'exact' })
      .eq('user_id', user.id).neq('status', 'dismissed')
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    if (category) query = query.eq('category', category)
    const { data, error, count } = await query
    if (error) { console.error('[GET /api/recommendations]', error); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }
    return NextResponse.json<ApiResponse<Recommendation[]>>({ data: data ?? [], error: null, meta: { total: count ?? 0 } })
  } catch (err) { console.error(err); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'You must be logged in' }, { status: 401 })
    let body: Partial<CreateRecommendationInput>
    try { body = await request.json() } catch { return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid request body' }, { status: 400 }) }
    if (!body.title?.trim()) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Title is required' }, { status: 400 })
    if (!body.category || !VALID_CATEGORIES.includes(body.category as typeof VALID_CATEGORIES[number])) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Please select a category' }, { status: 400 })
    if (!body.source_name?.trim()) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Source name is required' }, { status: 400 })
    const sourceType = body.source_type && VALID_SOURCES.includes(body.source_type as typeof VALID_SOURCES[number]) ? body.source_type : 'friend'
    const { data, error } = await supabase.from('recommendations').insert({
      user_id: user.id, title: body.title.trim(), category: body.category,
      source_type: sourceType, source_name: body.source_name.trim(),
      notes: body.notes?.trim() ?? null, url: body.url ?? null, image_url: body.image_url ?? null,
      location: body.location ?? null, priority: body.priority ?? 'medium',
      metadata: body.metadata ?? {}, status: 'saved', reaction: null,
    }).select().single()
    if (error) { console.error('[POST /api/recommendations]', error); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }
    return NextResponse.json<ApiResponse<Recommendation>>({ data, error: null }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }
}
