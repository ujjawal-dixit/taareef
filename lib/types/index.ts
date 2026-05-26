// lib/types/index.ts
// Taareef — All TypeScript types
// Single source of truth — never inline types elsewhere

export type Category =
  | 'watch'
  | 'listen'
  | 'read'
  | 'eat'
  | 'drink'
  | 'go'
  | 'do'
  | 'see'

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

export type Reaction = 'loved' | 'good' | 'okay' | 'skip'

export type Priority = 'low' | 'medium' | 'high'

export type Location = {
  city?: string
  country?: string
  address?: string
  lat?: number
  lng?: number
}

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

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  meta?: {
    total?: number
    page?: number
  }
}

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
  reaction?: Reaction | null
  priority?: Priority
  location?: Location
  metadata?: Record<string, unknown>
}

export const VALID_CATEGORIES: Category[] = [
  'watch', 'listen', 'read', 'eat', 'drink', 'go', 'do', 'see'
]

export function isValidCategory(value: string): value is Category {
  return VALID_CATEGORIES.includes(value as Category)
}
