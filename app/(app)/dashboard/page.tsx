// app/(app)/dashboard/page.tsx
// Fetches counts + preferences. First-run → /onboarding/categories.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Counts
  const { data: recs } = await supabase
    .from('recommendations')
    .select('category')
    .eq('user_id', user!.id)
    .neq('status', 'dismissed')

  const counts: Record<string, number> = {}
  if (recs) {
    for (const rec of recs) {
      const cat = rec.category as string
      counts[cat] = (counts[cat] ?? 0) + 1
    }
  }

  // Preferences — use unknown typing to avoid generated-types mismatch
  // user_preferences may not be in the auto-generated Supabase types yet
  const { data: prefsRaw } = await supabase
    .from('user_preferences')
    .select('default_categories')
    .eq('user_id', user!.id)
    .single()

  // First-run: no row means they haven't answered the category question
  if (!prefsRaw) {
    redirect('/onboarding/categories')
  }

  const prefs = prefsRaw as { default_categories: string[] | null }
  const preferredCategories: string[] = prefs.default_categories ?? []

  return (
    <DashboardClient
      counts={counts}
      preferredCategories={preferredCategories}
    />
  )
}
