// app/api/auth/callback/route.ts
// Supabase OAuth callback handler.
// Called by Supabase after Google completes the sign-in flow.
// Exchanges the one-time auth code for a session and sets session cookies.
// Never blocked by middleware — /api/auth is excluded from the matcher.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const oauthError = searchParams.get('error')

  // Handle error passed back from Google or Supabase
  if (oauthError) {
    console.error(
      '[auth/callback] OAuth provider error:',
      oauthError,
      searchParams.get('error_description') ?? 'no description'
    )
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (!code) {
    console.error('[auth/callback] Missing code parameter — possible CSRF or misconfiguration')
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
      console.error('[auth/callback] No user returned after successful code exchange')
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // Security: validate `next` is a relative path to prevent open redirect attacks
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

    // New users go to onboarding. Returning users go to their requested destination.
    const hasCompletedOnboarding =
      data.user.user_metadata?.has_completed_onboarding === true

    const destination = hasCompletedOnboarding ? safeNext : '/onboarding/demo'

    return NextResponse.redirect(`${origin}${destination}`)

  } catch (err) {
    // Unexpected errors — log server-side, show generic message to user
    console.error('[auth/callback] Unexpected error during session exchange:', err)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
