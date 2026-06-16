// app/api/enrich/[id]/route.ts
//
// Fixes applied in this version:
//   1. GET renamed → POST (enrichment writes to DB; client already sends POST)
//   2. PATCH rewritten: series-aware (film→/movie, series→/tv), merges metadata
//      instead of replacing, null-guards detail, returns { data: { confirmed } }
//      matching the pattern the client actually checks
//   3. enrichWatch: year-filtered TMDB search with year-less fallback, popularity-
//      aware auto-confirm (high confidence + clear popularity gap), stores poster_url
//      (full URL) in candidates so the candidate strip can render them
//   4. enrichListen: subtype-aware (album → type=album, artist → type=artist,
//      podcast → type=show; audiobook deprioritised)
//   5. fetchWatchmodeStreaming: fixed response path (was reading data.platforms,
//      watchmode route returns { data: { platforms } })

import { NextRequest, NextResponse } from 'next/server'
import { createClient }          from '@/lib/supabase/server'
import { getStreamingPlatforms } from '@/lib/utils/watchmode-server'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/enrich/[id]
// Renamed from GET — enrichment writes to the database, so POST is correct.
// The client trigger (lib/utils/enrich.ts) already sends POST.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: rec, error: recError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (recError || !rec) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Skip if already enriched — prevents double-work when both save-time
    // enrichment and the detail-screen fallback trigger fire for the same record
    const alreadyEnriched = !!(
      (rec.metadata as Record<string, unknown>)?.tmdb_confirmed ||
      (rec.metadata as Record<string, unknown>)?.spotify_id ||
      (rec.metadata as Record<string, unknown>)?.foursquare_confirmed ||
      rec.image_url
    )
    if (alreadyEnriched) {
      return NextResponse.json({ message: 'Already enriched' })
    }

    if (rec.category === 'watch') return await enrichWatch(supabase, rec, user.id)
    if (rec.category === 'listen') return await enrichListen(supabase, rec, user.id)
    if (rec.category === 'read') return await enrichBook(supabase, rec, user.id)

    if (rec.category === 'dine' || rec.category === 'visit' || rec.category === 'do') {
      return await enrichPlaces(supabase, rec, user.id)
    }

    return NextResponse.json({ message: 'No enrichment available for this category' })
  } catch (error) {
    console.error('[enrich] POST error:', error)
    console.error('[enrich] POST stack:', error instanceof Error ? error.stack : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/enrich/[id]
// User confirms a TMDB candidate from the candidate strip in the detail screen.
// Body: { tmdb_id: number, subtype?: string, ... (other candidate fields ignored) }
//
// Fixed:
//   — Reads existing rec from DB to merge metadata (not replace)
//   — Uses subtype to pick the correct TMDB endpoint (movie vs tv)
//   — Reads correct fields per media type (name vs title, first_air_date vs release_date)
//   — Null-guards detail before reading its fields
//   — Returns { data: { confirmed: true } } — matching the book route pattern
//     and what handleConfirmCandidate in the client actually checks
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      tmdb_id?:  number
      subtype?:  string
    }

    if (!body.tmdb_id) {
      return NextResponse.json({ error: 'tmdb_id required' }, { status: 400 })
    }

    // Read existing rec to get current metadata for merging
    const { data: rec, error: recError } = await supabase
      .from('recommendations')
      .select('metadata')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (recError || !rec) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const existingMeta = (rec.metadata as Record<string, unknown>) ?? {}

    // Subtype from body (sent by the candidate); fall back to what was captured
    // at save time; default to 'film' only as a last resort
    const subtype   = body.subtype ?? (existingMeta.subtype as string) ?? 'film'
    const mediaType = subtype === 'series' ? 'tv' : 'movie'

    const tmdbKey = process.env.TMDB_API_KEY
    if (!tmdbKey) {
      return NextResponse.json({ error: 'TMDB not configured' }, { status: 500 })
    }

    // Fetch from the correct TMDB endpoint — movie or tv
    const [detailRes, creditsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/${mediaType}/${body.tmdb_id}?api_key=${tmdbKey}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/${mediaType}/${body.tmdb_id}/credits?api_key=${tmdbKey}&language=en-US`),
    ])

    if (!detailRes.ok) {
      return NextResponse.json({ error: 'TMDB fetch failed' }, { status: 502 })
    }

    // Null-guard: if TMDB detail parse fails, we stop cleanly
    let detail: TMDBDetail | null = null
    try {
      detail = await detailRes.json() as TMDBDetail
    } catch {
      return NextResponse.json({ error: 'TMDB response parse failed' }, { status: 502 })
    }

    const credits = creditsRes.ok
      ? await creditsRes.json() as TMDBCredits
      : null

    // TV series: creator from created_by; films: director from crew
    const director = mediaType === 'tv'
      ? ((detail as TMDBTVDetail).created_by?.[0]?.name ?? null)
      : (credits?.crew?.find((c) => c.job === 'Director')?.name ?? null)

    const cast = credits?.cast
      ?.slice(0, 3)
      .map((c) => c.name)
      .filter(Boolean) ?? []

    // TV and movie use different field names — handle both
    const canonicalTitle = (detail as TMDBTVDetail).name
      ?? (detail as TMDBMovieDetail).title
      ?? ''
    const airDate = (detail as TMDBTVDetail).first_air_date
      ?? (detail as TMDBMovieDetail).release_date
      ?? null
    const runtime = (detail as TMDBTVDetail).episode_run_time?.[0]
      ?? (detail as TMDBMovieDetail).runtime
      ?? null

    const streamingPlatforms = await getStreamingPlatforms(canonicalTitle).catch(() => [] as string[])

    const { error: updateError } = await supabase
      .from('recommendations')
      .update({
        image_url: detail.poster_path
          ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
          : null,
        metadata: {
          ...existingMeta,              // preserve source, notes, subtype from understand phase
          tmdb_id:             detail.id,
          subtype,                      // the real subtype (film or series)
          release_year:        airDate ? parseInt(airDate.slice(0, 4)) : null,
          genres:              detail.genres?.map((g) => g.name) ?? [],
          runtime_minutes:     runtime,
          overview:            detail.overview ?? null,
          director,
          cast,
          streaming_platforms: streamingPlatforms,
          tmdb_candidates:     null,    // clear candidates after confirmation
          tmdb_confirmed:      true,
        },
      })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[enrich PATCH] update error:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    // Return { data: { confirmed: true } } — matches what handleConfirmCandidate checks
    return NextResponse.json({ data: { confirmed: true, director, cast }, error: null })

  } catch (error) {
    console.error('[enrich] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// enrichWatch — TMDB search with smarter matching
//
// Improvements over the original:
//   — Year-filtered search (uses year captured by the Understand LLM) with a
//     year-less fallback in case the LLM got the year slightly wrong
//   — Candidates now store poster_url (full URL) so the UI can render them
//     without constructing URLs client-side
//   — Subtype stored in each candidate so PATCH knows which TMDB endpoint to use
//   — Auto-confirm requires high string confidence (≥92) AND a clear popularity
//     gap vs the second result — avoids silently locking in an ambiguous poster
// ─────────────────────────────────────────────────────────────────────────────
async function enrichWatch(
  supabase:  Awaited<ReturnType<typeof createClient>>,
  rec:       Record<string, unknown>,
  userId:    string
) {
  const tmdbKey = process.env.TMDB_API_KEY
  if (!tmdbKey) {
    return NextResponse.json({ error: 'TMDB not configured' }, { status: 500 })
  }

  const title     = rec.title as string
  const meta      = (rec.metadata as Record<string, unknown>) ?? {}
  const subtype   = (meta.subtype as string) ?? 'film'
  const year      = meta.release_year as number | null | undefined
  const mediaType = subtype === 'series' ? 'tv' : 'movie'

  // Year-filtered search: tighter first pass
  const yearParam = year
    ? (mediaType === 'tv' ? `&first_air_date_year=${year}` : `&year=${year}`)
    : ''

  const baseUrl = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${tmdbKey}&query=${encodeURIComponent(title)}&language=en-US&page=1`

  let searchRes = await fetch(`${baseUrl}${yearParam}`)
  if (!searchRes.ok) {
    return NextResponse.json({ error: 'TMDB search failed' }, { status: 502 })
  }

  let search  = await searchRes.json() as { results: TMDBSearchResult[] }
  let results = (search.results ?? []).slice(0, 3)

  // Fallback without year if the year-filtered search returned nothing
  // (handles cases where the LLM captured a slightly wrong year)
  if (results.length === 0 && year) {
    const fallbackRes = await fetch(baseUrl)
    if (fallbackRes.ok) {
      const fallback = await fallbackRes.json() as { results: TMDBSearchResult[] }
      results = (fallback.results ?? []).slice(0, 3)
    }
  }

  if (results.length === 0) {
    return NextResponse.json({ message: 'No TMDB results found' })
  }

  const topResult  = results[0]
  const confidence = calculateConfidence(title, topResult.title ?? topResult.name ?? '')

  // Auto-confirm only when both conditions hold:
  //   1. String confidence is high (≥92 — stricter than the old ≥88)
  //   2. Either it's the only result, or the top result is clearly more popular
  //      than the second (1.5× — reduces silent wrong-poster risk)
  // A poster is the card's face; we'd rather show the candidate strip than
  // silently confirm the wrong one.
  const topPop    = topResult.popularity ?? 0
  const secondPop = results[1]?.popularity ?? 0
  const shouldAutoConfirm = confidence >= 92 && (
    results.length === 1 || topPop > secondPop * 1.5
  )

  if (shouldAutoConfirm) {
    return await autoConfirmWatch(supabase, rec, userId, topResult, subtype, mediaType, meta, tmdbKey)
  }

  // Store top 3 as candidates for the user to pick in the detail screen.
  // poster_url is the full CDN URL — the candidate strip reads it directly.
  // subtype is carried so PATCH knows which TMDB endpoint to confirm against.
  const candidates = results.map((r) => ({
    tmdb_id:      r.id,
    title:        r.title ?? r.name ?? '',
    poster_path:  r.poster_path ?? null,
    poster_url:   r.poster_path
      ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
      : null,
    release_year: r.release_date
      ? parseInt(r.release_date.slice(0, 4))
      : r.first_air_date
        ? parseInt(r.first_air_date.slice(0, 4))
        : null,
    subtype,
  }))

  await supabase
    .from('recommendations')
    .update({ metadata: { ...meta, tmdb_candidates: candidates } })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true, candidates })
}

// ─────────────────────────────────────────────────────────────────────────────
// autoConfirmWatch — shared confirmation logic
// Used by enrichWatch (auto path) — keeps the confirmation logic in one place.
// ─────────────────────────────────────────────────────────────────────────────
async function autoConfirmWatch(
  supabase:    Awaited<ReturnType<typeof createClient>>,
  rec:         Record<string, unknown>,
  userId:      string,
  topResult:   TMDBSearchResult,
  subtype:     string,
  mediaType:   string,
  meta:        Record<string, unknown>,
  tmdbKey:     string,
) {
  const [detailRes, creditsRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/${mediaType}/${topResult.id}?api_key=${tmdbKey}&language=en-US`),
    fetch(`https://api.themoviedb.org/3/${mediaType}/${topResult.id}/credits?api_key=${tmdbKey}&language=en-US`),
  ])

  const detail  = detailRes.ok  ? await detailRes.json()  as TMDBDetail  : null
  const credits = creditsRes.ok ? await creditsRes.json() as TMDBCredits : null

  const director = mediaType === 'tv'
    ? ((detail as TMDBTVDetail | null)?.created_by?.[0]?.name ?? null)
    : (credits?.crew?.find((c) => c.job === 'Director')?.name ?? null)

  const cast = credits?.cast
    ?.slice(0, 3)
    .map((c) => c.name)
    .filter(Boolean) ?? []

  const canonicalTitle = (detail as TMDBTVDetail | null)?.name
    ?? (detail as TMDBMovieDetail | null)?.title
    ?? (rec.title as string)

  const airDate = (detail as TMDBTVDetail | null)?.first_air_date
    ?? (detail as TMDBMovieDetail | null)?.release_date
    ?? topResult.first_air_date
    ?? topResult.release_date
    ?? null

  const runtime = (detail as TMDBTVDetail | null)?.episode_run_time?.[0]
    ?? (detail as TMDBMovieDetail | null)?.runtime
    ?? null

  const streamingPlatforms = await getStreamingPlatforms(canonicalTitle).catch(() => [] as string[])

  await supabase
    .from('recommendations')
    .update({
      image_url: topResult.poster_path
        ? `https://image.tmdb.org/t/p/w500${topResult.poster_path}`
        : null,
      metadata: {
        ...meta,
        tmdb_id:             topResult.id,
        subtype,
        release_year:        airDate ? parseInt(airDate.slice(0, 4)) : null,
        genres:              detail?.genres?.map((g) => g.name) ?? [],
        runtime_minutes:     runtime,
        overview:            detail?.overview ?? null,
        director,
        cast,
        streaming_platforms: streamingPlatforms,
        tmdb_candidates:     null,
        tmdb_confirmed:      true,
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true, auto_confirmed: true, cast })
}

// ─────────────────────────────────────────────────────────────────────────────
// enrichListen — Spotify, now subtype-aware
//
// album   → type=album  → artwork, artist name, year, track count
// artist  → type=artist → artist photo, genres
// podcast → type=show   → cover art, publisher name
// audiobook → deprioritised (Spotify's audiobook catalog is thin;
//             no enrichment for now — card keeps its motif)
// ─────────────────────────────────────────────────────────────────────────────
async function enrichListen(
  supabase:  Awaited<ReturnType<typeof createClient>>,
  rec:       Record<string, unknown>,
  userId:    string
) {
  const clientId     = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Spotify not configured' }, { status: 500 })
  }

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      Authorization:    `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'Spotify auth failed' }, { status: 502 })
  }

  const { access_token } = await tokenRes.json() as { access_token: string }
  const title   = rec.title as string
  const meta    = (rec.metadata as Record<string, unknown>) ?? {}
  const subtype = (meta.subtype as string) ?? 'album'

  if (subtype === 'album')   return await enrichSpotifyAlbum(supabase, rec, userId, meta, title, access_token)
  if (subtype === 'artist')  return await enrichSpotifyArtist(supabase, rec, userId, meta, title, access_token)
  if (subtype === 'podcast') return await enrichSpotifyPodcast(supabase, rec, userId, meta, title, access_token)

  // audiobook: deprioritised — rare save type, Spotify catalog is thin
  return NextResponse.json({ message: 'No enrichment for audiobook subtype yet' })
}

async function enrichSpotifyAlbum(
  supabase:     Awaited<ReturnType<typeof createClient>>,
  rec:          Record<string, unknown>,
  userId:       string,
  meta:         Record<string, unknown>,
  title:        string,
  accessToken:  string,
) {
  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(title)}&type=album&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!searchRes.ok) {
    return NextResponse.json({ error: 'Spotify album search failed' }, { status: 502 })
  }

  const search = await searchRes.json() as { albums?: { items: SpotifyAlbum[] } }
  const album  = search.albums?.items?.[0]

  if (!album) return NextResponse.json({ message: 'No Spotify album results' })

  const artworkUrl = album.images?.[0]?.url ?? null

  await supabase
    .from('recommendations')
    .update({
      image_url: artworkUrl,
      metadata:  {
        ...meta,
        spotify_id:   album.id,
        artist:       album.artists?.[0]?.name ?? null,
        release_year: album.release_date ? parseInt(album.release_date.slice(0, 4)) : null,
        total_tracks: album.total_tracks ?? null,
        artwork_url:  artworkUrl,
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}

async function enrichSpotifyArtist(
  supabase:     Awaited<ReturnType<typeof createClient>>,
  rec:          Record<string, unknown>,
  userId:       string,
  meta:         Record<string, unknown>,
  title:        string,
  accessToken:  string,
) {
  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(title)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!searchRes.ok) {
    return NextResponse.json({ error: 'Spotify artist search failed' }, { status: 502 })
  }

  const search  = await searchRes.json() as { artists?: { items: SpotifyArtist[] } }
  const artist  = search.artists?.items?.[0]

  if (!artist) return NextResponse.json({ message: 'No Spotify artist results' })

  const artworkUrl = artist.images?.[0]?.url ?? null

  await supabase
    .from('recommendations')
    .update({
      image_url: artworkUrl,
      metadata:  {
        ...meta,
        spotify_id:  artist.id,
        genres:      artist.genres ?? [],
        artwork_url: artworkUrl,
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}

async function enrichSpotifyPodcast(
  supabase:     Awaited<ReturnType<typeof createClient>>,
  rec:          Record<string, unknown>,
  userId:       string,
  meta:         Record<string, unknown>,
  title:        string,
  accessToken:  string,
) {
  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(title)}&type=show&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!searchRes.ok) {
    return NextResponse.json({ error: 'Spotify podcast search failed' }, { status: 502 })
  }

  const search   = await searchRes.json() as { shows?: { items: SpotifyShow[] } }
  const show     = search.shows?.items?.[0]

  if (!show) return NextResponse.json({ message: 'No Spotify podcast results' })

  const artworkUrl = show.images?.[0]?.url ?? null

  await supabase
    .from('recommendations')
    .update({
      image_url: artworkUrl,
      metadata:  {
        ...meta,
        spotify_id:   show.id,
        publisher:    show.publisher ?? null,
        artwork_url:  artworkUrl,
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// enrichPlaces — Foursquare for dine, visit, and venue-based do
//
// Searches for the venue, fetches a photo, writes: image_url, address,
// locality, cuisine, foursquare_id. Uses location_hint from metadata
// (captured by the Understand LLM) to tighten the search when available.
// ─────────────────────────────────────────────────────────────────────────────
async function enrichPlaces(
  supabase:  Awaited<ReturnType<typeof createClient>>,
  rec:       Record<string, unknown>,
  userId:    string,
) {
  const apiKey = process.env.FOURSQUARE_API_KEY
  if (!apiKey) return NextResponse.json({ message: 'Foursquare not configured' })

  const title        = rec.title as string
  const meta         = (rec.metadata as Record<string, unknown>) ?? {}
  const locationHint = meta.location_hint as string | null | undefined

  const params = new URLSearchParams({
    query:  title,
    limit:  '3',
    fields: 'fsq_id,name,location,categories,geocodes',
  })
  if (locationHint) params.set('near', locationHint)

  const searchRes = await fetch(
    `https://api.foursquare.com/v3/places/search?${params.toString()}`,
    { headers: { Authorization: apiKey, Accept: 'application/json' } }
  )

  if (!searchRes.ok) {
    return NextResponse.json({ error: 'Foursquare search failed' }, { status: 502 })
  }

  const search  = await searchRes.json() as { results: FoursquarePlace[] }
  const results = search.results ?? []
  if (results.length === 0) return NextResponse.json({ message: 'No Foursquare results' })

  const top        = results[0]
  const confidence = calculateConfidence(title, top.name)

  // 55% threshold for venues — names vary more than film titles,
  // and Foursquare results can differ slightly in punctuation or word order
  if (confidence < 55) return NextResponse.json({ message: 'Low confidence place match' })

  // Fetch a venue photo — best-effort, not a blocker
  let photoUrl: string | null = null
  try {
    const photosRes = await fetch(
      `https://api.foursquare.com/v3/places/${top.fsq_id}/photos?limit=1`,
      { headers: { Authorization: apiKey, Accept: 'application/json' } }
    )
    if (photosRes.ok) {
      const photos = await photosRes.json() as FoursquarePhoto[]
      if (photos[0]) photoUrl = `${photos[0].prefix}500x500${photos[0].suffix}`
    }
  } catch { /* photo is nice-to-have */ }

  await supabase
    .from('recommendations')
    .update({
      image_url: photoUrl,
      metadata:  {
        ...meta,
        foursquare_id:        top.fsq_id,
        venue_name:           top.name,
        address:              top.location.address  ?? null,
        locality:             top.location.locality ?? null,
        cuisine:              top.categories?.[0]?.name ?? null,
        foursquare_confirmed: true,
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// enrichBook — books use a dedicated route (/api/enrich/book/[id])
// This entry point is a no-op; kept here so the POST dispatcher is complete.
// ─────────────────────────────────────────────────────────────────────────────
async function enrichBook(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  rec:       Record<string, unknown>,
  _userId:   string
) {
  console.log('[enrich] book enrichment is handled by /api/enrich/book/', rec.id)
  return NextResponse.json({ message: 'Book enrichment uses /api/enrich/book/[id]' })
}


// ─────────────────────────────────────────────────────────────────────────────
// Confidence scoring — Levenshtein-based similarity ratio (0–100)
// ─────────────────────────────────────────────────────────────────────────────
function calculateConfidence(query: string, result: string): number {
  const a = query.toLowerCase().trim()
  const b = result.toLowerCase().trim()
  if (a === b) return 100

  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 100

  const distance = levenshtein(a, b)
  return Math.round((1 - distance / maxLen) * 100)
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────────────────────

interface TMDBSearchResult {
  id:             number
  title?:         string          // movie
  name?:          string          // tv
  poster_path:    string | null
  release_date?:  string          // movie
  first_air_date?: string         // tv
  popularity?:    number          // used for auto-confirm tiebreaker
}

// Shared base for movie + tv detail responses
interface TMDBDetailBase {
  id:           number
  overview:     string | null
  poster_path:  string | null
  genres?:      Array<{ id: number; name: string }>
}

interface TMDBMovieDetail extends TMDBDetailBase {
  title:         string
  release_date?: string
  runtime?:      number | null
}

interface TMDBTVDetail extends TMDBDetailBase {
  name:              string
  first_air_date?:   string
  episode_run_time?: number[]
  created_by?:       Array<{ id: number; name: string }>
}

// Union so PATCH + autoConfirmWatch can reference either
type TMDBDetail = TMDBMovieDetail | TMDBTVDetail

interface TMDBCredits {
  cast: Array<{ id: number; name: string; order: number }>
  crew: Array<{ id: number; name: string; job: string; department: string }>
}

interface SpotifyAlbum {
  id:           string
  name:         string
  artists:      Array<{ id: string; name: string }>
  images:       Array<{ url: string; width: number; height: number }>
  release_date: string
  total_tracks: number
}

interface SpotifyArtist {
  id:     string
  name:   string
  images: Array<{ url: string; width: number; height: number }>
  genres: string[]
}

interface FoursquarePlace {
  fsq_id:     string
  name:       string
  location:   { address?: string; locality?: string; region?: string; country?: string }
  categories?: Array<{ id: number; name: string; icon: { prefix: string; suffix: string } }>
  geocodes?:  { main: { latitude: number; longitude: number } }
}

interface FoursquarePhoto {
  id:     string
  prefix: string
  suffix: string
  width:  number
  height: number
}

interface SpotifyShow {
  id:        string
  name:      string
  publisher: string
  images:    Array<{ url: string; width: number; height: number }>
}
