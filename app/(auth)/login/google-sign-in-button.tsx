'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAnonymous } from '@/lib/supabase/anon'

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string|null>(null)

  async function handleSignIn() {
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const options  = {
        redirectTo:  `${window.location.origin}/api/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      }

      // If the visitor came through the onboarding demo, they already have
      // an anonymous session holding their first save. Linking attaches
      // their Google identity to that SAME user id, so the save carries
      // over with nothing to migrate — the step that used to lose it.
      if (await isAnonymous()) {
        const { error: linkError } = await supabase.auth.linkIdentity({
          provider: 'google',
          options,
        })
        if (!linkError) return

        // Linking fails when that Google account already has a Taareef
        // vault. Signing them into their existing account is the right
        // outcome — their real vault matters more than one demo save.
        // The orphaned anonymous user is removed by the cleanup job.
        console.warn('[signin] link failed, falling back to sign-in:', linkError.message)
      }

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options,
      })
      if (authError) throw authError
    } catch { setError("Couldn't sign in — please try again"); setLoading(false) }
  }

  return (
    <div>
      <button onClick={handleSignIn} disabled={loading}
        style={{
          width: '100%', padding: '15px 20px', borderRadius: '12px',
          border: '1px solid rgba(31,206,148,0.30)', background: 'rgba(31,206,148,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          WebkitTapHighlightColor: 'transparent',
        }}>
        {!loading && (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        <span style={{
          fontFamily: 'var(--f-ui)',
          fontSize: '15px', fontWeight: 700, letterSpacing: '0.04em',
          textTransform: 'uppercase', color: 'rgba(240,230,200,0.95)',
        }}>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </span>
      </button>
      {error && <p role="alert" style={{ fontFamily: 'var(--f-body)', fontSize: '12px', color: '#c8151e', textAlign: 'center', marginTop: '12px' }}>{error}</p>}
    </div>
  )
}
