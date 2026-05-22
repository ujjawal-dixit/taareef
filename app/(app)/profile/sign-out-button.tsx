'use client'

// app/(app)/profile/sign-out-button.tsx
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
        height:                  '52px',
        borderRadius:            '12px',
        border:                  '1px solid rgba(200,21,30,0.25)',
        background:              'rgba(200,21,30,0.06)',
        color:                   '#c8151e',
        fontFamily:              'var(--f-ui)',
        fontSize:                '14px',
        fontWeight:              700,
        letterSpacing:           '0.06em',
        textTransform:           'uppercase',
        cursor:                  loading ? 'not-allowed' : 'pointer',
        opacity:                 loading ? 0.6 : 1,
        transition:              'background 160ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
