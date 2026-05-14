// app/page.tsx
// Root. Redirects authenticated users to dashboard.
// Unauthenticated users: redirect to login.
// Middleware handles this for subsequent navigations.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
