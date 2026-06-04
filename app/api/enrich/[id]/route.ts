// app/api/enrich/[id]/route.ts
// Stores top 3 TMDB candidates for user to confirm.
// RLS fix: all updates include .eq('user_id', user.id).
// Genre hue data stored for fallback when user rejects all candidates.

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

type Params = { params: Promise<{ id: string }> }

// Genre → hue offset for fallback atmospheric colour
const GENRE_HUES: Record<string, string> = {
  'Animation':    'rgba(255,180,60,0.35)',
  'Comedy':       'rgba(255,210,80,0.30)',
  'Drama':        'rgba(80,120,200,0.30)',
  'Thriller':     'rgba(180,20,40,0.35)',
  'Horror':       'rgba(120,0,20,0.40)',
  'Romance':      'rgba(220,80,120,0.30)',
  'Action':       'rgba(200,80,20,0.35)',
  'Science Fiction': 'rgba(40,160,220,0.30)',
  'Documentary':  'rgba(80,160,100,0.28)',
  'Fantasy':      'rgba(120,60,200,0.30)',
  'Crime':        'rgba(60,40,80,0.35)',
  'Adventure':    'rgba(40,180,120,0.30)',
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id }   = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 })

    const { data: rec } = await supabase
      .from('recommendations')
      .select('id, title, category, metadata, image_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!rec) return NextResponse.json({ data: { enriched: false }, error: null })
    if (rec.image_url) return NextResponse.json({ data: { enriched: false, reason: 'already_has_image' }, error: null })

    // ── FILM / TV → TMDB ──────────────────────────────────
    if (rec.category === 'watch') {
      const tmdbKey = process.env.TMDB_API_KEY
      if (!tmdbKey) {
        console.error('[Enrich] TMDB_API_KEY not set')
        return NextResponse.json({ data: { enriched: false, reason: 'no_api_key' }, error: null })
      }

      // Use subtype hint from metadata if available — otherwise search both endpoints
      const existingMeta = (rec.metadata as Record<string,unknown>) ?? {}
      const subtypeHint  = typeof existingMeta.subtype === 'string' ? existingMeta.subtype : null
      const searchBoth   = !subtypeHint || subtypeHint === 'series' || subtypeHint === 'documentary'
      const searchMovie  = !subtypeHint || subtypeHint === 'film' || subtypeHint === 'documentary'
      const searchTV     = !subtypeHint || subtypeHint === 'series'

      const title = encodeURIComponent(rec.title)

      console.log(`[Enrich] Searching TMDB for: "${rec.title}" subtype=${subtypeHint ?? 'unknown'}`)

      // Search movie and/or tv in parallel — merge and rank by popularity
      const [movieRes, tvRes] = await Promise.all([
        searchMovie
          ? fetch(`https://api.themoviedb.org/3/search/movie?query=${title}&api_key=${tmdbKey}&language=en-US`)
              .then(r => r.json()).catch(() => ({ results: [] }))
          : Promise.resolve({ results: [] }),
        searchTV || searchBoth
          ? fetch(`https://api.themoviedb.org/3/search/tv?query=${title}&api_key=${tmdbKey}&language=en-US`)
              .then(r => r.json()).catch(() => ({ results: [] }))
          : Promise.resolve({ results: [] }),
      ])

      // Tag results with media type so we fetch the right detail endpoint
      type TMDBHit = Record<string,unknown> & { _media_type: 'movie' | 'tv' }
      const movieHits: TMDBHit[] = ((movieRes.results ?? []) as Record<string,unknown>[])
        .map(h => ({ ...h, _media_type: 'movie' as const }))
      const tvHits: TMDBHit[] = ((tvRes.results ?? []) as Record<string,unknown>[])
        .map(h => ({ ...h, _media_type: 'tv' as const }))

      // Merge and rank by popularity — take top 3 across both endpoints
      const allHits = [...movieHits, ...tvHits]
        .sort((a, b) => ((b.popularity as number) ?? 0) - ((a.popularity as number) ?? 0))
        .slice(0, 3)

      if (!allHits.length) {
        console.log(`[Enrich] No TMDB results for: "${rec.title}"`)
        await supabase.from('recommendations')
          .update({ metadata: { ...existingMeta, tmdb_no_results: true } })
          .eq('id', id).eq('user_id', user.id)
        return NextResponse.json({ data: { enriched: false, reason: 'no_results' }, error: null })
      }

      // Fetch details for each candidate in parallel
      const candidates = await Promise.all(
        allHits.map(async (hit) => {
          const mediaType = hit._media_type
          let genre: string | null = null
          let genreHue: string | null = null
          let runtime: number | null = null
          let director: string | null = null
          let seasons: number | null = null
          let series_status: string | null = null
          try {
            const detailRes  = await fetch(
              `https://api.themoviedb.org/3/${mediaType}/${hit.id}?api_key=${tmdbKey}&append_to_response=credits`
            )
            const d = await detailRes.json()
            genre    = (d.genres as Array<{name:string}>)?.[0]?.name ?? null
            genreHue = genre ? (GENRE_HUES[genre] ?? null) : null
            if (mediaType === 'movie') {
              runtime  = d.runtime ?? null
              director = (d.credits?.crew as Array<{job:string;name:string}>)
                ?.find(c => c.job === 'Director')?.name ?? null
            } else {
              seasons       = d.number_of_seasons ?? null
              series_status = d.status ?? null
              runtime       = d.episode_run_time?.[0] ?? null
            }
          } catch {}

          return {
            tmdb_id:       hit.id,
            media_type:    mediaType,
            title:         (hit.title ?? hit.name) as string,
            subtype:       mediaType === 'tv' ? 'series' : 'film',
            poster_url:    hit.poster_path
              ? `https://image.tmdb.org/t/p/w500${hit.poster_path}`
              : null,
            release_year:  hit.release_date
              ? parseInt((hit.release_date as string).slice(0, 4))
              : hit.first_air_date
              ? parseInt((hit.first_air_date as string).slice(0, 4))
              : null,
            overview:      (hit.overview as string) ?? null,
            vote_average:  (hit.vote_average as number) ?? null,
            genre,
            genre_hue:     genreHue,
            runtime,
            director,
            seasons,
            series_status,
          }
        })
      )

      console.log(`[Enrich] ${candidates.length} candidates for "${rec.title}"`)

      await supabase.from('recommendations')
        .update({ metadata: { ...existingMeta, tmdb_candidates: candidates } })
        .eq('id', id)
        .eq('user_id', user.id)

      return NextResponse.json({
        data: { enriched: true, candidates, awaiting_confirmation: true },
        error: null,
      })
    }

    // ── MUSIC → SPOTIFY ───────────────────────────────────
    if (rec.category === 'listen') {
      const clientId     = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

      if (clientId && clientSecret) {
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: 'grant_type=client_credentials',
        })
        const { access_token: token } = await tokenRes.json()

        if (token) {
          const searchRes  = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(rec.title)}&type=track,album&limit=1`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
          const searchData = await searchRes.json()
          const hit        = searchData.tracks?.items?.[0] ?? searchData.albums?.items?.[0]

          if (hit) {
            const imageUrl   = hit.album?.images?.[0]?.url ?? hit.images?.[0]?.url ?? null
            const newMetadata = {
              ...((rec.metadata as Record<string,unknown>) ?? {}),
              artist:       hit.artists?.[0]?.name ?? null,
              album:        hit.album?.name ?? hit.name ?? null,
              artwork_url:  imageUrl,
              spotify_id:   hit.id,
              preview_url:  hit.preview_url ?? null,
              release_year: hit.album?.release_date
                ? parseInt((hit.album.release_date as string).slice(0, 4))
                : null,
            }

            await supabase.from('recommendations')
              .update({ metadata: newMetadata, ...(imageUrl ? { image_url: imageUrl } : {}) })
              .eq('id', id)
              .eq('user_id', user.id)

            return NextResponse.json({
              data: { enriched: true, image_url: imageUrl, metadata: newMetadata },
              error: null,
            })
          }
        }
      }
    }

    return NextResponse.json({ data: { enriched: false }, error: null })

  } catch (err) {
    console.error('[Enrich] Unexpected:', err)
    return NextResponse.json({ data: { enriched: false }, error: null })
  }
}

// ── CONFIRM CANDIDATE ─────────────────────────────────────────────
// Called when user taps a poster option in the card detail.
// Saves the confirmed poster and clears the candidates.

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id }   = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 })

    const body = await request.json()
    const { tmdb_id, poster_url, genre, genre_hue, overview, release_year, runtime, vote_average } = body

    const { data: rec } = await supabase
      .from('recommendations')
      .select('metadata')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!rec) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    const existingMeta = (rec.metadata as Record<string,unknown>) ?? {}
    const newMetadata = {
      ...existingMeta,
      tmdb_id, genre, genre_hue, overview,
      release_year, runtime, vote_average,
      tmdb_candidates: null, // clear candidates after confirmation
    }

    await supabase.from('recommendations')
      .update({
        metadata:  newMetadata,
        image_url: poster_url ?? null,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ data: { confirmed: true, image_url: poster_url }, error: null })

  } catch (err) {
    console.error('[Enrich PATCH]', err)
    return NextResponse.json({ data: null, error: 'Something went wrong' }, { status: 500 })
  }
}
