// app/(app)/dashboard/page.tsx
// Mosaic home — fetches category counts and latest card per category.
// Single query, not N+1. Client receives pre-grouped data.

import { createClient }    from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import { redirect }        from 'next/navigation'
import { CATEGORIES }      from '@/constants/categories'
import type { Metadata }   from 'next'
import type { Recommendation } from '@/lib/types'

export const metadata: Metadata = { title: 'taareef' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Single query — all non-dismissed recommendations, newest first
  const { data: all } = await supabase
    .from('recommendations')
    .select('id, title, category, source_name, image_url, reaction, status, metadata, created_at')
    .eq('user_id', user.id)
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })
    .limit(200)

  const recs = (all ?? []) as Recommendation[]

  // Group client-side — no extra queries
  const grouped: Record<string, Recommendation[]> = {}
  recs.forEach(r => {
    if (!grouped[r.category]) grouped[r.category] = []
    grouped[r.category].push(r)
  })

  // Build tile data — one object per category that has saves
  const tiles = CATEGORIES
    .filter(cat => (grouped[cat.id]?.length ?? 0) > 0)
    .map(cat => ({
      category:   cat,
      count:      grouped[cat.id].length,
      latest:     grouped[cat.id][0],      // newest first
      hasReacted: grouped[cat.id].some(r => r.reaction !== null),
    }))

  const totalSaved = recs.length
  const userName   = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'You'
  const userEmail  = user.email ?? ''

  return (
    <DashboardClient
      tiles={tiles}
      totalSaved={totalSaved}
      userName={userName}
      userEmail={userEmail}
      userId={user.id}
    />
  )
}
