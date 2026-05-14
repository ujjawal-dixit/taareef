// lib/types/index.ts
// Single source of truth for all TypeScript types.
// Never inline types in component files — always import from here.

export type Category =
  | 'restaurant' | 'bar' | 'film' | 'tv'
  | 'music' | 'book' | 'city' | 'activity'
  | 'podcast' | 'person'

export type SourceType =
  | 'friend' | 'family' | 'colleague'
  | 'instagram' | 'twitter' | 'youtube'
  | 'article' | 'newsletter' | 'podcast' | 'self'

export type Reaction = 'loved' | 'good' | 'okay' | 'skip'

export type Priority = 'low' | 'medium' | 'high'

export type Recommendation = {
  id:          string
  user_id:     string
  title:       string
  category:    Category
  source_type: SourceType
  source_name: string
  url:         string | null
  image_url:   string | null
  notes:       string | null
  location: {
    city?:    string
    country?: string
    address?: string
    lat?:     number
    lng?:     number
  } | null
  status:     string
  priority:   Priority
  reaction:   Reaction | null
  metadata:   Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CreateRecommendationInput = {
  title:       string
  category:    Category
  source_type: SourceType
  source_name: string
  url?:        string
  image_url?:  string
  notes?:      string
  location?: {
    city?:    string
    country?: string
    address?: string
    lat?:     number
    lng?:     number
  }
  priority?: Priority
  metadata?: Record<string, unknown>
}

export type UpdateRecommendationInput = Partial<{
  title:       string
  source_name: string
  source_type: SourceType
  notes:       string
  status:      string
  reaction:    Reaction
  priority:    Priority
  location: {
    city?:    string
    country?: string
    address?: string
    lat?:     number
    lng?:     number
  }
  metadata:    Record<string, unknown>
}>

export type ApiResponse<T> = {
  data:  T | null
  error: string | null
  meta?: {
    total?: number
    page?:  number
  }
}

export type UserPreferences = {
  id:                   string
  user_id:              string
  default_categories:   Category[]
  nudge_answered_count: number
  onboarding_complete:  boolean
  created_at:           string
  updated_at:           string
}

export type NudgeQuestion = {
  id:      string
  question: string
  options: { label: string; value: string }[]
}
