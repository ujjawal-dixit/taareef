// app/(app)/dashboard/page.tsx
// The home vault — the Friday evening screen.
// Adaptive: only shows categories with ≥1 save.
// Category bar always shows all 10.
// Nudge question at top on every visit until answered.
// Server Component — fetches data server-side, passes to client grid.

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export const metadata: Metadata = {
  title: 'Your vault',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch all recommendations — sorted by created_at DESC
  const { data: recommendations, error: recsError } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })

  if (recsError) {
    console.error('[Dashboard] Failed to fetch recommendations:', recsError.message)
  }

  // Get user's nudge question progress from user metadata
  const nudgeAnsweredCount =
    (user.user_metadata?.nudge_questions_answered as number) ?? 0

  return (
    <DashboardClient
      recommendations={recommendations ?? []}
      userId={user.id}
      nudgeAnsweredCount={nudgeAnsweredCount}
    />
  )
}
