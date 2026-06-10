// lib/types/index.ts
// Single source of truth for all TypeScript types.
// Never inline types in component files.

// ── CATEGORY ─────────────────────────────────────────────────────
// 6 experience-based categories. Locked.
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
  metadata: Record<string, unknown>
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
  metadata?: Record<string, unknown>
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
  metadata?: Record<string, unknown>
}
