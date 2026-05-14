// app/api/auth/callback/route.ts
// Supabase OAuth callback. Exchanges auth code for session.
// MUST be excluded from middleware matcher — never intercepted.

import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    console.error('[AuthCallback] No code in request')
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[AuthCallback] Exchange failed:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    return NextResponse.redirect(`${origin}${next}`)

  } catch (err) {
    console.error('[AuthCallback] Unexpected error:', err)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
