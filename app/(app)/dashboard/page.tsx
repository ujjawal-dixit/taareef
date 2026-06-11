// app/(app)/dashboard/page.tsx
// Fetches recommendation counts + user preferences.
// First-run detection: if no preferences row → redirect to /onboarding/categories.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'
import type { Category } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // ── Fetch recommendation counts per category ──────────────────────────────
  const { data: recs } = await supabase
    .from('recommendations')
    .select('category')
    .eq('user_id', user.id)
    .neq('status', 'dismissed')

  const counts: Record<string, number> = {}
  if (recs) {
    for (const rec of recs) {
      counts[rec.category] = (counts[rec.category] ?? 0) + 1
    }
  }

  // ── Fetch user preferences ────────────────────────────────────────────────
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('default_categories, onboarding_complete')
    .eq('user_id', user.id)
    .single()

  // First-run detection: no prefs row at all → send to category question
  // This works across devices: the DB is the source of truth.
  if (!prefs) {
    redirect('/onboarding/categories')
  }

  const preferredCategories: Category[] = (prefs.default_categories ?? []) as Category[]

  return (
    <DashboardClient
      counts={counts}
      preferredCategories={preferredCategories}
    />
  )
}
