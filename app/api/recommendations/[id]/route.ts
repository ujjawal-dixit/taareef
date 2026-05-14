// app/api/recommendations/[id]/route.ts
// GET    — fetch single recommendation
// PATCH  — partial update
// DELETE — soft delete (status → dismissed)

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'
import type { ApiResponse, Recommendation, UpdateRecommendationInput } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

const VALID_REACTIONS = ['loved','good','okay','skip'] as const
const VALID_PRIORITIES = ['low','medium','high'] as const

// ── GET ───────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id }   = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' }, { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Recommendation not found' }, { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<Recommendation>>(
      { data, error: null }, { status: 200 }
    )

  } catch (err) {
    console.error('[GET /api/recommendations/[id]]', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}

// ── PATCH ─────────────────────────────────────────────────────────

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id }   = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' }, { status: 401 }
      )
    }

    let body: unknown
    try { body = await request.json() }
    catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid request body' }, { status: 400 }
      )
    }

    const input = body as Partial<UpdateRecommendationInput>

    if (Object.keys(input).length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'At least one field must be provided' }, { status: 400 }
      )
    }

    // Validate fields that are provided
    if (input.reaction !== undefined &&
        !VALID_REACTIONS.includes(input.reaction as typeof VALID_REACTIONS[number])) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid reaction' }, { status: 400 }
      )
    }

    if (input.priority !== undefined &&
        !VALID_PRIORITIES.includes(input.priority as typeof VALID_PRIORITIES[number])) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid priority' }, { status: 400 }
      )
    }

    // Build safe update payload — never allow user_id, id, created_at
    const updatePayload: Record<string, unknown> = {}
    if (input.title       !== undefined) updatePayload.title       = input.title.trim()
    if (input.source_name !== undefined) updatePayload.source_name = input.source_name.trim()
    if (input.source_type !== undefined) updatePayload.source_type = input.source_type
    if (input.notes       !== undefined) updatePayload.notes       = input.notes.trim() || null
    if (input.status      !== undefined) updatePayload.status      = input.status
    if (input.reaction    !== undefined) updatePayload.reaction    = input.reaction
    if (input.priority    !== undefined) updatePayload.priority    = input.priority
    if (input.location    !== undefined) updatePayload.location    = input.location
    if (input.metadata    !== undefined) updatePayload.metadata    = input.metadata

    const { data, error } = await supabase
      .from('recommendations')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      console.error('[PATCH /api/recommendations/[id]]', { id, userId: user.id, error })
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Recommendation not found' }, { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<Recommendation>>(
      { data, error: null }, { status: 200 }
    )

  } catch (err) {
    console.error('[PATCH /api/recommendations/[id]]', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}

// ── DELETE (soft delete) ──────────────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id }   = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' }, { status: 401 }
      )
    }

    // Soft delete only — never SQL DELETE
    const { data, error } = await supabase
      .from('recommendations')
      .update({ status: 'dismissed' })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Recommendation not found' }, { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id: data.id }, error: null }, { status: 200 }
    )

  } catch (err) {
    console.error('[DELETE /api/recommendations/[id]]', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}
