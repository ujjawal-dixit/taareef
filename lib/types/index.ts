// lib/types/index.ts
// Single source of truth for all TypeScript types.
// Never inline types in component files.

// ── CATEGORY ─────────────────────────────────────────────────────
export type Category =
  | 'watch'   // Film · Series · Documentary           — Warli
  | 'listen'  // Album · Podcast · Audiobook · Artist   — Gond
  | 'read'    // Fiction · Non-fiction · Poetry         — Madhubani
  | 'dine'    // Restaurant · Café · Bar · Street food  — Block-print
  | 'do'      // Hike · Trail · Adventure · Workshop · Live show — Saora
  | 'visit'   // Museum · Gallery · Heritage · Viewpoint · Market — Kalamkari

export const VALID_CATEGORIES: Category[] = [
  'watch', 'listen', 'read', 'dine', 'do', 'visit',
]

export function isValidCategory(value: string): value is Category {
  return VALID_CATEGORIES.includes(value as Category)
}

// ── SOURCE TYPE ───────────────────────────────────────────────────
export type SourceType =
  | 'friend'
  | 'family'
  | 'colleague'
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'article'
  | 'newsletter'
  | 'podcast'
  | 'self'

// ── REACTION ──────────────────────────────────────────────────────
// Set only after experiencing. Never at save time.
export type Reaction = 'loved' | 'good' | 'okay' | 'skip'

// ── PRIORITY ──────────────────────────────────────────────────────
export type Priority = 'low' | 'medium' | 'high'

// ── LOCATION ──────────────────────────────────────────────────────
export type Location = {
  city?: string
  country?: string
  address?: string
  lat?: number
  lng?: number
}

// ── METADATA CONTRACT ─────────────────────────────────────────────
// The canonical vocabulary for every field any layer writes or reads.
// Writers (enrichment routes, capture screen) and readers (derive.ts,
// detail screen, card components) must all use these exact key names.
// Adding a key here and using it in tsc-checked code prevents the
// vocabulary-mismatch bugs that caused recurring silent failures.
export type RecMetadata = {
  // ── subtype (all categories) ────────────────────────────────────
  subtype?: string | null           // film | series | documentary | album | podcast | artist | audiobook | restaurant | café | bar | ...

  // ── capture-time supplementary (from understand route) ──────────
  location_hint?: string | null     // city/area hint the user gave at save time — fallback when enrichment has no locality
  what_to_order?: string | null     // dine: specific dish/drink mentioned
  dates?: string | null             // visit: closing or run dates

  // ── watch enrichment (TMDB) ─────────────────────────────────────
  tmdb_id?: number | null
  tmdb_confirmed?: boolean
  tmdb_candidates?: TmdbCandidate[] | null
  director?: string | null          // film director OR series creator (both fold here)
  cast?: string[]                   // top 3 cast names
  genres?: string[]                 // e.g. ['Drama', 'Thriller']
  release_year?: number | null
  runtime_minutes?: number | null
  overview?: string | null
  streaming_platforms?: string[]    // e.g. ['Netflix', 'Prime Video'] — first element shown as logo
  series_status?: string | null     // 'Ended' | 'Returning Series' | etc.
  seasons?: number | null

  // ── listen enrichment (Spotify) ─────────────────────────────────
  spotify_id?: string | null
  artist?: string | null            // album: artist name
  publisher?: string | null         // podcast: publisher / show host
  total_tracks?: number | null      // album: track count
  artwork_url?: string | null       // Spotify CDN URL (set as image_url too)
  release_year_listen?: number | null // kept separate to avoid collision with watch

  // ── read enrichment (Google Books) ──────────────────────────────
  google_books_id?: string | null
  author?: string | null
  published_year?: number | null
  pages?: number | null
  genre?: string | null
  description?: string | null
  language?: string | null
  books_candidates?: BookCandidate[] | null

  // ── dine / visit / do enrichment (Foursquare) ───────────────────
  foursquare_id?: string | null
  foursquare_confirmed?: boolean
  venue_name?: string | null        // confirmed venue name from Foursquare
  address?: string | null
  locality?: string | null          // neighbourhood or area (e.g. 'Soho', 'Bandra')
  cuisine?: string | null           // e.g. 'Indian', 'Italian', 'Café'

  // ── user actions ────────────────────────────────────────────────
  user_uploaded?: boolean           // true when user uploaded their own poster

  place_no_results?: boolean        // true when Google found no results for this place

  // Place candidate strip — shown when LLM confidence is 'possible'
  place_candidates?: PlaceCandidate[] | null
}

export type PlaceCandidate = {
  name:     string
  address:  string | null
  locality: string | null
  cuisine:  string | null
  photoUrl: string | null     // already-fetched image URL — ready to use on confirm
}

// Candidate types used in enrichment flows
export type TmdbCandidate = {
  tmdb_id: number
  title: string
  poster_path: string | null
  poster_url: string | null
  release_year: number | null
  subtype: string
}

export type BookCandidate = {
  google_id: string
  title: string
  author: string | null
  published_year: number | null
  cover_url: string | null
  genre: string | null
  pages: number | null
  description: string | null
  language: string | null
}

// ── RECOMMENDATION ────────────────────────────────────────────────
export type Recommendation = {
  id: string
  user_id: string
  title: string
  category: Category
  source_type: SourceType
  source_name: string
  url: string | null
  image_url: string | null
  notes: string | null
  location: Location | null
  status: string
  priority: Priority
  reaction: Reaction | null
  metadata: RecMetadata          // typed — no longer a free-for-all bag
  created_at: string
  updated_at: string
}

// ── API RESPONSE ──────────────────────────────────────────────────
export type ApiResponse<T> = {
  data: T | null
  error: string | null
  meta?: { total?: number; page?: number }
}

// ── CREATE INPUT ──────────────────────────────────────────────────
export type CreateRecommendationInput = {
  title: string
  category: Category
  source_type: SourceType
  source_name: string
  url?: string
  image_url?: string
  notes?: string
  location?: Location
  priority?: Priority
  metadata?: RecMetadata
}

// ── UPDATE INPUT ──────────────────────────────────────────────────
export type UpdateRecommendationInput = {
  title?: string
  source_name?: string
  source_type?: SourceType
  notes?: string
  status?: string
  reaction?: Reaction | null
  priority?: Priority
  location?: Location
  metadata?: RecMetadata
}
