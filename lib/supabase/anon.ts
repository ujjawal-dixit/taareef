// lib/supabase/anon.ts
//
// Anonymous session helpers for the onboarding demo.
//
// WHY (Session 15, 2026-07-27, revised 2026-07-28):
// Before this, a visitor's first save lived in React state only. They
// typed a real recommendation, watched a card appear, read "your vault
// is starting", signed in — and landed on an empty dashboard.
//
// The demo now creates a real but anonymous Supabase session, so the
// save is a genuine row from the moment it is made.
//
// REVISION — why identity linking was abandoned:
// The first version called supabase.auth.linkIdentity() to attach the
// Google identity to the anonymous user, keeping one user id. Verified
// against auth.identities: it never succeeded once. It is a redirect
// flow, so errors surface after the browser has left and cannot be
// caught client-side, and it cannot work at all when the Google account
// already has a vault. The failure was silent and looked like success —
// the visitor stayed anonymous while believing they had signed in.
//
// Now: sign in normally, then move the rows server-side. The anonymous
// user id travels in a short-lived cookie so the OAuth callback can read
// it before the dashboard renders, avoiding a flash of an empty vault.

import { createClient } from './client'

/** Cookie carrying the anonymous user id across the OAuth redirect. */
export const CLAIM_COOKIE = 'taareef_claim'

/**
 * Returns the current session's user id, creating an anonymous session
 * if there isn't one.
 *
 * Called at the moment of the first save, not on page load — someone who
 * only browses the demo never becomes a user, which keeps abandoned
 * accounts and monthly-active-user count down.
 *
 * Returns null if no session could be established, so the caller shows
 * an honest error rather than pretending the save worked.
 */
export async function ensureSession(): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) {
      console.error('[anon] signInAnonymously failed:', error?.message)
      return null
    }
    return data.user.id
  } catch (err) {
    console.error('[anon] ensureSession threw:', err)
    return null
  }
}

/**
 * If the current session is anonymous, leave its user id in a cookie so
 * the OAuth callback can move its saves to the account that signs in.
 *
 * SameSite=Lax is required: the OAuth return is a top-level navigation
 * from Google, and a Strict cookie would not be sent with it.
 *
 * Ten minutes is ample for a sign-in round trip and short enough that a
 * stale value cannot linger. The server also refuses any source older
 * than two hours, so this cookie is a convenience, not the security
 * boundary — see migration 006.
 */
export async function markSessionForClaim(): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.is_anonymous) return

    document.cookie = `${CLAIM_COOKIE}=${user.id}; path=/; max-age=600; SameSite=Lax`
  } catch (err) {
    // Never block sign-in over this. Worst case the demo save stays with
    // the anonymous user and is removed by the cleanup job.
    console.warn('[anon] markSessionForClaim failed:', err)
  }
}
