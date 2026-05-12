// app/api/auth/callback/route.ts
// Supabase OAuth callback handler.
// Called by Supabase after Google completes the sign-in flow.
// Exchanges the auth code for a session and sets session cookies.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  // Handle OAuth error from Google/Supabase
  if (error) {
    console.error('[auth/callback] OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (!code) {
    console.error('[auth/callback] No code in callback — possible CSRF or misconfiguration')
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  try {
    const supabase = await createClient()

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[auth/callback] Code exchange failed:', exchangeError.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    if (!data.user) {
      console.error('[auth/callback] No user returned after code exchange')
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // Determine redirect destination:
    // New users → onboarding. Existing users → dashboard (or the requested `next` URL).
    // We use user_metadata to track whether onboarding has been completed.
    const hasCompletedOnboarding = data.user.user_metadata?.has_completed_onboarding === true

    // Security: ensure `next` is a relative path, not an open redirect
    const safeNext = next.startsWith('/') ? next : '/dashboard'
    const redirectUrl = hasCompletedOnboarding ? safeNext : '/onboarding/demo'

    return NextResponse.redirect(`${origin}${redirectUrl}`)

  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
