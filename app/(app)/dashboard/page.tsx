// app/(app)/dashboard/page.tsx
// Server Component. Fetches recommendations server-side.
// user_preferences: graceful fallback — table may not exist yet.
// Never crashes on missing table — returns nudgeAnsweredCount: 0.

import { createClient }    from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import { redirect }        from 'next/navigation'
import type { Metadata }   from 'next'

export const metadata: Metadata = { title: 'taareef' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Fetch recommendations — this table always exists
  const { data: recommendations, error: recsError } = await supabase
    .from('recommendations')
    .select('*')
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })
    .limit(50)

  if (recsError) {
    console.error('[Dashboard] recommendations fetch failed:', recsError.message)
  }

  // user_preferences — table may not exist yet in this deployment.
  // We attempt the fetch but never crash if it fails.
  let nudgeAnsweredCount = 0
  try {
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('nudge_answered_count')
      .eq('user_id', user.id)
      .maybeSingle() // maybeSingle() returns null instead of throwing when no row

    nudgeAnsweredCount = prefs?.nudge_answered_count ?? 0
  } catch {
    // Table doesn't exist yet — safe to ignore, use default 0
  }

  return (
    <DashboardClient
      recommendations={recommendations ?? []}
      userId={user.id}
      nudgeAnsweredCount={nudgeAnsweredCount}
    />
  )
}
