// app/api/user/preferences/route.ts
// PATCH — save nudge question answers to user metadata.
// Updates Supabase auth user_metadata — no separate table needed.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/types'

export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
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

    const { questionId, value, nudgeAnsweredCount } = body as {
      questionId?: string
      value?: string
      nudgeAnsweredCount?: number
    }

    if (!questionId || !value || nudgeAnsweredCount === undefined) {
      return NextResponse.json(
        { data: null, error: 'questionId, value, and nudgeAnsweredCount are required' },
        { status: 400 }
      )
    }

    // Merge with existing user metadata
    const existingPreferences =
      (user.user_metadata?.preference_data as Record<string, string>) ?? {}

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        nudge_questions_answered: nudgeAnsweredCount,
        preference_data: {
          ...existingPreferences,
          [questionId]: value,
        },
      },
    })

    if (updateError) {
      console.error('[PATCH /api/user/preferences]', {
        userId: user.id,
        questionId,
        error: updateError.message,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { data: null, error: 'Something went wrong — please try again' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { success: true }, error: null })

  } catch (err) {
    console.error('[PATCH /api/user/preferences] Unexpected error:', err)
    return NextResponse.json(
      { data: null, error: 'Something went wrong — please try again' },
      { status: 500 }
    )
  }
}
