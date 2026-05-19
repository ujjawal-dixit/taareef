'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      style={{
        width:                   '100%',
        height:                  '48px',
        borderRadius:            '12px',
        // Minimal: just a hint of crimson, not a filled button
        border:                  '1px solid rgba(200,21,30,0.18)',
        background:              'rgba(200,21,30,0.04)',
        color:                   '#c8151e',
        fontFamily:              'var(--font-rajdhani), system-ui, sans-serif',
        fontSize:                '13px',
        fontWeight:              700,
        letterSpacing:           '0.08em',
        textTransform:           'uppercase',
        cursor:                  loading ? 'not-allowed' : 'pointer',
        opacity:                 loading ? 0.6 : 1,
        transition:              'all 160ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
