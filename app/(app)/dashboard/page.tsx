// app/(app)/dashboard/page.tsx
// Server Component — fetches recommendations and renders dashboard.
// Auth is handled by middleware — if we're here, user is authenticated.

import { createClient }    from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import { redirect }        from 'next/navigation'
import type { Metadata }   from 'next'

export const metadata: Metadata = {
  title: 'taareef',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verify session (getUser — not getSession)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch all non-dismissed recommendations, newest first
  const { data: recommendations, error: fetchError } = await supabase
    .from('recommendations')
    .select('*')
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })
    .limit(50)

  if (fetchError) {
    console.error('[Dashboard] fetch failed:', fetchError)
  }

  // Fetch user preferences for nudge count
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('nudge_answered_count')
    .eq('user_id', user.id)
    .single()

  return (
    <DashboardClient
      recommendations={recommendations ?? []}
      userId={user.id}
      nudgeAnsweredCount={prefs?.nudge_answered_count ?? 0}
    />
  )
}
