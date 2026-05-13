// app/api/recommendations/[id]/route.ts
// GET   — fetch a single recommendation by ID
// PATCH — partial update (status, reaction, notes, metadata, etc.)
// DELETE — soft delete (sets status to 'dismissed')

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  ApiResponse,
  Recommendation,
  UpdateRecommendationInput,
  Reaction,
} from '@/lib/types'

type RouteParams = {
  params: { id: string }
}

// ============================================================
// GET /api/recommendations/[id]
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Recommendation>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'You must be logged in' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)   // RLS also enforces this
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null, error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: data as Recommendation, error: null })

  } catch (err) {
    console.error('[GET /api/recommendations/[id]] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}

// ============================================================
// PATCH /api/recommendations/[id]
// Partial update — only provided fields change.
// ============================================================

const VALID_REACTIONS: Reaction[] = ['loved', 'good', 'okay', 'skip']

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Recommendation>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'You must be logged in' },
        { status: 401 }
      )
    }

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

    const input = body as UpdateRecommendationInput

    // At least one field must be provided
    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { data: null, error: 'At least one field must be provided' },
        { status: 400 }
      )
    }

    // Validate reaction if provided
    if (input.reaction && !VALID_REACTIONS.includes(input.reaction)) {
      return NextResponse.json(
        { data: null, error: 'Invalid reaction value' },
        { status: 400 }
      )
    }

    // Build update payload — only include provided fields
    // Never allow updating user_id, id, created_at
    const updatePayload: Record<string, unknown> = {}

    const allowedFields: (keyof UpdateRecommendationInput)[] = [
      'title', 'source_name', 'source_type', 'notes',
      'status', 'reaction', 'priority', 'location',
      'metadata', 'url', 'image_url',
    ]

    for (const field of allowedFields) {
      if (field in input && input[field] !== undefined) {
        updatePayload[field] = input[field]
      }
    }

    const { data, error } = await supabase
      .from('recommendations')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Recommendation not found' },
          { status: 404 }
        )
      }

      console.error('[PATCH /api/recommendations/[id]]', {
        userId: user.id,
        id: params.id,
        error: error?.message,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json(
        { data: null, error: 'Something went wrong — please try again' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data as Recommendation, error: null })

  } catch (err) {
    console.error('[PATCH /api/recommendations/[id]] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}

// ============================================================
// DELETE /api/recommendations/[id]
// Soft delete — sets status to 'dismissed'. Never hard deletes.
// ============================================================

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'You must be logged in' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('recommendations')
      .update({ status: 'dismissed' })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null, error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { id: data.id }, error: null })

  } catch (err) {
    console.error('[DELETE /api/recommendations/[id]] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}
