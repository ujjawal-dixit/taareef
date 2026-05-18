import { createClient }    from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import { redirect }        from 'next/navigation'
import type { Metadata }   from 'next'

export const metadata: Metadata = { title: 'taareef' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: recommendations, error: recsError } = await supabase
    .from('recommendations')
    .select('*')
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })
    .limit(100)

  if (recsError) console.error('[Dashboard]', recsError.message)

  let nudgeAnsweredCount = 0
  try {
    const { data: prefs } = await supabase
      .from('user_preferences').select('nudge_answered_count')
      .eq('user_id', user.id).maybeSingle()
    nudgeAnsweredCount = prefs?.nudge_answered_count ?? 0
  } catch {}

  const userName  = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'You'
  const userEmail = user.email ?? ''

  return (
    <DashboardClient
      recommendations={recommendations ?? []}
      userId={user.id}
      nudgeAnsweredCount={nudgeAnsweredCount}
      userEmail={userEmail}
      userName={userName}
    />
  )
}
