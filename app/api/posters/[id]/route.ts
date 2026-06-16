// app/api/posters/[id]/route.ts
// Accepts a user-uploaded image, stores it in Supabase Storage,
// and sets it as the card's image_url.
//
// Bucket setup (one-time, in Supabase dashboard):
//   1. Storage → New bucket → name: "posters" → set to PUBLIC
//   2. Run the RLS policies from PLACEMENT_GUIDE.md in SQL editor
//
// Path structure: posters/{user_id}/{rec_id}.{ext}
// Limits: 5MB max, JPEG/PNG/WebP only

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'

const MAX_BYTES     = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const BUCKET        = 'posters'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    // Confirm the user owns this recommendation before accepting the upload
    const { data: rec, error: recError } = await supabase
      .from('recommendations')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (recError || !rec) {
      return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
    }

    const form = await request.formData()
    const file = form.get('image') as File | null

    if (!file) {
      return NextResponse.json({ data: null, error: 'No image provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ data: null, error: 'Image must be JPEG, PNG, or WebP' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ data: null, error: 'Image must be under 5 MB' }, { status: 400 })
    }

    const ext    = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path   = `${user.id}/${params.id}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload — upsert so the user can update their poster later
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('[posters] upload error:', uploadError)
      return NextResponse.json({ data: null, error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('recommendations')
      .update({ image_url: publicUrl })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[posters] update error:', updateError)
      return NextResponse.json({ data: null, error: 'Could not save image URL' }, { status: 500 })
    }

    return NextResponse.json({ data: { url: publicUrl }, error: null })

  } catch (error) {
    console.error('[posters] unexpected error:', error)
    return NextResponse.json({ data: null, error: 'Something went wrong' }, { status: 500 })
  }
}
