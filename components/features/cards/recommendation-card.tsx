'use client'

// components/features/cards/recommendation-card.tsx
// Card title: Rajdhani 700, title case — not uppercase.
// Source line: DM Sans 500, signal crimson — always first thing the eye finds.
// Card image: atmospheric light leak per category, gradient fade into body.
// Poster: film, music, book, podcast, tv, city, person.
// Split:  restaurant, bar, activity.

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

// ── POSTER CARD ───────────────────────────────────────────────────

function PosterCard({ recommendation: rec, isHero, onClick }: CardProps) {
  const config   = getCategoryConfig(rec.category)
  const metadata = (rec.metadata ?? {}) as Record<string, unknown>
  const signal   = getSignal(rec, metadata)
  const gradient = GRADIENTS[rec.category] ?? GRADIENTS.film
  const isTemp   = rec.id.startsWith('temp-')

  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e => { if (e.key === 'Enter') onClick() }) : undefined}
      aria-label={`${rec.title}, from ${rec.source_name}`}
      style={{
        background:              '#142014',
        borderRadius:            '16px',
        border:                  '1px solid rgba(240,230,200,0.09)',
        overflow:                'hidden',
        boxShadow:               '0 4px 24px rgba(0,0,0,0.50)',
        cursor:                  onClick ? 'pointer' : 'default',
        // Temp card: slightly transparent, subtle shimmer signals syncing
        opacity:                 isTemp ? 0.80 : 1,
        animation:               isTemp
          ? 'shimmer 1.8s ease-in-out infinite'
          : 'cardEnter 280ms cubic-bezier(0.16,1,0.3,1)',
        transition:              'transform 180ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* ── IMAGE ZONE ───────────────────────────────── */}
      <div style={{
        width:    '100%',
        // Hero: 184px — draws the eye, dominant in the vault.
        // Standard: 148px — enough for the atmospheric gradient.
        height:   isHero ? '184px' : '148px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Base gradient — category's film palette */}
        <div style={{ position: 'absolute', inset: 0, background: gradient.base }} />

        {/* Atmospheric light leak — colour bleeds in from one corner */}
        {/* Like light through a half-open door in a WKW film */}
        <div style={{ position: 'absolute', inset: 0, background: gradient.atm, pointerEvents: 'none' }} />

        {/* Real image — if available */}
        {rec.image_url && !isTemp && (
          <img
            src={rec.image_url}
            alt=""
            aria-hidden="true"
            style={{
              position:   'absolute',
              inset:      0,
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
            }}
          />
        )}

        {/* Category badge — top-left, blurred background */}
        <div style={{
          position:        'absolute',
          top:             '12px',
          left:            '13px',
          background:      config.badgeBg,
          border:          `0.5px solid ${config.badgeBorder}`,
          borderRadius:    '6px',
          padding:         '3px 10px',
          fontFamily:      'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:        '9px',
          fontWeight:      700,
          letterSpacing:   '0.08em',
          textTransform:   'uppercase',
          color:           'rgba(240,230,200,0.95)',
          backdropFilter:  'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>
          {config.shortLabel}
        </div>

        {/* Gradient fade: image bleeds into card body */}
        {/* Stops at the card bg colour so there's no hard edge */}
        <div style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          height:     '80px',
          background: 'linear-gradient(to bottom, transparent, #142014)',
        }} aria-hidden="true" />
      </div>

      {/* ── CARD BODY ────────────────────────────────── */}
      <div style={{ padding: '11px 16px 17px' }}>

        {/*
          TITLE: Rajdhani 700, title case.
          Title case reads as a proper name — which it is.
          Uppercase felt aggressive; title case feels considered.
        */}
        <h3 style={{
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '21px',
          fontWeight:    700,
          letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.95)',
          lineHeight:    1.1,
          marginBottom:  '6px',
        }}>
          {rec.title}
        </h3>

        {/*
          SOURCE: always crimson, always present, always first.
          8px bottom margin — enough room to breathe before metadata.
          This is the line that makes Taareef what it is.
        */}
        <span style={{
          fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:     '12px',
          fontWeight:   500,
          color:        '#c8151e',
          display:      'block',
          marginBottom: '8px',
        }}>
          From {rec.source_name}
        </span>

        {/* Meta — category-specific signal */}
        {signal && (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            flexWrap:   'wrap',
            gap:        '5px',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:   '11px',
            color:      'rgba(240,230,200,0.45)',
          }}>
            {signal.map((part, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      display:      'inline-block',
                      width:        '2px',
                      height:       '2px',
                      borderRadius: '50%',
                      background:   'rgba(240,230,200,0.35)',
                    }}
                  />
                )}
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
      onKeyDown={onClick ? (e => { if (e.key === 'Enter') onClick() }) : undefined}
      aria-label={`${rec.title}, from ${rec.source_name}`}
      style={{
        background:              '#142014',
        borderRadius:            '16px',
        border:                  '1px solid rgba(240,230,200,0.09)',
        overflow:                'hidden',
        boxShadow:               '0 4px 24px rgba(0,0,0,0.50)',
        display:                 'flex',
        cursor:                  onClick ? 'pointer' : 'default',
        opacity:                 isTemp ? 0.80 : 1,
        animation:               'cardEnter 280ms cubic-bezier(0.16,1,0.3,1)',
        transition:              'transform 180ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Category colour left bar — gradient from solid to transparent */}
      <div style={{
        width:      '3px',
        flexShrink: 0,
        background: `linear-gradient(to bottom, ${config.colourHex} 0%, ${config.colourHex}1a 100%)`,
      }} aria-hidden="true" />

      <div style={{ flex: 1, padding: '15px 16px', minWidth: 0 }}>

        {/* Category badge */}
        <div style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '4px',
          padding:       '3px 9px',
          borderRadius:  '6px',
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '9px',
          fontWeight:    700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color:         config.colourHex,
          background:    `${config.colourHex}18`,
          border:        `0.5px solid ${config.colourHex}30`,
          marginBottom:  '9px',
        }}>
          {config.label}
        </div>

        <h3 style={{
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '20px',
          fontWeight:    700,
          letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.95)',
          lineHeight:    1.1,
          marginBottom:  '6px',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}>
          {rec.title}
        </h3>

        <span style={{
          fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:     '12px',
          fontWeight:   500,
          color:        '#c8151e',
          display:      'block',
          marginBottom: '6px',
        }}>
          From {rec.source_name}
        </span>

        {signals.length > 0 && (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '5px',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:   '11px',
            color:      'rgba(240,230,200,0.45)',
          }}>
            {signals.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      display:      'inline-block',
                      width:        '2px',
                      height:       '2px',
                      borderRadius: '50%',
                      background:   'rgba(240,230,200,0.35)',
                    }}
                  />
                )}
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

// ── SIGNAL HELPERS ────────────────────────────────────────────────

function getSignal(rec: Recommendation, meta: Record<string, unknown>): string[] | null {
  switch (rec.category) {
    case 'film':
    case 'tv': {
      const p: string[] = []
      if (typeof meta.streaming    === 'string') p.push(meta.streaming)
      if (typeof meta.genre        === 'string') p.push(meta.genre)
      if (typeof meta.release_year === 'number') p.push(String(meta.release_year))
      return p.length ? p : null
    }
    case 'music': {
      const p: string[] = []
      if (typeof meta.artist       === 'string') p.push(meta.artist)
      if (typeof meta.listen_count === 'number' && meta.listen_count > 0) p.push(`${meta.listen_count}×`)
      return p.length ? p : null
    }
    case 'book': {
      const p: string[] = []
      if (typeof meta.author === 'string') p.push(meta.author)
      if (typeof meta.genre  === 'string') p.push(meta.genre)
      return p.length ? p : null
    }
    case 'city': {
      const p: string[] = []
      if (rec.location?.country         ) p.push(rec.location.country)
      if (typeof meta.type === 'string' ) p.push(meta.type)
      return p.length ? p : null
    }
    case 'podcast':
      return typeof meta.topic === 'string' ? [meta.topic] : null
    case 'person': {
      const p: string[] = []
      if (typeof meta.platform  === 'string') p.push(meta.platform)
      if (typeof meta.specialty === 'string') p.push(meta.specialty)
      return p.length ? p : null
    }
    default: return null
  }
}

function getSplitSignals(rec: Recommendation, meta: Record<string, unknown>): string[] {
  const neighbourhood = typeof meta.neighbourhood === 'string' ? meta.neighbourhood : null
  const city = rec.location?.city ?? null
  const place = neighbourhood ?? city

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
        typeof meta.type === 'string' ? meta.type : null
      ].filter((s): s is string => s !== null)
    default: return []
  }
}

// ── IMAGE GRADIENTS ───────────────────────────────────────────────
// Each category references a WKW film's dominant palette.
// The atmospheric light leak references a specific scene:
//   film    → red doorway glow, bottom-left (ITMFL stairwell)
//   music   → magenta neon bleed, top-right (Days of Being Wild)
//   book    → amber lamp, centre top (Happy Together diner)
//   tv      → steel blue, bottom-right (Fallen Angels)
//   city    → neon teal, centre (Ashes of Time)
//   podcast → deep indigo, top-left (2046)
//   person  → cinnabar, top-right

const GRADIENTS: Record<string, { base: string; atm: string }> = {
  film: {
    base: 'linear-gradient(148deg,#05101e 0%,#0e1e48 36%,#050818 68%,#100408 100%)',
    atm:  'radial-gradient(ellipse at 8% 92%,rgba(200,21,30,0.20) 0%,transparent 48%)',
  },
  music: {
    base: 'linear-gradient(148deg,#0e0418 0%,#300848 36%,#0c0214 100%)',
    atm:  'radial-gradient(ellipse at 92% 8%,rgba(154,21,114,0.24) 0%,transparent 50%)',
  },
  book: {
    base: 'linear-gradient(148deg,#120802 0%,#2a1608 36%,#0e0604 100%)',
    atm:  'radial-gradient(ellipse at 50% 0%,rgba(184,120,32,0.22) 0%,transparent 55%)',
  },
  tv: {
    base: 'linear-gradient(148deg,#020a14 0%,#0a1e30 36%,#020810 100%)',
    atm:  'radial-gradient(ellipse at 92% 92%,rgba(21,90,138,0.24) 0%,transparent 50%)',
  },
  city: {
    base: 'linear-gradient(148deg,#020e08 0%,#083020 36%,#020e08 100%)',
    atm:  'radial-gradient(ellipse at 50% 50%,rgba(31,206,148,0.16) 0%,transparent 55%)',
  },
  podcast: {
    base: 'linear-gradient(148deg,#050214 0%,#12063a 36%,#040110 100%)',
    atm:  'radial-gradient(ellipse at 8% 0%,rgba(51,21,200,0.24) 0%,transparent 50%)',
  },
  person: {
    base: 'linear-gradient(148deg,#100502 0%,#2a0e06 36%,#0e0402 100%)',
    atm:  'radial-gradient(ellipse at 92% 8%,rgba(200,69,21,0.24) 0%,transparent 50%)',
  },
}
