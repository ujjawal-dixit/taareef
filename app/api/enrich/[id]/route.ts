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

import { NextRequest, NextResponse }   from 'next/server'
import { createClient }               from '@/lib/supabase/server'
import { getStreamingPlatforms }      from '@/lib/utils/watchmode-server'
import type { Recommendation, RecMetadata } from '@/lib/types'
import {
  MODEL_DISAMBIGUATE,
  GROQ_CHAT_URL,
  GPT_OSS_REASONING_EFFORT,
  TOKENS_DISAMBIGUATE,
  extractJson,
} from '@/lib/constants/models'
import {
  calculateConfidence, hasNameOverlap, isStrictExact,
  extractLocality, hintMatchesAddress, formatPrimaryType,
  type GoogleAddressComponent,
} from '@/lib/places/matching'

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
    const meta = (rec.metadata as Record<string, unknown>) ?? {}
    // For place categories, only check place_confirmed — not image_url,
    // because Foursquare is what SETS image_url and checking it would block itself
    const isPlaceCategory = rec.category === 'dine' || rec.category === 'visit' || rec.category === 'do'
    const alreadyEnriched = isPlaceCategory
      ? !!meta.place_confirmed
      : !!(meta.tmdb_confirmed || meta.spotify_id || rec.image_url)
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

    const existingMeta = rec.metadata

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
  rec:       Recommendation,
  userId:    string
) {
  const tmdbKey = process.env.TMDB_API_KEY
  if (!tmdbKey) {
    return NextResponse.json({ error: 'TMDB not configured' }, { status: 500 })
  }

  const title     = rec.title as string
  const meta      = rec.metadata
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
  rec:       Recommendation,
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
  rec:       Recommendation,
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
  const meta    = rec.metadata
  const subtype = (meta.subtype as string) ?? 'album'

  if (subtype === 'album')   return await enrichSpotifyAlbum(supabase, rec, userId, meta, title, access_token)
  if (subtype === 'artist')  return await enrichSpotifyArtist(supabase, rec, userId, meta, title, access_token)
  if (subtype === 'podcast') return await enrichSpotifyPodcast(supabase, rec, userId, meta, title, access_token)

  // audiobook: deprioritised — rare save type, Spotify catalog is thin
  return NextResponse.json({ message: 'No enrichment for audiobook subtype yet' })
}

async function enrichSpotifyAlbum(
  supabase:     Awaited<ReturnType<typeof createClient>>,
  rec:       Recommendation,
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
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}

async function enrichSpotifyArtist(
  supabase:     Awaited<ReturnType<typeof createClient>>,
  rec:       Recommendation,
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
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}

async function enrichSpotifyPodcast(
  supabase:     Awaited<ReturnType<typeof createClient>>,
  rec:       Recommendation,
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
  rec:       Recommendation,
  userId:    string,
) {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY
  const groqKey   = process.env.GROQ_API_KEY
  if (!googleKey) {
    console.error('[enrichPlaces] GOOGLE_PLACES_API_KEY not configured')
    return NextResponse.json({ message: 'Google Places not configured' })
  }

  const title        = rec.title
  const category     = rec.category
  const meta         = rec.metadata
  const locationHint = meta.location_hint ?? null

  // ── Monthly usage counter ─────────────────────────────────────────
  const MONTHLY_LIMIT = 1000
  try {
    const now = new Date()
    const { data: usage } = await supabase
      .from('api_usage')
      .select('call_count, reset_at')
      .eq('id', 'google_places')
      .single()

    if (usage) {
      const resetAt    = new Date(usage.reset_at)
      const needsReset = now.getFullYear() > resetAt.getFullYear() ||
                         now.getMonth()    > resetAt.getMonth()
      if (needsReset) {
        await supabase
          .from('api_usage')
          .update({ call_count: 0, reset_at: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() })
          .eq('id', 'google_places')
      } else if (usage.call_count >= MONTHLY_LIMIT) {
        return NextResponse.json({ message: 'Monthly Places API limit reached' })
      }
    }
  } catch (err) {
    console.error('[enrichPlaces] usage counter error:', err)
  }

  // ── LAYER 1: Google Places Text Search ───────────────────────────
  // Query = title + locationHint only — clean, natural, what a human types.
  // Category is passed as a structured includedType filter, not injected
  // into the text query where it corrupts the search phrase.
  const textQuery = locationHint ? `${title} ${locationHint}` : title

  // includedType biases results by venue category without polluting the query.
  // Google Places API (New) category codes — deliberately conservative:
  // dine  → restaurant (broad enough to include bars, cafes, etc.)
  // visit → tourist_attraction
  // do    → omitted — too varied (gyms, hiking, concerts all differ)
  const includedType = category === 'dine'  ? 'restaurant'
    :                  category === 'visit' ? 'tourist_attraction'
    :                  null

  // Two-pass search: pass 1 filters by venue type (precision); if that
  // returns nothing, pass 2 drops the filter (recall). Google's primary
  // types are narrower than our categories — a theme park is
  // 'amusement_park', not 'tourist_attraction'; a pure bar is 'bar',
  // not 'restaurant'. The filter that cleans results for common venues
  // silently EXCLUDED these. One extra API call, spent only on misses.
  // (This was the Imagicaa Khopoli lesson.)
  async function searchPlaces(withType: boolean): Promise<GooglePlace[] | null> {
    try {
      const res = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method:  'POST',
          headers: {
            'Content-Type':     'application/json',
            'X-Goog-Api-Key':   googleKey as string,
            // addressComponents gives us labelled address segments —
            // no string parsing required to extract locality
            'X-Goog-FieldMask': [
              'places.displayName',
              'places.formattedAddress',
              'places.addressComponents',
              'places.primaryType',
              'places.photos',
            ].join(','),
          },
          body: JSON.stringify({
            textQuery,
            maxResultCount: 3,
            languageCode:   'en',
            ...(withType && includedType ? { includedType } : {}),
          }),
        }
      )
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.error('[enrichPlaces] Google search failed:', res.status, errText)
        return null
      }
      const data = await res.json() as { places?: GooglePlace[] }
      return data.places ?? []
    } catch (err) {
      console.error('[enrichPlaces] network error:', err)
      return null
    }
  }

  let allPlaces = await searchPlaces(true)
  if (allPlaces === null) {
    return NextResponse.json({ error: 'Google Places search failed' }, { status: 502 })
  }
  if (allPlaces.length === 0 && includedType) {
    console.log('[enrichPlaces] type-filtered pass empty — retrying without filter')
    allPlaces = (await searchPlaces(false)) ?? []
  }

  // DIAGNOSTIC: what did Google actually return?
  console.log('[enrichPlaces] query:', JSON.stringify({ textQuery, includedType }))
  console.log('[enrichPlaces] raw results:', JSON.stringify(
    allPlaces.map(p => ({
      name:     p.displayName?.text,
      type:     p.primaryType,
      hasPhoto: !!p.photos?.[0]?.name,
      photoRef: p.photos?.[0]?.name?.slice(0, 40),
    }))
  ))

  if (allPlaces.length === 0) {
    await supabase
      .from('recommendations')
      .update({ metadata: { ...meta, place_no_results: true } })
      .eq('id', rec.id)
      .eq('user_id', userId)
    return NextResponse.json({ message: 'No Google Places results' })
  }

  // ── LAYER 2: Name pre-filter ──────────────────────────────────────
  // Reject candidates whose name shares no meaningful words with the
  // user's title. This catches Bademiya for "Gokul Bar" before the LLM
  // ever sees it — string comparison is the right tool for this job.
  //
  // Logic: tokenise both names into words of 3+ characters, excluding
  // noise words. If word overlap is zero AND string similarity < 55%,
  // the candidate is not a plausible match. Filtered out entirely.
  // Top photo references for a place — free, already in the search
  // response. Stored as refs (stable), resolved to URLs lazily later.
  function photoRefs(place: GooglePlace): string[] {
    return (place.photos ?? []).slice(0, 3).map(ph => ph.name)
  }

  const plausiblePlaces = allPlaces.filter(p =>
    hasNameOverlap(title, p.displayName?.text ?? '')
  )

  // If name filter removed all candidates → no plausible match exists.
  // Return none immediately. Never pass allPlaces to the LLM —
  // the filter already determined no name matches, so the LLM has
  // nothing useful to work with and risks picking a wrong result.
  if (plausiblePlaces.length === 0) {
    await supabase
      .from('recommendations')
      .update({ metadata: { ...meta, place_no_results: true } })
      .eq('id', rec.id)
      .eq('user_id', userId)
    return NextResponse.json({ message: 'No name match in Places results' })
  }

  // From here, work exclusively with plausiblePlaces.
  // The LLM, photo fetches, and result indexing all use this same array
  // so indices are always consistent.
  const places = plausiblePlaces

  // DIAGNOSTIC: which candidates survived the name filter?
  console.log('[enrichPlaces] after name filter:', JSON.stringify(
    places.map(p => p.displayName?.text)
  ))

  // ── LAYER 3: Structured locality extraction ───────────────────────
  // Read Google's addressComponents directly — each segment is already
  // labelled with its type. No comma-counting, no regex fragility,
  // no "Maharashtra 400001" leaking into the locality field.
  // ── LAYER 4: Fetch photos in parallel with LLM ───────────────────
  const fetchPhoto = async (place: GooglePlace): Promise<string | null> => {
    const ref = place.photos?.[0]?.name
    if (!ref) return null
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&skipHttpRedirect=true`,
        { headers: { 'X-Goog-Api-Key': googleKey } }
      )
      if (!res.ok) return null
      const data = await res.json() as { photoUri?: string }
      return data.photoUri ?? null
    } catch { return null }
  }

  // ── LAYER 5: LLM disambiguation ──────────────────────────────────
  // The LLM's role is rejection, not ranking. By the time candidates
  // reach it, Layer 2 has already removed obvious mismatches.
  // The prompt is restructured around one question: "is this a match?"
  // with name matching as the explicit primary signal.
  const disambiguateWithLLM = async (): Promise<PlaceLLMResult> => {
    // Default: if no LLM key, pick by string similarity
    if (!groqKey) {
      return stringFallback(places, title)
    }

    const candidateSummary = places.map((p, i) => ({
      index:   i,
      name:    p.displayName?.text ?? '',
      address: p.formattedAddress  ?? '',
      type:    p.primaryType       ?? '',
    }))

    const prompt = `You are verifying whether a venue from Google Places matches what a user saved in a recommendation app.

User saved:
- Title: "${title}"
- Category: ${category}${locationHint ? `
- Location: ${locationHint}` : ''}

Google Places candidates (already filtered to plausible name matches):
${JSON.stringify(candidateSummary, null, 2)}

Decision rules — apply in this order:
1. NAME is the primary signal. The candidate name must resemble the user's title.
   "Gokul Bar" → "Gokul Bar & Restaurant" ✓ | "Bademiya" ✗
   Informal/short names are fine: "Gokul" → "Gokul Bar" ✓
2. If a location hint is given, prefer candidates in that area.
3. If NO candidate name resembles the title → match_type must be "none".
4. Never pick the "least bad" option when the name clearly doesn't match.

Return ONLY valid JSON, no other text:
{
  "chosen_index": <0, 1, or 2>,
  "match_type": "exact" | "likely" | "possible" | "none",
  "reason": "<one sentence>"
}

match_type:
- "exact"    → name matches closely, location consistent
- "likely"   → name matches, location uncertain
- "possible" → partial name match, user should confirm
- "none"     → no candidate name resembles the user's title`

    try {
      const controller = new AbortController()
      const timeout    = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(GROQ_CHAT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model:             MODEL_DISAMBIGUATE,   // constrained classification — favours speed
          temperature:       0.0,
          max_tokens:        TOKENS_DISAMBIGUATE,   // reasoning tokens draw from this budget too
          reasoning_effort:  GPT_OSS_REASONING_EFFORT,
          include_reasoning: false,
          response_format:   { type: 'json_object' },
          messages:    [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      if (!res.ok) throw new Error(`Groq ${res.status}`)

      const data    = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
      const content  = (data.choices?.[0]?.message?.content ?? '') as string
      const jsonText = extractJson(content)
      if (!jsonText) throw new Error(`no JSON in completion: "${content.slice(0, 200)}"`)
      const parsed   = JSON.parse(jsonText) as PlaceLLMResult

      console.log('[enrichPlaces] LLM raw:', content.replace(/\n/g, ' ').slice(0, 200))

      // Sanity check: if LLM picked a winner but the name has no overlap
      // with the title, override to 'none' — the name test is a hard rule
      if (parsed.match_type !== 'none') {
        const chosenName = places[parsed.chosen_index]?.displayName?.text ?? ''
        if (!hasNameOverlap(title, chosenName)) {
          return { match_type: 'none', chosen_index: parsed.chosen_index,
                   reason: 'LLM overridden: chosen name has no overlap with title' }
        }
      }

      return parsed
    } catch (err) {
      console.error('[enrichPlaces] LLM error, using string fallback:', err)
      return stringFallback(places, title)
    }
  }

  // Run photo fetches + LLM in parallel
  const [photoUrls, llmResult] = await Promise.all([
    Promise.all(places.map(fetchPhoto)),
    disambiguateWithLLM(),
  ])

  // ── LAYER 5a: Strict exactness discipline (hard rule) ─────────────
  // The LLM may call 'Gokul Bite' exact for 'Gokul Bar' — names are
  // similar and the model is trained to be decisive. This rule is
  // applied after the LLM and cannot be overridden by it: a match is
  // only 'exact' when every significant word in the user's title is
  // accounted for in the venue name. Otherwise → 'possible' → the
  // user decides via the candidate strip. Machine unsure → human picks.
  let finalResult = { ...llmResult }
  if (finalResult.match_type === 'exact' || finalResult.match_type === 'likely') {
    const chosenPlace = places[finalResult.chosen_index]
    const chosenName  = chosenPlace?.displayName?.text ?? ''
    // Address passed as a secondary accounting source: location words
    // the user appends ('Khopoli') are absorbed by the address, while
    // distinguishing words ('Bar') can never be — exact-token rule.
    if (!isStrictExact(title, chosenName, chosenPlace?.formattedAddress ?? null)) {
      finalResult = {
        ...finalResult,
        match_type: 'possible',
        reason: `${finalResult.reason} (demoted: '${chosenName}' does not account for every word of '${title}')`,
      }
    }
  }

  // ── LAYER 5b: Geographic consistency (hard rule) ──────────────────
  // If the user gave a location hint, verify the chosen place's
  // structured locality (from addressComponents) contains hint words.
  // This is a hard rule: mismatch → "possible", always.
  // We use the structured locality here, not the raw formattedAddress,
  // so "Colaba" is compared to "Colaba" not "Mumbai, Maharashtra 400001".
  if (locationHint && finalResult.match_type !== 'none' && finalResult.match_type !== 'possible') {
    const chosen = places[finalResult.chosen_index]
    // Users think in cities; Google answers in neighbourhoods. Test the
    // hint against the WHOLE address (every component + formatted string),
    // not just the finest-grained locality — 'Mumbai' must match Gateway
    // of India even though its locality is 'Apollo Bandar'.
    // (This was the Gateway of India lesson.)
    if (!hintMatchesAddress(locationHint, chosen?.addressComponents, chosen?.formattedAddress)) {
      finalResult = {
        ...finalResult,
        match_type: 'possible',
        reason: `${finalResult.reason} (address doesn't contain hint '${locationHint}')`,
      }
    }
  }

  // ── ACT on final result ───────────────────────────────────────────
  const chosen = places[finalResult.chosen_index]

  if (finalResult.match_type === 'none') {
    await supabase
      .from('recommendations')
      .update({ metadata: { ...meta, place_no_results: true } })
      .eq('id', rec.id)
      .eq('user_id', userId)
    return NextResponse.json({ message: 'No confident place match' })
  }

  if (finalResult.match_type === 'possible') {
    const candidates = places.map((p, i) => ({
      name:       p.displayName?.text ?? '',
      address:    p.formattedAddress  ?? null,
      locality:   extractLocality(p.addressComponents, locationHint),
      cuisine:    formatPrimaryType(p.primaryType),
      photoUrl:   photoUrls[i] ?? null,
      photo_refs: photoRefs(p),
    }))
    await supabase
      .from('recommendations')
      .update({ metadata: { ...meta, place_candidates: candidates } })
      .eq('id', rec.id)
      .eq('user_id', userId)
    return NextResponse.json({ success: true, candidates: true })
  }

  // exact or likely — auto-confirm
  const photoUrl = photoUrls[finalResult.chosen_index] ?? null

  // DIAGNOSTIC: final decision — whose name, whose photo?
  console.log('[enrichPlaces] FINAL:', JSON.stringify({
    match_type:   finalResult.match_type,
    chosen_index: finalResult.chosen_index,
    reason:       finalResult.reason,
    venue_name:   chosen.displayName?.text,
    photo_host:   photoUrl ? new URL(photoUrl).host : null,
    photo_from:   places[finalResult.chosen_index]?.displayName?.text,
  }))
  const locality = extractLocality(chosen.addressComponents, locationHint)
  const cuisine  = formatPrimaryType(chosen.primaryType)

  await supabase
    .from('recommendations')
    .update({
      image_url: photoUrl,
      metadata:  {
        ...meta,
        venue_name:       chosen.displayName?.text ?? null,
        address:          chosen.formattedAddress  ?? null,
        locality,
        cuisine,
        place_confirmed:  true,
        place_candidates: null,
        place_photo_refs: photoRefs(chosen),
      },
    })
    .eq('id', rec.id)
    .eq('user_id', userId)

  try {
    await supabase.rpc('increment_api_usage', { api_id: 'google_places' })
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true })
}

// ── Helpers ───────────────────────────────────────────────────────

// String-similarity fallback when LLM is unavailable.
// Uses calculateConfidence (Levenshtein) as a last resort.
function stringFallback(candidates: GooglePlace[], userTitle: string): PlaceLLMResult {
  const best = candidates.reduce((b, p, i) => {
    const score = calculateConfidence(userTitle, p.displayName?.text ?? '')
    return score > b.score ? { idx: i, score } : b
  }, { idx: 0, score: 0 })

  const mt = best.score >= 80 ? 'exact'
    : best.score >= 65        ? 'likely'
    : best.score >= 50        ? 'possible'
    : 'none'

  return {
    chosen_index: best.idx,
    match_type:   mt as PlaceLLMResult['match_type'],
    reason:       `String fallback: confidence ${best.score}%`,
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// enrichBook — books use a dedicated route (/api/enrich/book/[id])
// This entry point is a no-op; kept here so the POST dispatcher is complete.
// ─────────────────────────────────────────────────────────────────────────────
async function enrichBook(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  rec:       Recommendation,
  _userId:   string
) {
  console.log('[enrich] book enrichment is handled by /api/enrich/book/', rec.id)
  return NextResponse.json({ message: 'Book enrichment uses /api/enrich/book/[id]' })
}


// ─────────────────────────────────────────────────────────────────────────────
// Confidence scoring — Levenshtein-based similarity ratio (0–100)

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

interface PlaceLLMResult {
  chosen_index: number
  match_type:   'exact' | 'likely' | 'possible' | 'none'
  reason:       string
}

interface GooglePlace {
  displayName?:        { text: string; languageCode?: string }
  formattedAddress?:   string
  addressComponents?:  GoogleAddressComponent[]
  location?:           { latitude: number; longitude: number }
  primaryType?:        string
  photos?:             Array<{ name: string; widthPx?: number; heightPx?: number }>
}

interface SpotifyShow {
  id:        string
  name:      string
  publisher: string
  images:    Array<{ url: string; width: number; height: number }>
}
