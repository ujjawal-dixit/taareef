// app/api/watchmode/route.ts
// Returns streaming platform availability for a given title.
// Uses Watchmode API — free tier: 1000 requests/month.
// Covers Netflix, Prime, Hotstar, JioCinema, Apple TV+, Disney+.
// Called from rec-detail-client when category === 'watch' and card is experienced.
// Fire-and-forget on first open — result cached in card metadata.

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'

// Platform IDs we care about for Indian users
// Full list: https://api.watchmode.com/v1/sources/
const PRIORITY_SOURCE_IDS = new Set([
  203,  // Netflix
  26,   // Amazon Prime Video
  371,  // Disney+ Hotstar
  387,  // JioCinema
  157,  // Apple TV+
  372,  // Disney+
  444,  // Lionsgate Play
])

const PLATFORM_NAMES: Record<number, string> = {
  203: 'Netflix',
  26:  'Prime Video',
  371: 'Hotstar',
  387: 'JioCinema',
  157: 'Apple TV+',
  372: 'Disney+',
  444: 'Lionsgate Play',
}

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

    const apiKey = process.env.WATCHMODE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ data: { platforms: [], reason: 'not_configured' }, error: null })
    }

    // Step 1 — search for title
    const searchRes = await fetch(
      `https://api.watchmode.com/v1/search/?apiKey=${apiKey}&search_field=name&search_value=${encodeURIComponent(title)}&types=movie,tv_movie,tv_series`,
      { next: { revalidate: 86400 } } // cache 24h — platform availability changes daily not hourly
    )

    if (!searchRes.ok) {
      console.error('[Watchmode] Search failed:', searchRes.status)
      return NextResponse.json({ data: { platforms: [] }, error: null })
    }

    const searchData = await searchRes.json()
    const titleResult = searchData.title_results?.[0]

    if (!titleResult?.id) {
      return NextResponse.json({ data: { platforms: [] }, error: null })
    }

    // Step 2 — get streaming sources for title
    const sourcesRes = await fetch(
      `https://api.watchmode.com/v1/title/${titleResult.id}/sources/?apiKey=${apiKey}&regions=IN`,
      { next: { revalidate: 86400 } }
    )

    if (!sourcesRes.ok) {
      return NextResponse.json({ data: { platforms: [] }, error: null })
    }

    const sourcesData = await sourcesRes.json()

    // Filter to priority platforms, subscription only (not rent/buy)
    const platforms: string[] = []
    const seen = new Set<number>()

    for (const source of (sourcesData ?? []) as Array<{ source_id: number; type: string }>) {
      if (
        PRIORITY_SOURCE_IDS.has(source.source_id) &&
        source.type === 'sub' &&
        !seen.has(source.source_id)
      ) {
        platforms.push(PLATFORM_NAMES[source.source_id])
        seen.add(source.source_id)
      }
    }

    // Cache result in card metadata so we don't call Watchmode again
    if (platforms.length > 0) {
      const { data: rec } = await supabase
        .from('recommendations')
        .select('metadata')
        .eq('id', recId)
        .eq('user_id', user.id)
        .single()

      if (rec) {
        const existingMeta = (rec.metadata as Record<string, unknown>) ?? {}
        await supabase.from('recommendations')
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
