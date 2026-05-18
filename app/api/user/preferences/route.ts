import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'
import type { ApiResponse } from '@/lib/types'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: ae } = await supabase.auth.getUser()
    if (ae || !user) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'You must be logged in' }, { status: 401 })
    let body: Record<string,unknown>
    try { body = await request.json() } catch { return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Invalid request body' }, { status: 400 }) }
    const payload: Record<string,unknown> = {}
    if (typeof body.nudgeAnsweredCount === 'number') payload.nudge_answered_count = body.nudgeAnsweredCount
    if (Array.isArray(body.defaultCategories))        payload.default_categories  = body.defaultCategories
    if (typeof body.onboardingComplete === 'boolean') payload.onboarding_complete = body.onboardingComplete
    const { error } = await supabase.from('user_preferences').upsert({ user_id: user.id, ...payload }, { onConflict: 'user_id' })
    if (error) { console.error(error); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }
    return NextResponse.json<ApiResponse<{ updated: boolean }>>({ data: { updated: true }, error: null })
  } catch (err) { console.error(err); return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Something went wrong' }, { status: 500 }) }
}
