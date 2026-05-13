// components/features/cards/recommendation-card.tsx
// Routes to the correct card variant based on category.
// PosterCard for visual categories, SplitCard for physical places.
// Always use this in list views — never PosterCard or SplitCard directly.

import { PosterCard } from './poster-card'
import { SplitCard } from './split-card'
import { isPhysicalCategory } from '@/constants/categories'
import type { Recommendation, ExampleCard } from '@/lib/types'

type RecommendationCardProps = {
  recommendation: Recommendation | ExampleCard
  onClick?: () => void
  isHero?: boolean
}

export function RecommendationCard({
  recommendation,
  onClick,
  isHero = false,
}: RecommendationCardProps) {
  if (isPhysicalCategory(recommendation.category)) {
    return (
      <SplitCard
        recommendation={recommendation}
        onClick={onClick}
      />
    )
  }

  return (
    <PosterCard
      recommendation={recommendation}
      onClick={onClick}
      isHero={isHero}
    />
  )
}
