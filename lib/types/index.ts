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
  | 'friend' | 'family' | 'colleague'
  | 'instagram' | 'twitter' | 'youtube'
  | 'article' | 'newsletter' | 'podcast'
  | 'self'

// ── REACTION ──────────────────────────────────────────────────────
// Set only after experiencing. Never at save time.
export type Reaction = 'loved' | 'good' | 'okay' | 'skip'

// ── PRIORITY ──────────────────────────────────────────────────────
export type Priority = 'low' | 'medium' | 'high'

// ── LOCATION ──────────────────────────────────────────────────────
export type Location = {
  city?:    string
  country?: string
  address?: string
  lat?:     number
  lng?:     number
}

// ── METADATA CONTRACT ─────────────────────────────────────────────
// The canonical vocabulary for every field any layer writes or reads.
// Writers (enrichment routes, capture screen) and readers (derive.ts,
// card components) must all use these exact key names. TypeScript
// enforces this at build time — drift fails the build, not production.
export type RecMetadata = {

  // ── universal ────────────────────────────────────────────────────
  subtype?:        string | null  // film | series | album | podcast | restaurant | …

  // ── capture-time supplementary ───────────────────────────────────
  location_hint?:  string | null  // neighbourhood/city typed at save — fallback for locality
  what_to_order?:  string | null  // dine: dish/drink the user mentioned
  dates?:          string | null  // visit: run/closing dates

  // Session 18 — evidence the person gave, kept for matching. MACHINE-FACING:
  // none of these three is ever rendered. A remark or review belongs in
  // `notes`, which the detail screen shows as "Your note".
  capture_people?: string[] | null  // people they named — actors, artists, authors
  capture_year?:   number | null    // a year they mentioned; soft evidence, never a filter
  capture_text?:   string | null    // what they actually said, capped at 500 chars
  capture_method?: 'type' | 'speak' | 'scan' | null  // how they entered it

  // ── watch — TMDB ─────────────────────────────────────────────────
  tmdb_id?:             number | null
  tmdb_confirmed?:      boolean
  tmdb_candidates?:     TmdbCandidate[] | null
  director?:            string | null   // film director OR series creator
  cast?:                string[]        // top 3 cast names
  genres?:              string[]        // ['Drama', 'Thriller']
  release_year?:        number | null   // film release OR series first air year
  runtime_minutes?:     number | null
  overview?:            string | null
  streaming_platforms?: string[]        // ['Netflix', 'Prime Video']
  series_status?:       string | null   // 'Ended' | 'Returning Series'
  seasons?:             number | null

  // ── listen — Spotify ─────────────────────────────────────────────
  spotify_id?:    string | null
  artist?:        string | null   // album: artist name
  publisher?:     string | null   // podcast: publisher / show host
  total_tracks?:  number | null   // album track count
  // ── read — Google Books ───────────────────────────────────────────
  google_books_id?: string | null
  author?:          string | null
  published_year?:  number | null
  pages?:           number | null
  genre?:           string | null  // single genre string from Books API
  description?:     string | null
  language?:        string | null
  books_candidates?:  BookCandidate[] | null
  books_no_results?:  boolean       // true when Books API found nothing

  // ── dine / visit / do — Google Places ────────────────────────────
  place_confirmed?:   boolean
  venue_name?:        string | null       // confirmed venue display name
  address?:           string | null       // full formatted address
  locality?:          string | null       // neighbourhood / area
  cuisine?:           string | null       // primaryType in Title Case
  place_candidates?:  PlaceCandidate[] | null
  place_no_results?:  boolean             // true when Places API found nothing
  place_photo_refs?:  string[] | null     // chosen venue's top photo refs — feeds the photo picker

  // ── user ─────────────────────────────────────────────────────────
  user_uploaded?: boolean  // true when user uploaded their own photo
}

// ── CANDIDATE TYPES ───────────────────────────────────────────────
export type TmdbCandidate = {
  tmdb_id:      number
  title:        string
  poster_path:  string | null
  poster_url:   string | null  // full CDN URL — card renders this directly
  release_year: number | null
  subtype:      string
}

export type BookCandidate = {
  google_id:     string
  title:         string
  author:        string | null
  published_year: number | null
  cover_url:     string | null  // full URL — consistent with TmdbCandidate.poster_url
  genre:         string | null
  pages:         number | null
  description:   string | null
  language:      string | null
}

export type PlaceCandidate = {
  name:       string
  address:    string | null
  locality:   string | null
  cuisine:    string | null
  photoUrl:   string | null  // already-fetched thumbnail URL (strip display)
  photo_refs: string[]       // Google photo resource names — lazily resolvable
}

// ── RECOMMENDATION ────────────────────────────────────────────────
export type Recommendation = {
  id:          string
  user_id:     string
  title:       string
  category:    Category
  source_type: SourceType
  source_name: string
  url:         string | null
  image_url:   string | null  // DB column — the card's hero image
  notes:       string | null
  location:    Location | null
  status:      string
  priority:    Priority
  reaction:    Reaction | null
  metadata:    RecMetadata
  created_at:  string
  updated_at:  string
}

// ── API RESPONSE ──────────────────────────────────────────────────
export type ApiResponse<T> = {
  data:   T | null
  error:  string | null
  meta?:  { total?: number; page?: number }
}

// ── CREATE INPUT ──────────────────────────────────────────────────
export type CreateRecommendationInput = {
  title:        string
  category:     Category
  source_type:  SourceType
  source_name:  string
  url?:         string
  image_url?:   string    // sets the image_url DB column directly
  notes?:       string
  location?:    Location
  priority?:    Priority
  metadata?:    RecMetadata
}

// ── UPDATE INPUT ──────────────────────────────────────────────────
export type UpdateRecommendationInput = {
  title?:       string
  image_url?:   string | null  // sets the image_url DB column (photo picker / candidate confirm)
  source_name?: string
  source_type?: SourceType
  notes?:       string
  status?:      string
  reaction?:    Reaction | null
  priority?:    Priority
  location?:    Location
  metadata?:    RecMetadata
}
