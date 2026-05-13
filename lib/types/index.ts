// lib/types/index.ts
// Single source of truth for all TypeScript types.
// Never inline types in component files — always import from here.
// No `any`. No shortcuts. Every type earns its place.

// ============================================================
// ENUMS
// ============================================================

// 10 categories — locked. No additions without explicit approval.
export type Category =
  | 'restaurant'
  | 'bar'
  | 'film'
  | 'tv'
  | 'music'
  | 'book'
  | 'city'
  | 'activity'
  | 'podcast'
  | 'person'

// Source types — where the recommendation came from
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

// Reaction — set only after experiencing. 4 options, not binary.
// NULL until the user marks a recommendation as experienced.
export type Reaction = 'loved' | 'good' | 'okay' | 'skip'

// Priority
export type Priority = 'low' | 'medium' | 'high'

// Music subcategory — the only category with subcategories
export type MusicSubcategory = 'song' | 'album' | 'artist'

// Status is category-specific — NOT a global enum.
// Each category defines its own valid states when built.
// The status column in Supabase is TEXT with per-category check constraints.

// ============================================================
// LOCATION
// ============================================================

export type Location = {
  city?: string
  country?: string
  address?: string
  lat?: number
  lng?: number
}

// ============================================================
// METADATA — shape varies by category
// Stored in the metadata JSONB column in Supabase.
// ============================================================

// Film metadata
export type FilmMetadata = {
  tmdb_id?: number
  poster_path?: string
  genre?: string
  streaming?: string       // where to watch
  runtime_minutes?: number
  year?: number
  director?: string
  rating?: number
}

// TV metadata
export type TVMetadata = {
  tmdb_id?: number
  poster_path?: string
  genre?: string
  streaming?: string
  seasons?: number
  episode_runtime?: number
  currently_on?: string    // "S2 E4"
  rating?: number
}

// Music metadata
export type MusicMetadata = {
  spotify_id?: string
  artist?: string
  album?: string
  artwork_url?: string
  genre?: string
  year?: number
  listen_count?: number    // increments each time user taps "Listened again"
  music_subcategory?: MusicSubcategory
}

// Book metadata
export type BookMetadata = {
  isbn?: string
  author?: string
  cover_url?: string
  genre?: string
  pages?: number
  year?: number
  publisher?: string
  progress_percent?: number  // for "currently reading"
}

// Restaurant / Bar metadata
export type PlaceMetadata = {
  google_place_id?: string
  neighbourhood?: string
  cuisine?: string
  type?: string            // bar type: rooftop, cocktail bar, wine bar
  price_level?: number     // 1-3
  opening_hours?: string[]
  phone?: string
  website?: string
}

// City metadata
export type CityMetadata = {
  country?: string
  type?: string            // beach, mountain, city break
  best_season?: string
  suggested_duration?: string
  coordinates?: { lat: number; lng: number }
}

// Activity metadata
export type ActivityMetadata = {
  location?: string
  type?: string            // outdoor, experience, class, adventure
  duration?: string        // half day, full day
  price_level?: number
  best_season?: string
}

// Podcast metadata
export type PodcastMetadata = {
  podcast_name?: string
  episode_title?: string
  feed_url?: string
  artwork_url?: string
  host?: string
  duration_minutes?: number
  topic?: string
  listen_count?: number
}

// Person metadata
export type PersonMetadata = {
  platform?: string        // instagram, youtube, twitter
  handle?: string
  url?: string
  specialty?: string
  follower_count?: number
}

// Union type — use when metadata shape is unknown
export type AnyMetadata =
  | FilmMetadata
  | TVMetadata
  | MusicMetadata
  | BookMetadata
  | PlaceMetadata
  | CityMetadata
  | ActivityMetadata
  | PodcastMetadata
  | PersonMetadata

// ============================================================
// CORE ENTITY
// ============================================================

export type Recommendation = {
  id: string
  user_id: string
  title: string
  category: Category
  source_type: SourceType
  source_name: string              // "Arjun", "Bon Appétit", "that long drive"
  url: string | null
  image_url: string | null
  notes: string | null             // user's own note — set post-save
  location: Location | null
  status: string                   // category-specific
  priority: Priority
  reaction: Reaction | null        // null until experienced
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ============================================================
// EXAMPLE CARD — for onboarding seeded cards
// ============================================================

export type ExampleCard = Pick<
  Recommendation,
  | 'id'
  | 'title'
  | 'category'
  | 'source_type'
  | 'source_name'
  | 'notes'
  | 'image_url'
  | 'status'
  | 'priority'
  | 'reaction'
> & {
  location?: Location
  metadata?: Record<string, unknown>
}

// ============================================================
// API SHAPES
// ============================================================

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  meta?: {
    total?: number
    page?: number
  }
}

// ============================================================
// INPUT TYPES — for API routes
// ============================================================

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
  metadata?: Record<string, unknown>
}

export type UpdateRecommendationInput = Partial<{
  title: string
  source_name: string
  source_type: SourceType
  notes: string
  status: string
  reaction: Reaction
  priority: Priority
  location: Location
  metadata: Record<string, unknown>
  url: string
  image_url: string
}>

// ============================================================
// PARSE SHAPES — V2 parse endpoint
// ============================================================

export type ParseInputType = 'url' | 'text' | 'ocr' | 'audio'

export type ParsedRecommendation = {
  title: string | null
  category: Category | null
  source_type: SourceType | null
  source_name: string | null
  notes: string | null
  url: string | null
  location: { city: string; country: string } | null
  confidence: 'high' | 'medium' | 'low'
  music_subcategory?: MusicSubcategory
}

// ============================================================
// CAPTURE RESULT — what extraction returns before confirmation
// ============================================================

export type CaptureResult = {
  parsed: ParsedRecommendation
  rawInput: string
  inputType: ParseInputType
  capturedAt: string
}

// ============================================================
// USER PREFERENCES — stored in Supabase user_metadata
// ============================================================

export type UserPreferences = {
  nudge_questions_answered: number     // index into nudge question bank
  preference_data: Record<string, string>  // answers to nudge questions
  onboarding_completed: boolean
}

// ============================================================
// EXPERIENCED LOG — what gets saved when user marks experienced
// ============================================================

export type ExperienceLog = {
  experienced_at?: string        // ISO date
  experienced_with?: 'solo' | 'partner' | 'friends' | 'family'
  experience_note?: string       // max 80 chars
  told_source?: boolean          // did they tell Rohit?
}
