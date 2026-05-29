// app/(app)/rec/[id]/edit/page.tsx
// Edit a saved recommendation — pre-fills the confirm card form.
// Allows fixing title, category, source, and note after OCR/audio errors.

import { createClient }   from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { RecEditClient }  from './rec-edit-client'
import type { Metadata }  from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('recommendations').select('title').eq('id', id).single()
  return { title: data ? `Edit · ${data.title} · taareef` : 'Edit · taareef' }
}

export default async function RecEditPage({ params }: Props) {
  const { id } = await params
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

  return <RecEditClient recommendation={rec} />
}
