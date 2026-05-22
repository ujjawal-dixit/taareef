'use client'

// components/features/cards/recommendation-card.tsx
// 8 categories. No podcast or person cases — removed from Category type.
// WKW light sources: each category has a base canvas and a directional light.
// Poster cards: film, book, tv, music, city.
// Split cards:  restaurant, bar, activity.

import { getCategoryConfig, isPhysicalCategory } from '@/constants/categories'
import type { Recommendation } from '@/lib/types'

type CardProps = {
  recommendation: Recommendation
  isHero?:        boolean
  onClick?:       () => void
}

export function RecommendationCard({ recommendation, isHero = false, onClick }: CardProps) {
  if (isPhysicalCategory(recommendation.category)) {
    return <SplitCard recommendation={recommendation} onClick={onClick} />
  }
  return <PosterCard recommendation={recommendation} isHero={isHero} onClick={onClick} />
}

// ── POSTER CARD ────────────────────────────────────────────────────

function PosterCard({ recommendation: rec, isHero, onClick }: CardProps) {
  const config   = getCategoryConfig(rec.category)
  const metadata = (rec.metadata ?? {}) as Record<string, unknown>
  const signal   = getSignal(rec, metadata)
  const light    = LIGHTS[rec.category] ?? LIGHTS.film
  const isTemp   = rec.id.startsWith('temp-')

  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter') onClick() } : undefined}
      aria-label={`${rec.title}, from ${rec.source_name}`}
      style={{
        background:              '#0d1910',
        borderRadius:            '18px',
        border:                  `1px solid ${config.colourHex}20`,
        overflow:                'hidden',
        cursor:                  onClick ? 'pointer' : 'default',
        opacity:                 isTemp ? 0.80 : 1,
        animation:               isTemp
          ? 'shimmer 1.8s ease-in-out infinite'
          : 'cardEnter 300ms cubic-bezier(0.16,1,0.3,1)',
        boxShadow:               '0 4px 32px rgba(0,0,0,0.60)',
        WebkitTapHighlightColor: 'transparent',
        transition:              'transform 160ms ease',
      }}
    >
      {/* Image zone — WKW light source */}
      <div style={{
        width:    '100%',
        height:   isHero ? '220px' : '160px',
        position: 'relative',
        overflow: 'hidden',
        background: light.base,
      }}>
        {/* Light source — directional, category-specific */}
        <div aria-hidden="true" style={{
          position:   'absolute', inset: 0,
          background: light.source,
          mixBlendMode: rec.image_url ? 'screen' : 'normal',
          opacity:    rec.image_url ? 0.35 : 1,
        }} />

        {/* Halo when no image */}
        {!rec.image_url && (
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0,
            background: light.halo,
          }} />
        )}

        {/* Real image */}
        {rec.image_url && (
          <img
            src={rec.image_url} alt="" aria-hidden="true" loading="lazy"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        )}

        {/* Category badge */}
        <div style={{
          position:             'absolute', top: '13px', left: '14px',
          background:           config.badgeBg,
          border:               `0.5px solid ${config.badgeBorder}`,
          borderRadius:         '6px', padding: '3px 10px',
          fontFamily:           'var(--f-ui)',
          fontSize:             '9px', fontWeight: 700,
          letterSpacing:        '0.08em', textTransform: 'uppercase',
          color:                'rgba(240,230,200,0.96)',
          backdropFilter:       'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)', zIndex: 2,
        }}>
          {config.label}
        </div>

        {/* Reaction */}
        {rec.reaction && (
          <div style={{
            position: 'absolute', top: '13px', right: '14px',
            fontSize: '18px',
            filter:   'drop-shadow(0 1px 4px rgba(0,0,0,0.70))',
          }}>
            {REACTION_EMOJI[rec.reaction]}
          </div>
        )}

        {/* Fade into card body */}
        <div aria-hidden="true" style={{
          position:   'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(to bottom, transparent 0%, #0d1910 100%)',
        }} />
      </div>

      {/* Body */}
      <div style={{ padding: isHero ? '16px 18px 22px' : '14px 18px 20px' }}>
        <h3 style={{
          fontFamily:    'var(--f-ui)',
          fontSize:      '22px', fontWeight: 700, letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.96)',
          lineHeight:    1.1, marginBottom: '7px',
        }}>
          {rec.title}
        </h3>

        <span style={{
          fontFamily:    'var(--f-body)',
          fontSize:      '13px', fontWeight: 600,
          color:         '#c8151e', display: 'block',
          marginBottom:  '9px', letterSpacing: '0.01em',
        }}>
          From {rec.source_name}
        </span>

        {signal.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px',
            fontFamily: 'var(--f-body)',
            fontSize: '11px', color: 'rgba(240,230,200,0.38)',
          }}>
            {signal.map((part, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && <span aria-hidden="true" style={{ display: 'inline-block', width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(240,230,200,0.25)' }} />}
                {part}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

// ── SPLIT CARD ─────────────────────────────────────────────────────

function SplitCard({ recommendation: rec, onClick }: CardProps) {
  const config   = getCategoryConfig(rec.category)
  const metadata = (rec.metadata ?? {}) as Record<string, unknown>
  const signals  = getSplitSignals(rec, metadata)
  const isTemp   = rec.id.startsWith('temp-')

  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter') onClick() } : undefined}
      aria-label={`${rec.title}, from ${rec.source_name}`}
      style={{
        background:              '#0d1910',
        borderRadius:            '18px',
        border:                  `1px solid ${config.colourHex}20`,
        overflow:                'hidden',
        boxShadow:               '0 4px 32px rgba(0,0,0,0.60)',
        display:                 'flex',
        cursor:                  onClick ? 'pointer' : 'default',
        opacity:                 isTemp ? 0.80 : 1,
        animation:               'cardEnter 300ms cubic-bezier(0.16,1,0.3,1)',
        WebkitTapHighlightColor: 'transparent',
        transition:              'transform 160ms ease',
      }}
    >
      {/* Left colour bar */}
      <div aria-hidden="true" style={{
        width: '4px', flexShrink: 0,
        background: `linear-gradient(to bottom, ${config.colourHex} 0%, ${config.colourHex}80 40%, ${config.colourHex}10 100%)`,
        boxShadow:  `2px 0 12px ${config.colourHex}30`,
      }} />

      <div style={{ flex: 1, padding: '18px 18px 20px', minWidth: 0 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 9px', borderRadius: '6px',
          fontFamily:    'var(--f-ui)',
          fontSize:      '9px', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color:         config.colourHex,
          background:    `${config.colourHex}18`,
          border:        `0.5px solid ${config.colourHex}30`,
          marginBottom:  '10px',
        }}>
          {config.label}
        </div>

        <h3 style={{
          fontFamily:    'var(--f-ui)',
          fontSize:      '21px', fontWeight: 700, letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.96)',
          lineHeight:    1.1, marginBottom: '7px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {rec.title}
        </h3>

        <span style={{
          fontFamily:   'var(--f-body)',
          fontSize:     '13px', fontWeight: 600, color: '#c8151e',
          display:      'block', marginBottom: signals.length ? '7px' : '0',
        }}>
          From {rec.source_name}
        </span>

        {signals.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: 'var(--f-body)',
            fontSize: '11px', color: 'rgba(240,230,200,0.38)',
          }}>
            {signals.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && <span aria-hidden="true" style={{ display: 'inline-block', width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(240,230,200,0.25)' }} />}
                {s}
              </span>
            ))}
          </div>
        )}

        {rec.reaction && (
          <div style={{ marginTop: '8px', fontSize: '16px' }}>
            {REACTION_EMOJI[rec.reaction]}
          </div>
        )}
      </div>
    </article>
  )
}

// ── HELPERS ────────────────────────────────────────────────────────

const REACTION_EMOJI: Record<string, string> = {
  loved: '😍', good: '👍', okay: '😐', skip: '👎',
}

// Signal metadata per category — only the 8 active ones
function getSignal(rec: Recommendation, meta: Record<string, unknown>): string[] {
  switch (rec.category) {
    case 'film':
    case 'tv': {
      const p: string[] = []
      if (typeof meta.streaming    === 'string') p.push(meta.streaming)
      if (typeof meta.genre        === 'string') p.push(meta.genre)
      if (typeof meta.release_year === 'number') p.push(String(meta.release_year))
      return p
    }
    case 'music': {
      const p: string[] = []
      if (typeof meta.artist === 'string') p.push(meta.artist)
      if (typeof meta.album  === 'string') p.push(meta.album)
      if (typeof meta.listen_count === 'number' && meta.listen_count > 0) {
        p.push(`listened ${meta.listen_count}×`)
      }
      return p
    }
    case 'book': {
      const p: string[] = []
      if (typeof meta.author === 'string') p.push(meta.author)
      if (typeof meta.genre  === 'string') p.push(meta.genre)
      return p
    }
    case 'city': {
      const p: string[] = []
      if (rec.location?.country)          p.push(rec.location.country)
      if (typeof meta.type === 'string')  p.push(meta.type)
      return p
    }
    // restaurant, bar, activity handled in SplitCard via getSplitSignals
    default: return []
  }
}

function getSplitSignals(rec: Recommendation, meta: Record<string, unknown>): string[] {
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
      return [
        place ?? (typeof meta.location === 'string' ? meta.location : null),
        typeof meta.type === 'string' ? meta.type : null,
      ].filter((s): s is string => s !== null)
    default: return []
  }
}

// WKW light sources — 8 categories only
const LIGHTS: Record<string, { base: string; source: string; halo: string }> = {
  film: {
    base:   '#030a18',
    source: 'radial-gradient(ellipse at 8% 88%, rgba(200,21,30,0.55) 0%, transparent 50%)',
    halo:   'radial-gradient(ellipse at 85% 15%, rgba(26,82,200,0.22) 0%, transparent 60%)',
  },
  book: {
    base:   '#100a02',
    source: 'radial-gradient(ellipse at 15% 20%, rgba(184,120,32,0.60) 0%, transparent 55%)',
    halo:   'radial-gradient(ellipse at 80% 80%, rgba(184,120,32,0.12) 0%, transparent 60%)',
  },
  tv: {
    base:   '#020810',
    source: 'radial-gradient(ellipse at 90% 85%, rgba(21,90,138,0.55) 0%, transparent 52%)',
    halo:   'radial-gradient(ellipse at 10% 10%, rgba(21,90,138,0.18) 0%, transparent 60%)',
  },
  music: {
    base:   '#0c0210',
    source: 'radial-gradient(ellipse at 85% 12%, rgba(154,21,114,0.62) 0%, transparent 50%)',
    halo:   'radial-gradient(ellipse at 15% 85%, rgba(154,21,114,0.18) 0%, transparent 60%)',
  },
  city: {
    base:   '#010e08',
    source: 'radial-gradient(ellipse at 50% 0%, rgba(31,206,148,0.40) 0%, transparent 55%)',
    halo:   'radial-gradient(ellipse at 50% 100%, rgba(31,206,148,0.12) 0%, transparent 60%)',
  },
  // Split card categories — LIGHTS not used for these but kept for safety
  restaurant: {
    base:   '#0e0202',
    source: 'radial-gradient(ellipse at 20% 80%, rgba(200,21,30,0.40) 0%, transparent 55%)',
    halo:   'transparent',
  },
  bar: {
    base:   '#060210',
    source: 'radial-gradient(ellipse at 80% 20%, rgba(106,21,200,0.40) 0%, transparent 55%)',
    halo:   'transparent',
  },
  activity: {
    base:   '#010e08',
    source: 'radial-gradient(ellipse at 50% 50%, rgba(21,138,106,0.30) 0%, transparent 55%)',
    halo:   'transparent',
  },
}
