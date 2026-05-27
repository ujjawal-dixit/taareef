// app/(app)/dashboard/[category]/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CategoryListClient } from './category-list-client'
import { CATEGORY_MAP } from '@/constants/categories'
import { isValidCategory } from '@/lib/types'
import type { Recommendation, Category } from '@/lib/types'
import type { Metadata } from 'next'

type Props = { params: { category: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const label = CATEGORY_MAP[params.category as Category]?.label ?? 'Vault'
  return { title: `${label} · taareef` }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = params

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
    .order('created_at', { ascending: false })

  return (
    <CategoryListClient
      recommendations={(data ?? []) as Recommendation[]}
      categoryConfig={CATEGORY_MAP[category as Category]}
    />
  )
}
