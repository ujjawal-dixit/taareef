// lib/supabase/anon.ts
//
// Anonymous session helpers for the onboarding demo.
//
// WHY (Session 15, 2026-07-27):
// Before this, a visitor's first save lived in React state only. They
// typed a real recommendation, watched a card appear, read "your vault
// is starting", signed in — and landed on an empty dashboard. The save
// was never persisted anywhere.
//
// Rather than store it in localStorage and migrate it after sign-in
// (a step that can fail silently), the demo now creates a real but
// anonymous Supabase session. The save is a genuine row from the start.
// When the visitor signs in, their Google identity is LINKED to that
// same user id — so nothing moves and nothing can be lost in transit.
//
// Guard rails already in place before this shipped:
//   - RLS confines every session, anonymous or not, to its own rows
//   - migration 005 caps an anonymous session at 3 saves
//   - app/(onboarding)/layout.tsx forces dynamic rendering

import { createClient } from './client'

/**
 * Returns the current session's user id, creating an anonymous session
 * if there isn't one.
 *
 * Called at the moment of the first save, not on page load — someone
 * who only browses the demo never becomes a user, which keeps abandoned
 * accounts and monthly-active-user count down.
 *
 * Returns null if a session could not be established, so the caller can
 * show an honest error rather than pretend the save succeeded.
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
 * True when the current session belongs to an anonymous user.
 *
 * Used by the sign-in button to decide between linking a Google identity
 * to the existing anonymous user (keeping their demo save) and a plain
 * sign-in.
 */
export async function isAnonymous(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return Boolean(user?.is_anonymous)
  } catch {
    return false
  }
}
