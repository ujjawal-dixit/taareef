// app/(app)/rec/[id]/page.tsx
// Card detail view. Server Component.
// Shows all fields, nuance details, reaction, experienced flow.

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getCategoryConfig }  from '@/constants/categories'
import type { Metadata }      from 'next'
import type { Category }      from '@/lib/types'
import { RecDetailClient }    from './rec-detail-client'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }   = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('recommendations')
    .select('title, source_name')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Recommendation' }
  return { title: `${data.title} · taareef` }
}

export default async function RecDetailPage({ params }: Props) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rec, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !rec) notFound()

  const config = getCategoryConfig(rec.category as Category)

  return <RecDetailClient recommendation={rec} categoryConfig={config} />
}
