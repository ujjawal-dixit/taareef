// app/api/enrich/[id]/route.ts
// Background enrichment triggered after save.
// Film/TV: TMDB for poster, overview, genres, streaming.
// Music: Spotify for album art, artist, preview.
// Never blocks the save flow — called fire-and-forget.

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id }   = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 })

    const { data: rec } = await supabase
      .from('recommendations')
      .select('id, title, category, metadata')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!rec) return NextResponse.json({ data: { enriched: false }, error: null })

    // Already enriched
    if (rec.metadata && Object.keys(rec.metadata).length > 0) {
      return NextResponse.json({ data: { enriched: false, reason: 'already_enriched' }, error: null })
    }

    let metadata: Record<string, unknown> = {}
    let enriched = false

    // ── FILM / TV → TMDB ────────────────────────────────────────
    if (rec.category === 'film' || rec.category === 'tv') {
      const tmdbKey = process.env.TMDB_API_KEY
      if (tmdbKey) {
        const mediaType = rec.category === 'film' ? 'movie' : 'tv'
        const searchUrl = `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(rec.title)}&api_key=${tmdbKey}`
        const res  = await fetch(searchUrl)
        const data = await res.json()
        const hit  = data.results?.[0]

        if (hit) {
          metadata = {
            tmdb_id:      hit.id,
            poster_path:  hit.poster_path
              ? `https://image.tmdb.org/t/p/w500${hit.poster_path}`
              : null,
            overview:     hit.overview ?? null,
            release_year: hit.release_date
              ? parseInt(hit.release_date.slice(0, 4))
              : hit.first_air_date
              ? parseInt(hit.first_air_date.slice(0, 4))
              : null,
            vote_average: hit.vote_average ?? null,
          }

          // Fetch genres separately
          const detailRes  = await fetch(`https://api.themoviedb.org/3/${mediaType}/${hit.id}?api_key=${tmdbKey}`)
          const detailData = await detailRes.json()
          if (detailData.genres?.length) {
            metadata.genre = detailData.genres[0].name
          }
          if (detailData.runtime) metadata.runtime = detailData.runtime

          enriched = true

          // If there's a poster, update image_url on the recommendation
          if (metadata.poster_path) {
            await supabase
              .from('recommendations')
              .update({ image_url: metadata.poster_path, metadata })
              .eq('id', id)
            return NextResponse.json({ data: { enriched: true, metadata }, error: null })
          }
        }
      }
    }

    // ── MUSIC → SPOTIFY ─────────────────────────────────────────
    if (rec.category === 'music') {
      const clientId     = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

      if (clientId && clientSecret) {
        // Get access token (Client Credentials — no user login needed)
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: 'grant_type=client_credentials',
        })
        const tokenData = await tokenRes.json()
        const token     = tokenData.access_token

        if (token) {
          const searchRes  = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(rec.title)}&type=track,album&limit=1`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
          const searchData = await searchRes.json()

          // Try track first, then album
          const track = searchData.tracks?.items?.[0]
          const album = searchData.albums?.items?.[0]
          const hit   = track ?? album

          if (hit) {
            const artwork = hit.album?.images?.[0]?.url ?? hit.images?.[0]?.url ?? null
            metadata = {
              artist:      hit.artists?.[0]?.name ?? hit.artists?.[0]?.name ?? null,
              album:       hit.album?.name ?? hit.name ?? null,
              artwork_url: artwork,
              spotify_id:  hit.id,
              preview_url: hit.preview_url ?? null,
              release_year:hit.album?.release_date
                ? parseInt(hit.album.release_date.slice(0, 4))
                : null,
            }
            enriched = true

            if (artwork) {
              await supabase
                .from('recommendations')
                .update({ image_url: artwork, metadata })
                .eq('id', id)
              return NextResponse.json({ data: { enriched: true, metadata }, error: null })
            }
          }
        }
      }
    }

    // Save metadata even if no image
    if (enriched && Object.keys(metadata).length > 0) {
      await supabase
        .from('recommendations')
        .update({ metadata })
        .eq('id', id)
    }

    return NextResponse.json({ data: { enriched, metadata }, error: null })

  } catch (err) {
    console.error('[Enrich]', err)
    // Never error to client — enrichment failure is always silent
    return NextResponse.json({ data: { enriched: false }, error: null })
  }
}
