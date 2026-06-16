// lib/utils/watchmode-server.ts
// Pure Watchmode API call — no auth, no Supabase dependency.
// Call this directly from server-side code instead of going through
// the /api/watchmode HTTP route (which requires user auth cookies).
//
// Used by:
//   — app/api/enrich/[id]/route.ts  (at enrichment time, during save)
//   — app/api/watchmode/route.ts    (client-triggered call, with caching layer)

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

export async function getStreamingPlatforms(title: string): Promise<string[]> {
  const apiKey = process.env.WATCHMODE_API_KEY
  if (!apiKey) return []

  try {
    // Step 1 — find the title on Watchmode
    const searchRes = await fetch(
      `https://api.watchmode.com/v1/search/?apiKey=${apiKey}&search_field=name&search_value=${encodeURIComponent(title)}&types=movie,tv_movie,tv_series`,
      { next: { revalidate: 86400 } } // cache 24h — availability doesn't change hourly
    )
    if (!searchRes.ok) return []

    const searchData = await searchRes.json() as { title_results?: Array<{ id: number }> }
    const titleId    = searchData.title_results?.[0]?.id
    if (!titleId) return []

    // Step 2 — get streaming sources for India
    const sourcesRes = await fetch(
      `https://api.watchmode.com/v1/title/${titleId}/sources/?apiKey=${apiKey}&regions=IN`,
      { next: { revalidate: 86400 } }
    )
    if (!sourcesRes.ok) return []

    const sources = await sourcesRes.json() as Array<{ source_id: number; type: string }>

    // Keep subscription-only, priority platforms, deduplicated
    const platforms: string[] = []
    const seen = new Set<number>()

    for (const source of (sources ?? [])) {
      if (
        PRIORITY_SOURCE_IDS.has(source.source_id) &&
        source.type === 'sub' &&
        !seen.has(source.source_id)
      ) {
        platforms.push(PLATFORM_NAMES[source.source_id])
        seen.add(source.source_id)
      }
    }

    return platforms
  } catch {
    return []
  }
}
