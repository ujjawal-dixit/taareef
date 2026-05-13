// app/(app)/dashboard/page.tsx
// Stub dashboard — confirms the full auth round-trip works.
// Replaced with the real dashboard in the next session.
// Server Component — reads the verified user from the server-side session.

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // getUser() contacts the Supabase Auth server to verify the token.
  // Never use getSession() for auth checks — it reads from cookies without verification.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    // Belt-and-suspenders — middleware already protects this route
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
          Taareef
        </h1>

        <p className="text-neutral-500 text-sm mb-8">
          Signed in as {user.email}
        </p>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm mb-6">
          <p className="text-neutral-700 text-sm leading-relaxed">
            ✅ Auth is working. Your vault is ready.<br />
            The full dashboard is coming next session.
          </p>
        </div>

        <SignOutButton />

      </div>
    </div>
  )
}
