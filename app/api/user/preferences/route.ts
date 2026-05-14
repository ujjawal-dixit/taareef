// app/api/user/preferences/route.ts
// PATCH — update user preferences (nudge count, category defaults, etc.)

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'
import type { ApiResponse } from '@/lib/types'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'You must be logged in' }, { status: 401 }
      )
    }

    let body: Record<string, unknown>
    try { body = await request.json() }
    catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid request body' }, { status: 400 }
      )
    }

    const updatePayload: Record<string, unknown> = {}

    if (typeof body.nudgeAnsweredCount === 'number') {
      updatePayload.nudge_answered_count = body.nudgeAnsweredCount
    }

    if (Array.isArray(body.defaultCategories)) {
      updatePayload.default_categories = body.defaultCategories
    }

    if (typeof body.onboardingComplete === 'boolean') {
      updatePayload.onboarding_complete = body.onboardingComplete
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Nothing to update' }, { status: 400 }
      )
    }

    // Upsert — creates if not exists, updates if exists
    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        { user_id: user.id, ...updatePayload },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[PATCH /api/user/preferences]', { userId: user.id, error })
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<{ updated: boolean }>>(
      { data: { updated: true }, error: null }, { status: 200 }
    )

  } catch (err) {
    console.error('[PATCH /api/user/preferences]', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong — please try again' }, { status: 500 }
    )
  }
}
