// app/(app)/layout.tsx
// Layout for all authenticated pages.
// Provides: ToastProvider, BottomNav, FAB, RadialCaptureScreen.
// Server Component wrapper — interactive bits are client components.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/features/navigation/app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <AppShell>{children}</AppShell>
}
