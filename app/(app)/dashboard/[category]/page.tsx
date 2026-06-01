// app/(app)/dashboard/[category]/page.tsx
// Session 11: accepts deletedId search param for post-delete toast

import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { CategoryListClient } from './category-list-client'
import { CATEGORY_MAP }   from '@/constants/categories'
import { isValidCategory } from '@/lib/types'
import type { Recommendation, Category } from '@/lib/types'
import type { Metadata }  from 'next'

type Props = {
  params:      Promise<{ category: string }>
  searchParams:Promise<{ deleted?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const label = CATEGORY_MAP[category as Category]?.label ?? 'Vault'
  return { title: `${label} · taareef` }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category }   = await params
  const { deleted }    = await searchParams

  if (!isValidCategory(category)) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', category)
    .neq('status', 'dismissed')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  // When redirected post-delete, include the deleted rec in the list
  // so the toast can display its title — then the client filters it from display
  let deletedRec: Recommendation | null = null
  if (deleted) {
    const { data: dr } = await supabase
      .from('recommendations')
      .select('*')
      .eq('id', deleted)
      .eq('user_id', user.id)
      .single()
    deletedRec = dr as Recommendation | null
  }

  const allRecs = deletedRec
    ? [...(data ?? []) as Recommendation[], deletedRec]
    : (data ?? []) as Recommendation[]

  return (
    <CategoryListClient
      recommendations={allRecs}
      categoryConfig={CATEGORY_MAP[category as Category]}
      deletedId={deleted}
    />
  )
}
