// app/api/enrich/[id]/route.ts
// Enrichment route for watch (TMDB) and listen (Spotify) categories.
// Session 11 fix: TMDB now writes cast array (top 3 billed) from credits.cast.
// Also handles PATCH /api/enrich/[id] for user confirming a TMDB candidate.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/enrich/[id]
// Triggered after save for watch and listen categories.
// Fetches enrichment data and writes to metadata.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
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

    if (rec.category === 'watch') {
      return await enrichWatch(supabase, rec, user.id)
    }

    if (rec.category === 'listen') {
      return await enrichListen(supabase, rec, user.id)
    }

    if (rec.category === 'read') {
      return await enrichBook(supabase, rec, user.id)
    }

    return NextResponse.json({ message: 'No enrichment available for this category' })
  } catch (error) {
    console.error('[enrich] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/enrich/[id]
// User confirms a TMDB candidate from the detail screen.
// Body: { tmdb_id: number, poster_path: string, title: string }
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
      tmdb_id?: number
      poster_path?: string
      title?: string
    }

    if (!body.tmdb_id) {
      return NextResponse.json({ error: 'tmdb_id required' }, { status: 400 })
    }

    // Fetch full TMDB details for the confirmed candidate
    const tmdbKey = process.env.TMDB_API_KEY
    if (!tmdbKey) {
      return NextResponse.json({ error: 'TMDB not configured' }, { status: 500 })
    }

    // Fetch movie details + credits in one shot
    const [detailRes, creditsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${body.tmdb_id}?api_key=${tmdbKey}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/movie/${body.tmdb_id}/credits?api_key=${tmdbKey}&language=en-US`),
    ])

    if (!detailRes.ok) {
      return NextResponse.json({ error: 'TMDB fetch failed' }, { status: 502 })
    }

    const detail = await detailRes.json() as TMDBMovieDetail
    const credits = creditsRes.ok ? (await creditsRes.json() as TMDBCredits) : null

    const director = credits?.crew?.find((c) => c.job === 'Director')?.name ?? null
    const cast = credits?.cast
      ?.slice(0, 3)
      .map((c) => c.name)
      .filter(Boolean) ?? []

    const streamingPlatforms = await fetchWatchmodeStreaming(detail.title, 'movie')

    const { error: updateError } = await supabase
      .from('recommendations')
      .update({
        image_url: detail.poster_path
          ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
          : null,
        metadata: {
          tmdb_id: detail.id,
          subtype: 'film',
          release_year: detail.release_date ? parseInt(detail.release_date.slice(0, 4)) : null,
          genres: detail.genres?.map((g) => g.name) ?? [],
          runtime_minutes: detail.runtime ?? null,
          overview: detail.overview ?? null,
          director,
          cast,
          streaming_platforms: streamingPlatforms,
          tmdb_candidates: null,       // clear candidates after confirmation
          tmdb_confirmed: true,
        },
      })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[enrich PATCH] update error:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, director, cast })
  } catch (error) {
    console.error('[enrich] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// enrichWatch — TMDB search + top 3 candidates + credits.cast
// ─────────────────────────────────────────────────────────────────────────────
async function enrichWatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rec: Record<string, unknown>,
  userId: string
) {
  const tmdbKey = process.env.TMDB_API_KEY
  if (!tmdbKey) {
    return NextResponse.json({ error: 'TMDB not configured' }, { status: 500 })
  }

  const title = rec.title as string
  const subtype = ((rec.metadata as Record<string, unknown>)?.subtype as string) ?? 'film'
  const mediaType = subtype === 'series' ? 'tv' : 'movie'

  // Search TMDB
  const searchRes = await fetch(
    `https://api.themoviedb.org/3/search/${mediaType}?api_key=${tmdbKey}&query=${encodeURIComponent(title)}&language=en-US&page=1`
  )

  if (!searchRes.ok) {
    return NextResponse.json({ error: 'TMDB search failed' }, { status: 502 })
  }

  const search = await searchRes.json() as { results: TMDBSearchResult[] }
  const results = (search.results ?? []).slice(0, 3)

  if (results.length === 0) {
    return NextResponse.json({ message: 'No TMDB results found' })
  }

  // If only one high-confidence result, auto-confirm
  const topResult = results[0]
  const confidence = calculateConfidence(title, topResult.title ?? topResult.name ?? '')

  if (results.length === 1 || confidence >= 88) {
    // Auto-confirm: fetch full details + credits
    const [detailRes, creditsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/${mediaType}/${topResult.id}?api_key=${tmdbKey}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/${mediaType}/${topResult.id}/credits?api_key=${tmdbKey}&language=en-US`),
    ])

    const detail = detailRes.ok ? (await detailRes.json() as TMDBMovieDetail) : null
    const credits = creditsRes.ok ? (await creditsRes.json() as TMDBCredits) : null

    const director = credits?.crew?.find((c) => c.job === 'Director')?.name
      ?? credits?.crew?.find((c) => c.job === 'Series Director')?.name
      ?? null

    const createdBy = (detail as unknown as { created_by?: Array<{ name: string }> })
      ?.created_by?.[0]?.name ?? null

    // Top 3 billed cast — the fix from Session 11
    const cast = credits?.cast
      ?.slice(0, 3)
      .map((c) => c.name)
      .filter(Boolean) ?? []

    const streamingPlatforms = await fetchWatchmodeStreaming(title, mediaType)

    await supabase
      .from('recommendations')
      .update({
        image_url: topResult.poster_path
          ? `https://image.tmdb.org/t/p/w500${topResult.poster_path}`
          : null,
        metadata: {
          ...(rec.metadata as object),
          tmdb_id: topResult.id,
          release_year: topResult.release_date
            ? parseInt(topResult.release_date.slice(0, 4))
            : topResult.first_air_date
              ? parseInt(topResult.first_air_date.slice(0, 4))
              : null,
          genres: detail?.genres?.map((g) => g.name) ?? [],
          runtime_minutes: detail?.runtime ?? null,
          overview: detail?.overview ?? null,
          director,
          created_by: createdBy,
          cast,
          streaming_platforms: streamingPlatforms,
          tmdb_candidates: null,
          tmdb_confirmed: true,
        },
      })
      .eq('id', rec.id as string)
      .eq('user_id', userId)

    return NextResponse.json({ success: true, auto_confirmed: true, cast })
  }

  // Multiple candidates — store for user to choose in detail view
  const candidates = results.map((r) => ({
    tmdb_id: r.id,
    title: r.title ?? r.name ?? '',
    poster_path: r.poster_path ?? null,
    release_year: r.release_date
      ? parseInt(r.release_date.slice(0, 4))
      : r.first_air_date
        ? parseInt(r.first_air_date.slice(0, 4))
        : null,
  }))

  await supabase
    .from('recommendations')
    .update({
      metadata: {
        ...(rec.metadata as object),
        tmdb_candidates: candidates,
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true, candidates })
}

// ─────────────────────────────────────────────────────────────────────────────
// enrichListen — Spotify search
// ─────────────────────────────────────────────────────────────────────────────
async function enrichListen(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rec: Record<string, unknown>,
  userId: string
) {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Spotify not configured' }, { status: 500 })
  }

  // Client credentials token
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'Spotify auth failed' }, { status: 502 })
  }

  const { access_token } = await tokenRes.json() as { access_token: string }
  const title = rec.title as string

  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(title)}&type=album&limit=1`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )

  if (!searchRes.ok) {
    return NextResponse.json({ error: 'Spotify search failed' }, { status: 502 })
  }

  const search = await searchRes.json() as { albums?: { items: SpotifyAlbum[] } }
  const album = search.albums?.items?.[0]

  if (!album) {
    return NextResponse.json({ message: 'No Spotify results' })
  }

  const artworkUrl = album.images?.[0]?.url ?? null

  await supabase
    .from('recommendations')
    .update({
      image_url: artworkUrl,
      metadata: {
        ...(rec.metadata as object),
        spotify_id: album.id,
        artist: album.artists?.[0]?.name ?? null,
        release_year: album.release_date ? parseInt(album.release_date.slice(0, 4)) : null,
        total_tracks: album.total_tracks ?? null,
        artwork_url: artworkUrl,
      },
    })
    .eq('id', rec.id as string)
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// enrichBook — Google Books (delegated to /api/enrich/book/[id])
// ─────────────────────────────────────────────────────────────────────────────
async function enrichBook(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  rec: Record<string, unknown>,
  _userId: string
) {
  // Book enrichment is handled by a dedicated route.
  // This entry point is a no-op — the capture pipeline calls /api/enrich/book/[id] directly.
  console.log('[enrich] book enrichment delegated to /api/enrich/book/', rec.id)
  return NextResponse.json({ message: 'Book enrichment uses /api/enrich/book/[id]' })
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchWatchmodeStreaming — streaming platforms (IN region)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchWatchmodeStreaming(title: string, _mediaType: string): Promise<string[]> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) return []

    const res = await fetch(`${appUrl}/api/watchmode?title=${encodeURIComponent(title)}`)
    if (!res.ok) return []

    const data = await res.json() as { platforms?: string[] }
    return data.platforms ?? []
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence scoring — simple Levenshtein-based ratio
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
  id: number
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
}

interface TMDBMovieDetail {
  id: number
  title: string
  overview: string | null
  poster_path: string | null
  release_date?: string
  runtime?: number | null
  genres?: Array<{ id: number; name: string }>
  created_by?: Array<{ id: number; name: string }>
}

interface TMDBCredits {
  cast: Array<{ id: number; name: string; order: number }>
  crew: Array<{ id: number; name: string; job: string; department: string }>
}

interface SpotifyAlbum {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  images: Array<{ url: string; width: number; height: number }>
  release_date: string
  total_tracks: number
}
