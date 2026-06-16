// app/api/watchmode/route.ts
// Returns streaming platform availability for a given title (IN region).
// Called client-side after a Watch card is marked as experienced.
// Fetching is done via the shared getStreamingPlatforms utility — same
// logic used at enrichment time, keeping both paths identical.
// Result is cached in card metadata so Watchmode is only called once per card.

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { getStreamingPlatforms }     from '@/lib/utils/watchmode-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recId = searchParams.get('recId')
    const title = searchParams.get('title')

    if (!recId || !title) {
      return NextResponse.json({ data: null, error: 'Missing recId or title' }, { status: 400 })
    }

    // Fetch streaming platforms via shared utility
    const platforms = await getStreamingPlatforms(title)

    // Cache result in card metadata — Watchmode only needs to be called once
    if (platforms.length > 0) {
      const { data: rec } = await supabase
        .from('recommendations')
        .select('metadata')
        .eq('id', recId)
        .eq('user_id', user.id)
        .single()

      if (rec) {
        const existingMeta = (rec.metadata as Record<string, unknown>) ?? {}
        await supabase
          .from('recommendations')
          .update({ metadata: { ...existingMeta, streaming_platforms: platforms } })
          .eq('id', recId)
          .eq('user_id', user.id)
      }
    }

    return NextResponse.json({ data: { platforms }, error: null })

  } catch (err) {
    console.error('[Watchmode] Unexpected:', err)
    return NextResponse.json({ data: { platforms: [] }, error: null })
  }
}
