// lib/types/index.ts
// Single source of truth for all TypeScript types.
// Never inline types in component files — always import from here.

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

// Status is category-specific — NOT a global enum.
// Each category defines its own valid states when built.
// The status column in Supabase is TEXT with per-category check constraints.
// See DATA_MODEL.md for constraint patterns.

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
// CORE ENTITY
// ============================================================

export type Recommendation = {
  id: string
  user_id: string
  title: string
  category: Category
  source_type: SourceType
  source_name: string              // "Arjun", "Bon Appétit", "that NYT piece"
  url: string | null
  image_url: string | null
  notes: string | null             // user's own note — set at detail view, not save time
  location: Location | null        // for physical places; null for music, podcasts, people
  status: string                   // category-specific — see per-category spec
  priority: Priority
  reaction: Reaction | null        // null until experienced
  metadata: Record<string, unknown> // enrichment data — shape varies by category
  created_at: string               // ISO 8601 timestamp
  updated_at: string               // ISO 8601 timestamp
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

export type UpdateRecommendationInput = {
  title?: string
  source_name?: string
  source_type?: SourceType
  notes?: string
  status?: string
  reaction?: Reaction
  priority?: Priority
  location?: Location
  metadata?: Record<string, unknown>
  // Nuance fields — set from card detail view, post-save
  occasion?: string
  mood?: string
  price?: string
  best_time?: string
}

// ============================================================
// PARSE SHAPES (V2 — defined now for type safety)
// ============================================================

export type ParseInputType = 'url' | 'text' | 'ocr'

export type ParsedRecommendation = {
  title: string | null
  category: Category | null
  source_type: SourceType | null
  source_name: string | null
  notes: string | null
  url: string | null
  location: { city: string; country: string } | null
  confidence: 'high' | 'medium' | 'low'
}

// ============================================================
// ONBOARDING
// ============================================================

export type UserPreferences = {
  default_categories: Category[]
}

// ============================================================
// EXAMPLE CARDS (for onboarding — partial Recommendation shape)
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
