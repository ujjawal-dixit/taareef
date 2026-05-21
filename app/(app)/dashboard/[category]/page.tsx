// app/(app)/dashboard/[category]/page.tsx
// Category list view — compact horizontal cards.
// Navigated to from the mosaic tile.
// Back button returns to mosaic home.

import { createClient }      from '@/lib/supabase/server'
import { CategoryListClient } from './category-list-client'
import { getCategoryConfig }  from '@/constants/categories'
import { redirect, notFound } from 'next/navigation'
import type { Metadata }      from 'next'
import type { Category }      from '@/lib/types'

type Props = { params: Promise<{ category: string }> }

const VALID: Category[] = ['restaurant','bar','film','tv','music','book','city','activity']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const cfg = getCategoryConfig(category)
  return { title: `${cfg.labelPlural} · taareef` }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params

  if (!VALID.includes(category as Category)) notFound()

  const supabase = await createClient()
  const { data: { user }, error: ae } = await supabase.auth.getUser()
  if (ae || !user) redirect('/login')

  const { data: recs } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', category)
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })

  const config = getCategoryConfig(category)

  return (
    <CategoryListClient
      recommendations={recs ?? []}
      categoryConfig={config}
    />
  )
}
