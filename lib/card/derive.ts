// lib/card/derive.ts
// Single source of truth for deriving display data from a recommendation.
// Used by the card views (grid/compact) AND the detail screen, so the
// meta line can never drift between surfaces again.

import type { Category } from '@/lib/types'

/**
 * Build the ordered list of metadata "parts" for a recommendation.
 * Returns the full list; callers slice to the count their surface allows
 * (detail = 4, compact = 3). This is the canonical, richer field selection.
 */
export function buildMetaParts(category: Category, meta: Record<string, unknown>): string[] {
  const p: string[] = []
  switch (category) {
    case 'watch': {
      const subtype  = typeof meta.subtype === 'string' ? meta.subtype : null
      const director = typeof meta.director === 'string' ? meta.director : null
      const creator  = typeof meta.created_by === 'string' ? meta.created_by : null
      const genre    = Array.isArray(meta.genres)
        ? (meta.genres as string[])[0]
        : typeof meta.genres === 'string' ? meta.genres : null
      const year     = meta.release_year ?? meta.year
      const runtime  = meta.runtime_minutes ? `${meta.runtime_minutes} min` : null
      const status   = typeof meta.series_status === 'string' ? meta.series_status : null
      const seasons  = meta.seasons ? `${meta.seasons} seasons` : null
      const platform = typeof meta.platform === 'string' ? meta.platform : null
      if (subtype === 'series') {
        if (creator)  p.push(creator)
        if (platform) p.push(platform)
        if (seasons)  p.push(seasons)
        if (status)   p.push(status)
      } else {
        if (director) p.push(director)
        if (genre)    p.push(String(genre))
        if (year)     p.push(String(year))
        if (runtime)  p.push(runtime)
      }
      break
    }
    case 'listen': {
      const artist   = typeof meta.artist === 'string' ? meta.artist : null
      const host     = typeof meta.host === 'string' ? meta.host : null
      const narrator = typeof meta.narrator === 'string' ? meta.narrator : null
      const author   = typeof meta.author === 'string' ? meta.author : null
      const genre    = typeof meta.genre === 'string' ? meta.genre : null
      const year     = meta.release_year ?? meta.year
      const tracks   = meta.total_tracks ? `${meta.total_tracks} tracks` : null
      const subtype  = typeof meta.subtype === 'string' ? meta.subtype : null
      if (subtype === 'podcast') {
        if (host)  p.push(host)
        if (genre) p.push(genre)
      } else if (subtype === 'audiobook') {
        if (author)   p.push(author)
        if (narrator) p.push(`read by ${narrator}`)
      } else if (subtype === 'artist') {
        if (genre) p.push(genre)
        if (year)  p.push(String(year))
      } else {
        // album (default)
        if (artist) p.push(artist)
        if (genre)  p.push(genre)
        if (year)   p.push(String(year))
        if (tracks) p.push(tracks)
      }
      break
    }
    case 'read': {
      const author   = typeof meta.author === 'string' ? meta.author : null
      const subgenre = typeof meta.subgenre === 'string' ? meta.subgenre
        : typeof meta.genre === 'string' ? meta.genre : null
      const year     = meta.year ?? meta.published_year
      const pages    = meta.pages ? `${meta.pages} pp` : null
      if (author)   p.push(author)
      if (subgenre) p.push(subgenre)
      if (year)     p.push(String(year))
      if (pages)    p.push(pages)
      break
    }
    case 'dine': {
      const type = typeof meta.type === 'string' ? meta.type : null
      const nbhd = typeof meta.neighbourhood === 'string' ? meta.neighbourhood : null
      const city = typeof meta.city === 'string' ? meta.city : null
      if (type) p.push(type)
      if (nbhd) p.push(nbhd)
      if (city) p.push(city)
      break
    }
    case 'do': {
      const location   = typeof meta.city === 'string' ? meta.city
        : typeof meta.location === 'string' ? meta.location : null
      const difficulty = typeof meta.difficulty === 'string' ? meta.difficulty : null
      if (location)   p.push(location)
      if (difficulty) p.push(difficulty)
      break
    }
    case 'visit': {
      const venue = typeof meta.venue === 'string' ? meta.venue : null
      const city  = typeof meta.city === 'string' ? meta.city : null
      if (venue) p.push(venue)
      if (city)  p.push(city)
      break
    }
  }
  return p
}

/** Convenience: the meta parts joined, capped to `maxParts` (detail=4, compact=3). */
export function buildMetaLine(
  category: Category,
  meta: Record<string, unknown>,
  maxParts = 4,
): string {
  return buildMetaParts(category, meta).slice(0, maxParts).join(' · ')
}

/** Date-urgency bucket for time-sensitive recommendations (e.g. exhibitions). */
export function getDateUrgency(dateStr: string | null): 'none' | 'info' | 'soon' | 'urgent' | 'closed' {
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
