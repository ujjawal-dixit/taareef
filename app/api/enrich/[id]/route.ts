// app/api/enrich/[id]/route.ts
// Fixed: update calls now include user_id filter to satisfy RLS policy.
// RLS requires auth.uid() = user_id on all writes — without it,
// the update silently matches 0 rows even with a valid session.

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
      .select('id, title, category, metadata, image_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!rec) return NextResponse.json({ data: { enriched: false }, error: null })

    // Already has an image — skip
    if (rec.image_url) {
      return NextResponse.json({ data: { enriched: false, reason: 'already_has_image' }, error: null })
    }

    let metadata: Record<string, unknown> = (rec.metadata as Record<string, unknown>) ?? {}
    let enriched = false
    let imageUrl: string | null = null

    // ── FILM / TV → TMDB ──────────────────────────────────────────
    if (rec.category === 'film' || rec.category === 'tv') {
      const tmdbKey = process.env.TMDB_API_KEY
      if (!tmdbKey) {
        console.error('[Enrich] TMDB_API_KEY not set')
        return NextResponse.json({ data: { enriched: false, reason: 'no_api_key' }, error: null })
      }

      const mediaType = rec.category === 'film' ? 'movie' : 'tv'
      const searchUrl = `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(rec.title)}&api_key=${tmdbKey}&language=en-US`

      console.log(`[Enrich] Searching TMDB for: "${rec.title}" (${mediaType})`)

      const searchRes  = await fetch(searchUrl)
      const searchData = await searchRes.json()

      if (!searchRes.ok) {
        console.error('[Enrich] TMDB search failed:', searchData)
        return NextResponse.json({ data: { enriched: false, reason: 'tmdb_error' }, error: null })
      }

      const hit = searchData.results?.[0]

      if (!hit) {
        console.log(`[Enrich] No TMDB results for: "${rec.title}"`)
        return NextResponse.json({ data: { enriched: false, reason: 'no_results' }, error: null })
      }

      console.log(`[Enrich] TMDB hit: ${hit.title ?? hit.name} (id: ${hit.id})`)

      if (hit.poster_path) {
        imageUrl = `https://image.tmdb.org/t/p/w500${hit.poster_path}`
      }

      metadata = {
        ...metadata,
        tmdb_id:      hit.id,
        poster_path:  imageUrl,
        overview:     hit.overview ?? null,
        release_year: hit.release_date
          ? parseInt(hit.release_date.slice(0, 4))
          : hit.first_air_date
          ? parseInt(hit.first_air_date.slice(0, 4))
          : null,
        vote_average: hit.vote_average ?? null,
      }

      // Fetch genres
      try {
        const detailRes  = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${hit.id}?api_key=${tmdbKey}`
        )
        const detailData = await detailRes.json()
        if (detailData.genres?.length) metadata.genre = detailData.genres[0].name
        if (detailData.runtime)        metadata.runtime = detailData.runtime
      } catch (e) {
        console.warn('[Enrich] Genre fetch failed:', e)
      }

      enriched = true
    }

    // ── MUSIC → SPOTIFY ───────────────────────────────────────────
    if (rec.category === 'music') {
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
        const tokenData = await tokenRes.json()
        const token     = tokenData.access_token

        if (token) {
          const searchRes  = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(rec.title)}&type=track,album&limit=1`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
          const searchData = await searchRes.json()
          const track = searchData.tracks?.items?.[0]
          const album = searchData.albums?.items?.[0]
          const hit   = track ?? album

          if (hit) {
            imageUrl = hit.album?.images?.[0]?.url ?? hit.images?.[0]?.url ?? null
            metadata = {
              ...metadata,
              artist:       hit.artists?.[0]?.name ?? null,
              album:        hit.album?.name ?? hit.name ?? null,
              artwork_url:  imageUrl,
              spotify_id:   hit.id,
              preview_url:  hit.preview_url ?? null,
              release_year: hit.album?.release_date
                ? parseInt(hit.album.release_date.slice(0, 4))
                : null,
            }
            enriched = true
          }
        }
      }
    }

    if (!enriched) {
      return NextResponse.json({ data: { enriched: false }, error: null })
    }

    // ── WRITE BACK TO SUPABASE ────────────────────────────────────
    // CRITICAL: must include .eq('user_id', user.id) to satisfy RLS policy.
    // Without it the update matches 0 rows silently — RLS blocks the write.
    const updatePayload: Record<string, unknown> = { metadata }
    if (imageUrl) updatePayload.image_url = imageUrl

    const { error: updateError } = await supabase
      .from('recommendations')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)  // ← THE FIX

    if (updateError) {
      console.error('[Enrich] Supabase update failed:', updateError)
      return NextResponse.json({ data: { enriched: false, reason: 'update_failed' }, error: null })
    }

    console.log(`[Enrich] Success for "${rec.title}" — image: ${imageUrl ? 'yes' : 'no'}`)

    return NextResponse.json({
      data: { enriched: true, image_url: imageUrl, metadata },
      error: null,
    })

  } catch (err) {
    console.error('[Enrich] Unexpected error:', err)
    return NextResponse.json({ data: { enriched: false }, error: null })
  }
}
