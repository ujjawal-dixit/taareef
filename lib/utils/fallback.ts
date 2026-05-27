// lib/utils/fallback.ts
// Fallback utilities for missing images and category gradients.

import { getCardGradient, CATEGORY_MAP } from '@/constants/categories'
import type { Category } from '@/lib/types'

export function hasValidImage(url: string | null | undefined): boolean {
  if (!url) return false
  return url.trim() !== ''
}

export function getFallbackBackground(category: Category): string {
  return getCardGradient(category)
}

export function getVividColor(category: Category): string {
  return CATEGORY_MAP[category]?.vividColor ?? '#1fce94'
}
