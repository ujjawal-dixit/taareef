'use client'

// components/features/cards/recommendation-card.tsx
// Routes to poster or split card based on category.
// Poster: film, music, book, podcast, tv, city, person.
// Split:  restaurant, bar, activity.

import { useRouter } from 'next/navigation'
import { getCategoryConfig, isPhysicalCategory } from '@/constants/categories'
import type { Recommendation } from '@/lib/types'

type CardProps = {
  recommendation: Recommendation
  isHero?: boolean
}

export function RecommendationCard({ recommendation, isHero = false }: CardProps) {
  if (isPhysicalCategory(recommendation.category)) {
    return <SplitCard recommendation={recommendation} />
  }
  return <PosterCard recommendation={recommendation} isHero={isHero} />
}

// ── POSTER CARD ───────────────────────────────────────────────────
function PosterCard({ recommendation, isHero }: CardProps) {
  const router   = useRouter()
  const config   = getCategoryConfig(recommendation.category)
  const metadata = (recommendation.metadata ?? {}) as Record<string, unknown>

  const signal = getSignal(recommendation, metadata)
  const imgGradient = getImageGradient(recommendation.category)

  return (
    <article
      className="card-poster"
      onClick={() => router.push(`/rec/${recommendation.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') router.push(`/rec/${recommendation.id}`) }}
      aria-label={`${recommendation.title} from ${recommendation.source_name}`}
    >
      {/* Image zone */}
      <div className={`card-image ${isHero ? 'hero' : 'standard'}`}>

        {/* Base gradient — category colour */}
        <div
          className="card-img-bg"
          style={{ background: imgGradient.bg }}
          aria-hidden="true"
        />

        {/* Atmospheric light leak */}
        <div
          className="card-img-atm"
          style={{ background: imgGradient.atm }}
          aria-hidden="true"
        />

        {/* Real image if available */}
        {recommendation.image_url && (
          <img
            src={recommendation.image_url}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Category badge */}
        <div
          className="card-badge"
          style={{
            background: config.badgeBg,
            border: `0.5px solid ${config.badgeBorder}`,
          }}
        >
          {config.shortLabel}
        </div>

        {/* Fade into card body */}
        <div className="card-img-fade" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="card-body">
        <h3 className="card-title">{recommendation.title}</h3>
        <span className="card-source">From {recommendation.source_name}</span>
        {signal && (
          <div className="card-meta">
            {signal.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="meta-dot" aria-hidden="true" />}
                {part}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

// ── SPLIT CARD ────────────────────────────────────────────────────
function SplitCard({ recommendation }: CardProps) {
  const router = useRouter()
  const config = getCategoryConfig(recommendation.category)
  const metadata = (recommendation.metadata ?? {}) as Record<string, unknown>
  const signals  = getSplitSignals(recommendation, metadata)

  return (
    <article
      className="card-split"
      onClick={() => router.push(`/rec/${recommendation.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') router.push(`/rec/${recommendation.id}`) }}
      aria-label={`${recommendation.title} from ${recommendation.source_name}`}
    >
      {/* Category colour left accent */}
      <div
        className="split-accent"
        style={{
          background: `linear-gradient(to bottom, ${config.colourHex}, ${config.colourHex}14)`,
        }}
        aria-hidden="true"
      />

      <div className="split-body">
        {/* Category badge */}
        <div
          className="split-badge"
          style={{
            color:       config.colourHex,
            background:  `${config.colourHex}18`,
            border:      `0.5px solid ${config.colourHex}30`,
          }}
        >
          {config.label}
        </div>

        <h3 className="split-title">{recommendation.title}</h3>
        <span className="split-source">From {recommendation.source_name}</span>

        {signals.length > 0 && (
          <div className="split-meta">
            {signals.map((s, i) => (
              <span key={i}>
                {i > 0 && <span className="meta-dot" aria-hidden="true" />}
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────

function getSignal(
  rec: Recommendation,
  meta: Record<string, unknown>
): string[] | null {
  switch (rec.category) {
    case 'film':
    case 'tv': {
      const parts: string[] = []
      if (typeof meta.streaming === 'string') parts.push(meta.streaming)
      if (typeof meta.genre === 'string')     parts.push(meta.genre)
      if (typeof meta.release_year === 'number') parts.push(String(meta.release_year))
      return parts.length ? parts : null
    }
    case 'music': {
      const parts: string[] = []
      if (typeof meta.artist === 'string')       parts.push(meta.artist)
      if (typeof meta.listen_count === 'number' && meta.listen_count > 0) {
        parts.push(`Listened ${meta.listen_count}×`)
      }
      return parts.length ? parts : null
    }
    case 'book': {
      const parts: string[] = []
      if (typeof meta.author === 'string') parts.push(meta.author)
      if (typeof meta.genre  === 'string') parts.push(meta.genre)
      return parts.length ? parts : null
    }
    case 'city': {
      const parts: string[] = []
      if (rec.location?.country) parts.push(rec.location.country)
      if (typeof meta.type === 'string') parts.push(meta.type)
      return parts.length ? parts : null
    }
    case 'podcast':
      return typeof meta.topic === 'string' ? [meta.topic] : null
    case 'person': {
      const parts: string[] = []
      if (typeof meta.platform  === 'string') parts.push(meta.platform)
      if (typeof meta.specialty === 'string') parts.push(meta.specialty)
      return parts.length ? parts : null
    }
    default:
      return null
  }
}

function getSplitSignals(
  rec: Recommendation,
  meta: Record<string, unknown>
): string[] {
  const neighbourhood = typeof meta.neighbourhood === 'string' ? meta.neighbourhood : null
  const city          = rec.location?.city ?? null
  const place         = neighbourhood ?? city

  switch (rec.category) {
    case 'restaurant':
      return [place, typeof meta.cuisine === 'string' ? meta.cuisine : null]
        .filter((s): s is string => s !== null)
    case 'bar':
      return [place, typeof meta.type === 'string' ? meta.type : null]
        .filter((s): s is string => s !== null)
    case 'activity':
      return [place ?? (typeof meta.location === 'string' ? meta.location : null),
              typeof meta.type === 'string' ? meta.type : null]
        .filter((s): s is string => s !== null)
    default:
      return []
  }
}

// Image gradients per category — each references a WKW film's dominant palette
function getImageGradient(category: string): { bg: string; atm: string } {
  const gradients: Record<string, { bg: string; atm: string }> = {
    film:     {
      bg:  'linear-gradient(148deg, #05101e 0%, #0e1e48 36%, #050818 68%, #100408 100%)',
      atm: 'radial-gradient(ellipse at 10% 90%, rgba(200,21,30,0.18) 0%, transparent 50%)',
    },
    music:    {
      bg:  'linear-gradient(148deg, #0e0418 0%, #300848 36%, #0c0214 100%)',
      atm: 'radial-gradient(ellipse at 90% 10%, rgba(154,21,114,0.22) 0%, transparent 52%)',
    },
    book:     {
      bg:  'linear-gradient(148deg, #120802 0%, #2a1608 36%, #0e0604 100%)',
      atm: 'radial-gradient(ellipse at 50% 0%, rgba(184,120,32,0.20) 0%, transparent 55%)',
    },
    tv:       {
      bg:  'linear-gradient(148deg, #020a14 0%, #0a1e30 36%, #020810 100%)',
      atm: 'radial-gradient(ellipse at 90% 90%, rgba(21,90,138,0.22) 0%, transparent 52%)',
    },
    city:     {
      bg:  'linear-gradient(148deg, #020e08 0%, #083020 36%, #020e08 100%)',
      atm: 'radial-gradient(ellipse at 50% 50%, rgba(31,206,148,0.14) 0%, transparent 55%)',
    },
    podcast:  {
      bg:  'linear-gradient(148deg, #050214 0%, #12063a 36%, #040110 100%)',
      atm: 'radial-gradient(ellipse at 10% 0%, rgba(51,21,200,0.22) 0%, transparent 52%)',
    },
    person:   {
      bg:  'linear-gradient(148deg, #100502 0%, #2a0e06 36%, #0e0402 100%)',
      atm: 'radial-gradient(ellipse at 90% 10%, rgba(200,69,21,0.22) 0%, transparent 52%)',
    },
  }
  return gradients[category] ?? gradients.film
}
