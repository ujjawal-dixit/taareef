'use client'

// components/features/cards/recommendation-card.tsx
//
// WKW LIGHT PHILOSOPHY:
// Every poster card has an internal light source.
// Not a gradient overlay — a light source in a specific corner,
// in the category's dominant colour.
// Like light through a half-open door in Chungking Express.
// The light bleeds behind the image when present, 
// and IS the image when not.
//
// IMAGE HANDLING:
// When image_url exists: show the real image.
// When not: show the atmospheric gradient as the visual.
// Neither state looks broken — both look intentional.
//
// CARD PROPORTIONS:
// Hero card: 220px image. The room's statement piece.
// Standard card: 160px image. Considered, not thin.
// Body: generous padding. Source line has space to breathe.
// The card feels held, not cramped.

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
// Film, book, TV, music, city.
// Image-led. Light source in category colour.

function PosterCard({ recommendation: rec, isHero, onClick }: CardProps) {
  const config   = getCategoryConfig(rec.category)
  const metadata = (rec.metadata ?? {}) as Record<string, unknown>
  const signal   = getSignal(rec, metadata)
  const light    = LIGHTS[rec.category] ?? LIGHTS.film
  const isTemp   = rec.id.startsWith('temp-')

  const imageHeight = isHero ? '220px' : '160px'

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
        boxShadow:               `0 4px 32px rgba(0,0,0,0.60), 0 0 0 0 ${config.colourHex}00`,
        WebkitTapHighlightColor: 'transparent',
        transition:              'transform 160ms ease',
      }}
    >
      {/* ── IMAGE ZONE ───────────────────────────────────────── */}
      {/* This is where WKW's light lives.                       */}
      {/* When there's a real image: the light is the atmosphere */}
      {/* behind and around it.                                  */}
      {/* When there's no image: the light IS the image.        */}
      <div style={{
        width:    '100%',
        height:   imageHeight,
        position: 'relative',
        overflow: 'hidden',
        // Base: near-black canvas. The image or light lives above this.
        background: light.base,
      }}>

        {/* Light source — always present, behind the image */}
        {/* WKW's light comes from a specific place in the frame */}
        <div
          aria-hidden="true"
          style={{
            position:   'absolute',
            inset:      0,
            background: light.source,
            mixBlendMode: rec.image_url ? 'screen' : 'normal',
            opacity:    rec.image_url ? 0.35 : 1,
            transition: 'opacity 400ms ease',
          }}
        />

        {/* Secondary atmospheric fill — the halo */}
        {!rec.image_url && (
          <div
            aria-hidden="true"
            style={{
              position:   'absolute',
              inset:      0,
              background: light.halo,
            }}
          />
        )}

        {/* Real image — rendered above the light */}
        {rec.image_url && (
          <img
            src={rec.image_url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            style={{
              position:   'absolute',
              inset:      0,
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              // Slight vignette to let badge sit clearly above image
              maskImage:  'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0.80) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0.80) 100%)',
            }}
          />
        )}

        {/* Category badge — top left */}
        <div style={{
          position:             'absolute',
          top:                  '13px',
          left:                 '14px',
          background:           config.badgeBg,
          border:               `0.5px solid ${config.badgeBorder}`,
          borderRadius:         '6px',
          padding:              '3px 10px',
          fontFamily:           'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:             '9px',
          fontWeight:           700,
          letterSpacing:        '0.08em',
          textTransform:        'uppercase',
          color:                'rgba(240,230,200,0.96)',
          backdropFilter:       'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          {config.label}
        </div>

        {/* Reaction — top right, if reacted */}
        {rec.reaction && (
          <div style={{
            position:   'absolute',
            top:        '13px',
            right:      '14px',
            fontSize:   '18px',
            filter:     'drop-shadow(0 1px 4px rgba(0,0,0,0.70))',
          }}>
            {REACTION_EMOJI[rec.reaction]}
          </div>
        )}

        {/* Bottom fade — image dissolves into card body */}
        {/* Essential: prevents hard edge between image and text */}
        <div
          aria-hidden="true"
          style={{
            position:   'absolute',
            bottom:     0,
            left:       0,
            right:      0,
            height:     '60%',
            background: 'linear-gradient(to bottom, transparent 0%, #0d1910 100%)',
          }}
        />
      </div>

      {/* ── CARD BODY ────────────────────────────────────────── */}
      {/* More generous than before. Source has room to breathe. */}
      <div style={{ padding: '14px 18px 20px' }}>

        {/* Title */}
        <h3 style={{
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '22px',
          fontWeight:    700,
          letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.96)',
          lineHeight:    1.1,
          marginBottom:  '7px',
        }}>
          {rec.title}
        </h3>

        {/* Source — the soul. 13px 600 crimson. Always first to read after title. */}
        <span style={{
          fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:      '13px',
          fontWeight:    600,
          color:         '#c8151e',
          display:       'block',
          marginBottom:  '9px',
          letterSpacing: '0.01em',
        }}>
          From {rec.source_name}
        </span>

        {/* Signal metadata — dim, subordinate */}
        {signal && signal.length > 0 && (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            flexWrap:   'wrap',
            gap:        '5px',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:   '11px',
            color:      'rgba(240,230,200,0.38)',
          }}>
            {signal.map((part, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && (
                  <span aria-hidden="true" style={{
                    display:      'inline-block',
                    width:        '2px',
                    height:       '2px',
                    borderRadius: '50%',
                    background:   'rgba(240,230,200,0.25)',
                  }} />
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

// ── SPLIT CARD ─────────────────────────────────────────────────────
// Food, Clubs, Go & Do.
// Text-led. The colour bar is the light source.
// More vertical padding than before — the card needs to feel held.

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
      {/* Left colour bar — gradient from strong to transparent */}
      {/* This is the split card's light source: a glow on the left edge */}
      <div
        aria-hidden="true"
        style={{
          width:      '4px',
          flexShrink: 0,
          background: `linear-gradient(
            to bottom,
            ${config.colourHex}   0%,
            ${config.colourHex}80 40%,
            ${config.colourHex}10 100%
          )`,
          boxShadow:  `2px 0 12px ${config.colourHex}30`,
        }}
      />

      {/* Body — generous padding */}
      <div style={{ flex: 1, padding: '18px 18px 20px', minWidth: 0 }}>

        {/* Badge */}
        <div style={{
          display:       'inline-flex',
          alignItems:    'center',
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
          marginBottom:  '10px',
        }}>
          {config.label}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '21px',
          fontWeight:    700,
          letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.96)',
          lineHeight:    1.1,
          marginBottom:  '7px',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}>
          {rec.title}
        </h3>

        {/* Source */}
        <span style={{
          fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:     '13px',
          fontWeight:   600,
          color:        '#c8151e',
          display:      'block',
          marginBottom: signals.length ? '7px' : '0',
        }}>
          From {rec.source_name}
        </span>

        {/* Signals */}
        {signals.length > 0 && (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '5px',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:   '11px',
            color:      'rgba(240,230,200,0.38)',
          }}>
            {signals.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && (
                  <span aria-hidden="true" style={{
                    display: 'inline-block', width: '2px', height: '2px',
                    borderRadius: '50%', background: 'rgba(240,230,200,0.25)',
                  }} />
                )}
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Reaction */}
        {rec.reaction && (
          <div style={{ marginTop: '8px', fontSize: '16px' }}>
            {REACTION_EMOJI[rec.reaction]}
          </div>
        )}
      </div>
    </article>
  )
}

// ── WKW LIGHT SOURCES ──────────────────────────────────────────────
// Each category has a base (the dark canvas) and a light source
// (the radial from a specific corner in the dominant colour).
// When a real image loads, the light blends behind it via screen mode.
// When no image: the light IS the card's atmosphere.

const LIGHTS: Record<string, {
  base:   string  // near-black canvas, slightly tinted toward category
  source: string  // the primary light — where it comes from
  halo:   string  // secondary atmospheric fill
}> = {
  film: {
    // Chungking Express: the blue of Hong Kong night, red light from the stall
    base:   '#030a18',
    source: 'radial-gradient(ellipse at 8% 88%, rgba(200,21,30,0.55) 0%, transparent 50%)',
    halo:   'radial-gradient(ellipse at 85% 15%, rgba(26,82,200,0.22) 0%, transparent 60%)',
  },
  book: {
    // Happy Together: Buenos Aires amber lamp on a dark table
    base:   '#100a02',
    source: 'radial-gradient(ellipse at 15% 20%, rgba(184,120,32,0.60) 0%, transparent 55%)',
    halo:   'radial-gradient(ellipse at 80% 80%, rgba(184,120,32,0.12) 0%, transparent 60%)',
  },
  tv: {
    // Fallen Angels: the steel-blue glow of a screen in darkness
    base:   '#020810',
    source: 'radial-gradient(ellipse at 90% 85%, rgba(21,90,138,0.55) 0%, transparent 52%)',
    halo:   'radial-gradient(ellipse at 10% 10%, rgba(21,90,138,0.18) 0%, transparent 60%)',
  },
  music: {
    // Days of Being Wild: deep magenta, smoky room, single lamp
    base:   '#0c0210',
    source: 'radial-gradient(ellipse at 85% 12%, rgba(154,21,114,0.62) 0%, transparent 50%)',
    halo:   'radial-gradient(ellipse at 15% 85%, rgba(154,21,114,0.18) 0%, transparent 60%)',
  },
  city: {
    // Ashes of Time: the neon of the desert, the teal of dawn
    base:   '#010e08',
    source: 'radial-gradient(ellipse at 50% 0%, rgba(31,206,148,0.40) 0%, transparent 55%)',
    halo:   'radial-gradient(ellipse at 50% 100%, rgba(31,206,148,0.12) 0%, transparent 60%)',
  },
  // Fallback for any unlisted category
  default: {
    base:   '#080f0a',
    source: 'radial-gradient(ellipse at 50% 50%, rgba(31,206,148,0.15) 0%, transparent 60%)',
    halo:   'transparent',
  },
}

// ── SIGNAL HELPERS ────────────────────────────────────────────────

const REACTION_EMOJI: Record<string, string> = {
  loved: '😍', good: '👍', okay: '😐', skip: '👎',
}

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
      if (rec.location?.country) p.push(rec.location.country)
      if (typeof meta.type === 'string') p.push(meta.type)
      return p
    }
    case 'podcast':
      return typeof meta.topic === 'string' ? [meta.topic] : []
    case 'person': {
      const p: string[] = []
      if (typeof meta.platform  === 'string') p.push(meta.platform)
      if (typeof meta.specialty === 'string') p.push(meta.specialty)
      return p
    }
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
