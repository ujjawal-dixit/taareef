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

      // Default to movie search for watch category; series will be caught by title matching
      const mediaType = 'movie'
      const searchUrl = `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(rec.title)}&api_key=${tmdbKey}&language=en-US`

      console.log(`[Enrich] Searching TMDB for: "${rec.title}" (watch → ${mediaType})`)

      const searchRes  = await fetch(searchUrl)
      const searchData = await searchRes.json()

      if (!searchRes.ok || !searchData.results?.length) {
        console.log(`[Enrich] No TMDB results for: "${rec.title}"`)
        // Store genre hue fallback — category colour + "unknown" genre
        await supabase.from('recommendations')
          .update({ metadata: { ...((rec.metadata as Record<string,unknown>) ?? {}), tmdb_no_results: true } })
          .eq('id', id).eq('user_id', user.id)
        return NextResponse.json({ data: { enriched: false, reason: 'no_results' }, error: null })
      }

      // Take top 3 candidates — let the user confirm the right one
      const candidates = await Promise.all(
        searchData.results.slice(0, 3).map(async (hit: Record<string,unknown>) => {
          // Fetch genre for each candidate
          let genre: string | null = null
          let genreHue: string | null = null
          let runtime: number | null = null
          try {
            const detailRes  = await fetch(`https://api.themoviedb.org/3/${mediaType}/${hit.id}?api_key=${tmdbKey}`)
            const detailData = await detailRes.json()
            genre     = (detailData.genres as Array<{name:string}>)?.[0]?.name ?? null
            runtime   = detailData.runtime ?? null
            genreHue  = genre ? (GENRE_HUES[genre] ?? null) : null
          } catch {}

          return {
            tmdb_id:      hit.id,
            title:        hit.title ?? hit.name,
            poster_url:   hit.poster_path
              ? `https://image.tmdb.org/t/p/w500${hit.poster_path}`
              : null,
            release_year: hit.release_date
              ? parseInt((hit.release_date as string).slice(0, 4))
              : hit.first_air_date
              ? parseInt((hit.first_air_date as string).slice(0, 4))
              : null,
            overview:     hit.overview ?? null,
            vote_average: hit.vote_average ?? null,
            genre,
            genre_hue:    genreHue,
            runtime,
          }
        })
      )

      console.log(`[Enrich] Found ${candidates.length} candidates for "${rec.title}"`)

      // Store candidates — do NOT set image_url yet (user must confirm)
      const existingMeta = (rec.metadata as Record<string,unknown>) ?? {}
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
