'use client'

// components/features/cards/recommendation-card.tsx
//
// Card redesign — fixing the hollow feeling:
// Problem: image zone too tall relative to thin content below.
// Fix: content zone has more internal air and weight.
//   - Title: 22px → larger, more confident
//   - Source: 13px 600 weight → earns its prominence
//   - More padding in the body (18px vs 11px top)
//   - Card border slightly warmer (category colour tint)
//   - Split card: more vertical padding, larger title
//   - Save animation: neon border flash on entry

import { getCategoryConfig, isPhysicalCategory } from '@/constants/categories'
import type { Recommendation } from '@/lib/types'

type CardProps = {
  recommendation: Recommendation
  isHero?:        boolean
  onClick?:       () => void
}

// Neon border flash on card entry — the "something precious arrived" moment
const CARD_STYLE = `
  @keyframes cardEnter {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes newCardGlow {
    0%   { box-shadow: 0 0 0 1.5px rgba(31,206,148,0.70), 0 4px 24px rgba(0,0,0,0.50); }
    60%  { box-shadow: 0 0 0 1.5px rgba(31,206,148,0.20), 0 4px 24px rgba(0,0,0,0.50); }
    100% { box-shadow: 0 0 0 0px  rgba(31,206,148,0.00), 0 4px 24px rgba(0,0,0,0.50); }
  }
  @keyframes shimmer {
    0%,100% { opacity: 0.75; }
    50%     { opacity: 0.90; }
  }
`

export function RecommendationCard({ recommendation, isHero = false, onClick }: CardProps) {
  if (isPhysicalCategory(recommendation.category)) {
    return (
      <>
        <style>{CARD_STYLE}</style>
        <SplitCard recommendation={recommendation} onClick={onClick} />
      </>
    )
  }
  return (
    <>
      <style>{CARD_STYLE}</style>
      <PosterCard recommendation={recommendation} isHero={isHero} onClick={onClick} />
    </>
  )
}

// ── POSTER CARD ───────────────────────────────────────────────────

function PosterCard({ recommendation: rec, isHero, onClick }: CardProps) {
  const config   = getCategoryConfig(rec.category)
  const metadata = (rec.metadata ?? {}) as Record<string, unknown>
  const signal   = getSignal(rec, metadata)
  const gradient = GRADIENTS[rec.category] ?? GRADIENTS.film
  const isTemp   = rec.id.startsWith('temp-')
  const isNew    = isTemp === false && (() => {
    const age = Date.now() - new Date(rec.created_at).getTime()
    return age < 8000 // within 8 seconds of creation = new card
  })()

  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e => { if (e.key === 'Enter') onClick() }) : undefined}
      aria-label={`${rec.title}, from ${rec.source_name}`}
      style={{
        background:              '#142014',
        borderRadius:            '18px',
        // Border: subtle category colour tint — removes the "floating in void" feeling
        border:                  `1px solid ${config.colourHex}22`,
        overflow:                'hidden',
        cursor:                  onClick ? 'pointer' : 'default',
        opacity:                 isTemp ? 0.80 : 1,
        // New card: neon border flash, then settles to category tint
        // Temp card: breathes while syncing
        animation:               isTemp
          ? 'shimmer 1.8s ease-in-out infinite'
          : isNew
          ? 'cardEnter 320ms cubic-bezier(0.16,1,0.3,1), newCardGlow 1400ms ease-out 50ms forwards'
          : 'cardEnter 320ms cubic-bezier(0.16,1,0.3,1)',
        boxShadow:               '0 4px 28px rgba(0,0,0,0.55)',
        WebkitTapHighlightColor: 'transparent',
        transition:              'transform 180ms ease',
      }}
    >
      {/* Image */}
      <div style={{
        width:    '100%',
        // Hero: taller. Standard: compact. The content zone will feel balanced.
        height:   isHero ? '190px' : '152px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: gradient.base }} />
        <div style={{ position: 'absolute', inset: 0, background: gradient.atm, pointerEvents: 'none' }} />

        {rec.image_url && !isTemp && (
          <img src={rec.image_url} alt="" aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {/* Category badge */}
        <div style={{
          position:             'absolute', top: '12px', left: '13px',
          background:           config.badgeBg,
          border:               `0.5px solid ${config.badgeBorder}`,
          borderRadius:         '6px', padding: '3px 10px',
          fontFamily:           'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:             '9px', fontWeight: 700,
          letterSpacing:        '0.08em', textTransform: 'uppercase' as const,
          color:                'rgba(240,230,200,0.95)',
          backdropFilter:       'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          {config.shortLabel}
        </div>

        {/* Reaction indicator on the card — if experienced */}
        {rec.reaction && (
          <div style={{
            position: 'absolute', top: '12px', right: '13px',
            fontSize: '16px', lineHeight: 1,
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.60))',
          }} aria-label={`Reaction: ${rec.reaction}`}>
            {REACTION_EMOJI[rec.reaction]}
          </div>
        )}

        <div style={{
          position:   'absolute', bottom: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(to bottom, transparent, #142014)',
        }} />
      </div>

      {/* Content — more breathing room than before */}
      <div style={{ padding: '14px 18px 20px' }}>

        <h3 style={{
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '22px', fontWeight: 700,
          letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.95)',
          lineHeight:    1.1, marginBottom: '7px',
        }}>
          {rec.title}
        </h3>

        {/* Source — the soul of Taareef. 13px, 600 weight, crimson. */}
        <span style={{
          fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:     '13px', fontWeight: 600,
          color:        '#c8151e',
          display:      'block', marginBottom: '9px',
          letterSpacing:'0.01em',
        }}>
          From {rec.source_name}
        </span>

        {signal && (
          <div style={{
            display:    'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:   '11px', color: 'rgba(240,230,200,0.42)',
          }}>
            {signal.map((part, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && <span style={{
                  display: 'inline-block', width: '2px', height: '2px',
                  borderRadius: '50%', background: 'rgba(240,230,200,0.30)',
                }} aria-hidden="true" />}
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
        borderRadius:            '18px',
        border:                  `1px solid ${config.colourHex}22`,
        overflow:                'hidden',
        boxShadow:               '0 4px 28px rgba(0,0,0,0.55)',
        display:                 'flex',
        cursor:                  onClick ? 'pointer' : 'default',
        opacity:                 isTemp ? 0.80 : 1,
        animation:               'cardEnter 320ms cubic-bezier(0.16,1,0.3,1)',
        WebkitTapHighlightColor: 'transparent',
        transition:              'transform 180ms ease',
      }}
    >
      {/* Colour accent bar */}
      <div style={{
        width:      '3.5px', flexShrink: 0,
        background: `linear-gradient(to bottom, ${config.colourHex} 0%, ${config.colourHex}20 100%)`,
      }} />

      <div style={{ flex: 1, padding: '17px 18px', minWidth: 0 }}>

        <div style={{
          display:       'inline-flex', alignItems: 'center', gap: '4px',
          padding:       '3px 9px', borderRadius: '6px',
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '9px', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          color:         config.colourHex,
          background:    `${config.colourHex}18`,
          border:        `0.5px solid ${config.colourHex}30`,
          marginBottom:  '10px',
        }}>
          {config.label}
        </div>

        <h3 style={{
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '21px', fontWeight: 700,
          letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.95)',
          lineHeight:    1.1, marginBottom: '7px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {rec.title}
        </h3>

        <span style={{
          fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:     '13px', fontWeight: 600,
          color:        '#c8151e',
          display:      'block', marginBottom: '7px',
        }}>
          From {rec.source_name}
        </span>

        {signals.length > 0 && (
          <div style={{
            display:    'flex', alignItems: 'center', gap: '5px',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:   '11px', color: 'rgba(240,230,200,0.42)',
          }}>
            {signals.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && <span style={{
                  display: 'inline-block', width: '2px', height: '2px',
                  borderRadius: '50%', background: 'rgba(240,230,200,0.30)',
                }} aria-hidden="true" />}
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Reaction indicator */}
        {rec.reaction && (
          <div style={{ marginTop: '8px', fontSize: '15px' }}>
            {REACTION_EMOJI[rec.reaction]}
          </div>
        )}
      </div>
    </article>
  )
}

// ── CONSTANTS ─────────────────────────────────────────────────────

const REACTION_EMOJI: Record<string, string> = {
  loved: '😍', good: '👍', okay: '😐', skip: '👎',
}

// ── SIGNAL HELPERS ────────────────────────────────────────────────

function getSignal(rec: Recommendation, meta: Record<string, unknown>): string[] | null {
  switch (rec.category) {
    case 'film': case 'tv': {
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
      if (rec.location?.country)           p.push(rec.location.country)
      if (typeof meta.type === 'string')   p.push(meta.type)
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
  const city          = rec.location?.city ?? null
  const place         = neighbourhood ?? city
  switch (rec.category) {
    case 'restaurant': return [place, typeof meta.cuisine === 'string' ? meta.cuisine : null].filter((s): s is string => s !== null)
    case 'bar':        return [place, typeof meta.type    === 'string' ? meta.type    : null].filter((s): s is string => s !== null)
    case 'activity':   return [place ?? (typeof meta.location === 'string' ? meta.location : null), typeof meta.type === 'string' ? meta.type : null].filter((s): s is string => s !== null)
    default: return []
  }
}

const GRADIENTS: Record<string, { base: string; atm: string }> = {
  film:    { base: 'linear-gradient(148deg,#05101e 0%,#0e1e48 36%,#050818 68%,#100408 100%)', atm: 'radial-gradient(ellipse at 8% 92%,rgba(200,21,30,0.20) 0%,transparent 48%)' },
  music:   { base: 'linear-gradient(148deg,#0e0418 0%,#300848 36%,#0c0214 100%)',             atm: 'radial-gradient(ellipse at 92% 8%,rgba(154,21,114,0.24) 0%,transparent 50%)' },
  book:    { base: 'linear-gradient(148deg,#120802 0%,#2a1608 36%,#0e0604 100%)',             atm: 'radial-gradient(ellipse at 50% 0%,rgba(184,120,32,0.22) 0%,transparent 55%)' },
  tv:      { base: 'linear-gradient(148deg,#020a14 0%,#0a1e30 36%,#020810 100%)',             atm: 'radial-gradient(ellipse at 92% 92%,rgba(21,90,138,0.24) 0%,transparent 50%)' },
  city:    { base: 'linear-gradient(148deg,#020e08 0%,#083020 36%,#020e08 100%)',             atm: 'radial-gradient(ellipse at 50% 50%,rgba(31,206,148,0.16) 0%,transparent 55%)' },
  podcast: { base: 'linear-gradient(148deg,#050214 0%,#12063a 36%,#040110 100%)',             atm: 'radial-gradient(ellipse at 8% 0%,rgba(51,21,200,0.24) 0%,transparent 50%)' },
  person:  { base: 'linear-gradient(148deg,#100502 0%,#2a0e06 36%,#0e0402 100%)',             atm: 'radial-gradient(ellipse at 92% 8%,rgba(200,69,21,0.24) 0%,transparent 50%)' },
}
