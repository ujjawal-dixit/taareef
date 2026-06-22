// lib/card/derive.ts
// Single source of truth for deriving display text from a recommendation.
// Used by grid cards, compact rows, AND the detail screen — so the meta
// line is identical across every surface. If it reads a key that doesn't
// exist in RecMetadata, TypeScript will catch it at build time.

import type { Category, RecMetadata } from '@/lib/types'

/**
 * Build the ordered list of display "parts" for a recommendation.
 * Returns the full list; callers slice to their surface's max
 * (detail = 4 parts, compact rows = 3 parts).
 *
 * Key names here must match what enrichment writes — RecMetadata is
 * the contract that enforces this. Never read a key that isn't in that type.
 */
export function buildMetaParts(category: Category, meta: RecMetadata): string[] {
  const p: string[] = []

  switch (category) {

    case 'watch': {
      const subtype  = meta.subtype ?? null
      // Both film director and series creator are stored under `director`
      const director = meta.director ?? null
      const genre    = Array.isArray(meta.genres) ? meta.genres[0] ?? null
        : null
      const year     = meta.release_year ?? null
      const runtime  = meta.runtime_minutes ? `${meta.runtime_minutes} min` : null
      const status   = meta.series_status ?? null
      const seasons  = meta.seasons ? `${meta.seasons} seasons` : null

      if (subtype === 'series') {
        if (director) p.push(director)   // series creator stored in director
        if (seasons)  p.push(seasons)
        if (status)   p.push(status)
        if (genre)    p.push(genre)
      } else {
        if (director) p.push(director)
        if (genre)    p.push(genre)
        if (year)     p.push(String(year))
        if (runtime)  p.push(runtime)
      }
      break
    }

    case 'listen': {
      const subtype  = meta.subtype ?? null
      const artist   = meta.artist ?? null
      const publisher = meta.publisher ?? null   // podcast: show publisher / host
      const genre    = meta.genre ?? null
      const year     = meta.release_year ?? null
      const tracks   = meta.total_tracks ? `${meta.total_tracks} tracks` : null

      if (subtype === 'podcast') {
        if (publisher) p.push(publisher)
        if (genre)     p.push(genre)
      } else if (subtype === 'artist') {
        if (genre) p.push(genre)
        if (year)  p.push(String(year))
      } else {
        // album (default) + audiobook
        if (artist) p.push(artist)
        if (genre)  p.push(genre)
        if (year)   p.push(String(year))
        if (tracks) p.push(tracks)
      }
      break
    }

    case 'read': {
      const author = meta.author ?? null
      const genre  = meta.genre ?? null
      const year   = meta.published_year ?? null
      const pages  = meta.pages ? `${meta.pages} pp` : null
      if (author) p.push(author)
      if (genre)  p.push(genre)
      if (year)   p.push(String(year))
      if (pages)  p.push(pages)
      break
    }

    case 'dine': {
      // cuisine: Foursquare writes `cuisine` (e.g. 'Indian Restaurant')
      // locality: Foursquare writes `locality` (e.g. 'Soho', 'Bandra')
      // location_hint: user's own typed city — fallback when Foursquare has no locality
      const cuisine  = meta.cuisine ?? null
      const locality = meta.locality ?? meta.location_hint ?? null
      if (cuisine)  p.push(cuisine)
      if (locality) p.push(locality)
      break
    }

    case 'do': {
      // locality first, fallback to user's location_hint
      const locality = meta.locality ?? meta.location_hint ?? null
      if (locality) p.push(locality)
      break
    }

    case 'visit': {
      // venue_name: Foursquare writes `venue_name`
      // locality: area or neighbourhood
      const venue    = meta.venue_name ?? null
      const locality = meta.locality ?? meta.location_hint ?? null
      if (venue)    p.push(venue)
      if (locality) p.push(locality)
      break
    }
  }

  return p
}

/** Convenience: parts joined with · , capped to maxParts. */
export function buildMetaLine(
  category: Category,
  meta: RecMetadata,
  maxParts = 4,
): string {
  return buildMetaParts(category, meta).slice(0, maxParts).join(' · ')
}

/** Date-urgency bucket for time-sensitive saves (e.g. exhibitions). */
export function getDateUrgency(
  dateStr: string | null,
): 'none' | 'info' | 'soon' | 'urgent' | 'closed' {
  if (!dateStr) return 'none'
  const cleaned = dateStr.replace(/until|closes|closing|through/gi, '').trim()
  const parsed  = new Date(cleaned)
  if (isNaN(parsed.getTime())) return 'info'
  const now  = new Date()
  const days = Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0)   return 'closed'
  if (days <= 7)  return 'urgent'
  if (days <= 30) return 'soon'
  return 'info'
}
