import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'
import type { ApiResponse, Recommendation, UpdateRecommendationInput } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params; const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'You must be logged in' }, { status: 401 })
    const { data, error } = await supabase.from('recommendations').select('*').eq('id', id).eq('user_id', user.id).single()
    if (error || !data) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Recommendation not found' }, { status: 404 })
    return NextResponse.json<ApiResponse<Recommendation>>({ data, error: null })
  } catch (err) { console.error(err); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params; const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'You must be logged in' }, { status: 401 })
    let body: Partial<UpdateRecommendationInput>
    try { body = await request.json() } catch { return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid request body' }, { status: 400 }) }
    const payload: Record<string,unknown> = {}
    if (body.title       !== undefined) payload.title       = body.title.trim()
    if (body.source_name !== undefined) payload.source_name = body.source_name.trim()
    if (body.source_type !== undefined) payload.source_type = body.source_type
    if ((body as Record<string,unknown>).category !== undefined) payload.category = (body as Record<string,unknown>).category
    if (body.notes       !== undefined) payload.notes       = body.notes.trim() || null
    if (body.status      !== undefined) payload.status      = body.status
    if (body.reaction    !== undefined) payload.reaction    = body.reaction
    if (body.priority    !== undefined) payload.priority    = body.priority
    if (body.location    !== undefined) payload.location    = body.location
    if (body.image_url   !== undefined) payload.image_url   = body.image_url
    if (body.metadata    !== undefined) payload.metadata    = body.metadata
    const { data, error } = await supabase.from('recommendations').update(payload).eq('id', id).eq('user_id', user.id).select().single()
    if (error || !data) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Recommendation not found' }, { status: 404 })
    return NextResponse.json<ApiResponse<Recommendation>>({ data, error: null })
  } catch (err) { console.error(err); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'You must be logged in' }, { status: 401 })
    }

    // Fetch the record first so we can clean up its stored image
    const { data: rec, error: fetchErr } = await supabase
      .from('recommendations')
      .select('id, image_url, metadata')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !rec) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Recommendation not found' }, { status: 404 })
    }

    // Hard-delete from the database
    const { error: deleteErr } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteErr) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Could not delete' }, { status: 500 })
    }

    // Clean up user-uploaded poster from Supabase Storage (best-effort).
    // Only removes files in the posters bucket — TMDB/Foursquare/Spotify
    // images are external URLs and need no cleanup.
    const meta = (rec.metadata as Record<string, unknown>) ?? {}
    if (meta.user_uploaded && rec.image_url) {
      // Path structure: posters/{user_id}/{rec_id}.{ext}
      const ext  = rec.image_url.split('.').pop()?.split('?')[0] ?? 'jpg'
      const path = `${user.id}/${id}.${ext}`
      // Fire-and-forget — don't block the response on storage cleanup
      supabase.storage.from('posters').remove([path]).catch(console.error)
    }

    return NextResponse.json<ApiResponse<{ id: string }>>({ data: { id }, error: null })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 })
  }
}
