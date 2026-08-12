import { createClient }   from '@/lib/supabase/server'
import { CLAIM_COOKIE }   from '@/lib/supabase/anon'
import { NextResponse, type NextRequest } from 'next/server'

// app/api/auth/callback/route.ts
//
// Exchanges the OAuth code for a session, then — if the visitor arrived
// from the onboarding demo — moves their anonymous session's saves onto
// the account they just signed in with.
//
// WHY THE TRANSFER HAPPENS HERE (Session 15, 2026-07-28):
// Doing it server-side, before the redirect to the dashboard, means the
// vault is already correct the first time it renders. A client-side
// transfer would show an empty or short vault for a moment first.
//
// The claim is best-effort by design. If it fails the visitor is still
// signed in correctly; only the demo card is left behind, and the
// cleanup job removes the orphaned anonymous user later. Sign-in must
// never fail because a nice-to-have step did.
//
// The real guards live in the database — see migration 006. The cookie
// only carries the id; it proves nothing on its own.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[AuthCallback]', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const response = NextResponse.redirect(`${origin}${next}`)

    const anonUserId = request.cookies.get(CLAIM_COOKIE)?.value
    if (anonUserId) {
      // Always clear the cookie, whatever happens next — a stale value
      // must not follow the user into their next sign-in.
      response.cookies.set(CLAIM_COOKIE, '', { path: '/', maxAge: 0 })

      try {
        // Session 17: claim_anonymous_saves refused when the anonymous session
        // had zero saves — which is exactly the browse-and-leave first session
        // whose events we most want. claim_anonymous_session moves
        // recommendations, events AND search_log in one transaction.
        // Returns jsonb, not integer.
        const { data: claimed, error: claimError } = await supabase
          .rpc('claim_anonymous_session', { anon_user_id: anonUserId })

        if (claimError) {
          console.error('[AuthCallback] claim failed:', claimError.message)
        } else {
          const result = claimed as {
            ok: boolean
            reason?: string
            recommendations?: number
            events?: number
            searches?: number
          } | null

          if (result?.ok) {
            console.log(
              `[AuthCallback] claimed ${result.recommendations ?? 0} save(s), ` +
              `${result.events ?? 0} event(s), ${result.searches ?? 0} search(es) from ${anonUserId}`,
            )
          } else {
            console.log(`[AuthCallback] claim declined (${result?.reason ?? 'unknown'}) for ${anonUserId}`)
          }
        }
      } catch (claimErr) {
        console.error('[AuthCallback] claim threw:', claimErr)
      }
    }

    return response

  } catch (err) {
    console.error('[AuthCallback]', err)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
