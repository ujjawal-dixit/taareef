// app/(app)/dashboard/sign-out-button.tsx
// "use client" — calls Supabase signOut in the browser then redirects.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignOut() {
    setIsLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('[SignOutButton] Sign out error:', err)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="
        text-neutral-400 hover:text-neutral-600
        disabled:opacity-50 disabled:cursor-not-allowed
        text-sm font-sans transition-colors duration-150
        underline underline-offset-2
      "
    >
      {isLoading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
