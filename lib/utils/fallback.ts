// lib/utils/fallback.ts
// Taareef — Fallback system for missing images
// Every missing image becomes a designed gradient state

import { getCategoryBloom, getCategoryGradient, CATEGORY_MAP } from '@/constants/categories'
import type { Category } from '@/lib/types'

export type FallbackStyle = {
  background: string
  vividColor: string
}

export function getFallbackStyle(category: Category): FallbackStyle {
  const config = CATEGORY_MAP[category]
  return {
    background: getCategoryBloom(category),
    vividColor: config.vividColor,
  }
}

export function getFallbackGradient(category: Category): string {
  return getCategoryGradient(category)
}

export function hasValidImage(url: string | null | undefined): boolean {
  if (!url) return false
  if (url.trim() === '') return false
  return true
}
