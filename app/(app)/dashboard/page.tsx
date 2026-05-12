// app/(app)/dashboard/page.tsx
// Stub dashboard for V1 scaffolding.
// Purpose: confirm the full OAuth round-trip (login → callback → dashboard) works.
// The real dashboard (category list, cards, add flow) is built in the next session.
// This page is a Server Component — reads the user from the server-side session.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Belt-and-suspenders auth check — middleware also protects this route
  if (error || !user) {
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

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm mb-4">
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
