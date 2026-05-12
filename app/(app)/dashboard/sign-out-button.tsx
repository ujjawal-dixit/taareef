// app/(app)/dashboard/sign-out-button.tsx
// "use client" — needs browser-side Supabase to sign out.

'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="
        text-neutral-400 hover:text-neutral-600
        text-sm font-sans transition-colors duration-150
        underline underline-offset-2
      "
    >
      Sign out
    </button>
  )
}
