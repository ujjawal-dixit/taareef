// components/features/cards/poster-card.tsx
// List view card for visual categories.
// Image top 38% (52% for hero card in mixed grid).
// Source always visible, always terracotta.
// Used for: Film, TV, Music, Book, City, Podcast, Person.

'use client'

import Image from 'next/image'
import { getCategoryConfig } from '@/constants/categories'
import { isExampleCard } from '@/constants/example-cards'
import { CategoryPlaceholder } from '@/components/ui/category-placeholder'
import type { Recommendation, ExampleCard } from '@/lib/types'

type PosterCardProps = {
  recommendation: Recommendation | ExampleCard
  onClick?: () => void
  isHero?: boolean   // first card in mixed grid — taller image
}

export function PosterCard({
  recommendation,
  onClick,
  isHero = false,
}: PosterCardProps) {
  const config = getCategoryConfig(recommendation.category)
  const metadata = (recommendation.metadata ?? {}) as Record<string, unknown>
  const isExample = isExampleCard(recommendation.id)
  const signal = getCategorySignal(recommendation, metadata)

  return (
    <article
      className={[
        'card-base cursor-pointer gpu animate-card-enter',
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
      {/* Example badge */}
      {isExample && (
        <div className="absolute top-3 right-3 z-10" aria-hidden="true">
          <span className="text-[10px] font-sans font-semibold text-neutral-400 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
            example
          </span>
        </div>
      )}

      {/* Image — taller for hero card */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingTop: isHero ? '52%' : '38%' }}
      >
        {recommendation.image_url ? (
          <Image
            src={recommendation.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 480px) 100vw, 480px"
          />
        ) : (
          <div className="absolute inset-0">
            <CategoryPlaceholder category={recommendation.category} size="full" />
          </div>
        )}

        {/* Gradient fade into card content */}
        <div
          className="absolute bottom-0 left-0 right-0 h-10"
          style={{
            background: 'linear-gradient(to bottom, transparent, hsl(30, 20%, 99%))',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-3 flex flex-col gap-1.5">

        {/* Category chip */}
        <span
          className="category-chip self-start"
          style={{ backgroundColor: config.colourHex }}
        >
          <span aria-hidden="true">{config.icon}</span>
          {config.label}
        </span>

        {/* Title */}
        <h3 className="font-display text-card text-neutral-900 line-clamp-2 leading-snug">
          {recommendation.title}
        </h3>

        {/* Source — always visible, always terracotta */}
        <p className="source-text">
          From {recommendation.source_name}
        </p>

        {/* Category-specific signal */}
        {signal && (
          <p className="text-meta text-neutral-500 line-clamp-1">
            {signal}
          </p>
        )}

      </div>
    </article>
  )
}

// ============================================================
// CATEGORY SIGNAL — the one piece of info that matters at a glance
// ============================================================

function getCategorySignal(
  rec: Recommendation | ExampleCard,
  metadata: Record<string, unknown>
): string | null {
  switch (rec.category) {
    case 'film':
    case 'tv':
      return [metadata.streaming, metadata.genre]
        .filter(Boolean).join(' · ') || null

    case 'music': {
      const parts: string[] = []
      if (typeof metadata.artist === 'string') parts.push(metadata.artist)
      if (typeof metadata.listen_count === 'number' && metadata.listen_count > 0) {
        parts.push(`Listened ${metadata.listen_count}×`)
      }
      return parts.join(' · ') || null
    }

    case 'book':
      return [metadata.author, metadata.genre].filter(Boolean).join(' · ') || null

    case 'city': {
      const location = rec.location
      const country = location && typeof location === 'object' && 'country' in location
        ? location.country
        : null
      return [country, metadata.type].filter(Boolean).join(' · ') || null
    }

    case 'podcast':
      return typeof metadata.topic === 'string' ? metadata.topic : null

    case 'person':
      return [metadata.platform, metadata.specialty].filter(Boolean).join(' · ') || null

    default:
      return null
  }
}
