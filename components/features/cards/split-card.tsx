// components/features/cards/split-card.tsx
// List view card for physical place categories.
// Text leads — no image in list view.
// Category colour left border accent.
// Used for: Restaurant, Bar, Activity.

'use client'

import { getCategoryConfig } from '@/constants/categories'
import { isExampleCard } from '@/constants/example-cards'
import type { Recommendation, ExampleCard } from '@/lib/types'

type SplitCardProps = {
  recommendation: Recommendation | ExampleCard
  onClick?: () => void
}

export function SplitCard({ recommendation, onClick }: SplitCardProps) {
  const config = getCategoryConfig(recommendation.category)
  const metadata = (recommendation.metadata ?? {}) as Record<string, unknown>
  const isExample = isExampleCard(recommendation.id)
  const signals = getCategorySignals(recommendation, metadata)

  return (
    <article
      className={[
        'card-base cursor-pointer gpu animate-card-enter flex overflow-hidden',
        isExample ? 'opacity-90' : 'opacity-100',
      ].join(' ')}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-label={`${recommendation.title}, recommended by ${recommendation.source_name}`}
    >
      {/* Category colour left border */}
      <div
        className="w-1 flex-shrink-0"
        style={{ backgroundColor: config.colourHex }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-1.5">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <span
            className="category-chip"
            style={{ backgroundColor: config.colourHex }}
          >
            <span aria-hidden="true">{config.icon}</span>
            {config.label}
          </span>

          {isExample && (
            <span className="text-[10px] font-sans font-semibold text-neutral-400" aria-hidden="true">
              example
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-card text-neutral-900 line-clamp-1 leading-snug">
          {recommendation.title}
        </h3>

        {/* Source */}
        <p className="source-text">
          From {recommendation.source_name}
        </p>

        {/* Signals */}
        {signals.length > 0 && (
          <p className="text-meta text-neutral-500">
            {signals.join(' · ')}
          </p>
        )}

      </div>
    </article>
  )
}

function getCategorySignals(
  rec: Recommendation | ExampleCard,
  metadata: Record<string, unknown>
): string[] {
  const location = rec.location

  const getCity = (): string | null => {
    if (location && typeof location === 'object' && 'city' in location) {
      return typeof location.city === 'string' ? location.city : null
    }
    return null
  }

  const getNeighbourhood = (): string | null =>
    typeof metadata.neighbourhood === 'string' ? metadata.neighbourhood : null

  switch (rec.category) {
    case 'restaurant':
      return [getNeighbourhood() ?? getCity(), metadata.cuisine as string | undefined]
        .filter((s): s is string => Boolean(s))

    case 'bar':
      return [getNeighbourhood() ?? getCity(), metadata.type as string | undefined]
        .filter((s): s is string => Boolean(s))

    case 'activity':
      return [getCity() ?? (metadata.location as string | undefined), metadata.type as string | undefined]
        .filter((s): s is string => Boolean(s))

    default:
      return []
  }
}
