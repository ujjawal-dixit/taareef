'use client'

// components/features/cards/recommendation-card.tsx
//
// Two zones. One font. Seamless color transition.
// Zone 1 (image): poster or Criterion mode (rangoli + dot grid, no icon)
// Zone 2 (info): category deepDark bg — continuous with vignette above
// Cormorant Garamond italic throughout — always, no exceptions
// Source always visible. Grain on every surface.

import Link from 'next/link'
import Image from 'next/image'
import { CATEGORY_MAP, getCardGradient, getCardVignette } from '@/constants/categories'
import { hasValidImage } from '@/lib/utils/fallback'
import type { Recommendation, Category } from '@/lib/types'

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")"

// Warli dot grid — background texture in Criterion mode
function DotGrid({ rgb }: { rgb: string }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle, rgba(${rgb},1) 1.4px, transparent 1.4px)`,
      backgroundSize: '13px 13px',
      opacity: 0.10,
    }} />
  )
}

// Warli rangoli — appears only in Criterion mode (no poster)
// Never alongside a category icon. One or the other.
function Rangoli({ rgb }: { rgb: string }) {
  const c = `rgba(${rgb},1)`
  return (
    <svg style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-54%)', zIndex: 5, pointerEvents: 'none',
      width: '152px', height: '152px',
    }} viewBox="0 0 152 152" fill="none">
      <circle cx="76" cy="76" r="72" stroke={c} strokeWidth="2" opacity="0.22"/>
      <circle cx="76" cy="76" r="58" stroke={c} strokeWidth="2" opacity="0.26"/>
      <circle cx="76" cy="76" r="44" stroke={c} strokeWidth="2.2" opacity="0.30"/>
      <circle cx="76" cy="76" r="30" stroke={c} strokeWidth="2.2" opacity="0.32"/>
      <circle cx="76" cy="76" r="17" stroke={c} strokeWidth="2" opacity="0.38"/>
      <circle cx="76" cy="76" r="6" fill={c} opacity="0.45"/>
      <line x1="76" y1="4"   x2="76" y2="30"  stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="76" y1="122" x2="76" y2="148" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="4"  y1="76"  x2="30"  y2="76" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="122" y1="76" x2="148" y2="76" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="25"  y1="25"  x2="44"  y2="44"  stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="108" y1="108" x2="127" y2="127" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="127" y1="25"  x2="108" y2="44"  stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="25"  y1="127" x2="44"  y2="108" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <circle cx="76" cy="32"  r="3.5" fill={c} opacity="0.35"/>
      <circle cx="76" cy="120" r="3.5" fill={c} opacity="0.35"/>
      <circle cx="32" cy="76"  r="3.5" fill={c} opacity="0.35"/>
      <circle cx="120" cy="76" r="3.5" fill={c} opacity="0.35"/>
    </svg>
  )
}

// Build category-specific meta line from enrichment metadata
function buildMetaLine(category: Category, meta: Record<string, unknown>): string {
  const parts: string[] = []
  switch (category) {
    case 'watch': {
      const director = typeof meta.director === 'string' ? meta.director : null
      const genre = Array.isArray(meta.genres) ? (meta.genres as string[])[0]
        : typeof meta.genres === 'string' ? meta.genres : null
      const year = meta.release_year ?? meta.year
      const runtime = meta.runtime_minutes ? `${meta.runtime_minutes} min` : null
      if (director) parts.push(director)
      if (genre) parts.push(String(genre))
      if (year) parts.push(String(year))
      if (runtime) parts.push(runtime)
      break
    }
    case 'listen': {
      const artist = typeof meta.artist === 'string' ? meta.artist : null
      const genre = typeof meta.genre === 'string' ? meta.genre : null
      const year = meta.release_year ?? meta.year
      if (artist) parts.push(artist)
      if (genre) parts.push(genre)
      if (year) parts.push(String(year))
      break
    }
    case 'read': {
      const author = typeof meta.author === 'string' ? meta.author : null
      const year = meta.year ?? meta.published_year
      if (author) parts.push(author)
      if (year) parts.push(String(year))
      break
    }
    case 'dine': {
      const cuisine = typeof meta.cuisine === 'string' ? meta.cuisine : null
      const type = typeof meta.type === 'string' ? meta.type : null
      if (cuisine) parts.push(cuisine)
      if (type) parts.push(type)
      break
    }
    case 'do': {
      const difficulty = typeof meta.difficulty === 'string' ? meta.difficulty : null
      const duration = typeof meta.duration === 'string' ? meta.duration : null
      if (difficulty) parts.push(difficulty)
      if (duration) parts.push(duration)
      break
    }
    case 'visit': {
      const venue = typeof meta.venue === 'string' ? meta.venue : null
      const dates = typeof meta.dates === 'string' ? meta.dates : null
      if (venue) parts.push(venue)
      if (dates) parts.push(dates)
      break
    }
  }
  return parts.slice(0, 3).join(' · ')
}

type Props = {
  recommendation: Recommendation
  variant?: 'full' | 'compact'
}

export function RecommendationCard({ recommendation, variant = 'full' }: Props) {
  const { id, title, category, source_name, image_url, reaction, notes, metadata } = recommendation
  const config = CATEGORY_MAP[category as Category]
  if (!config) return null

  const hasImage = hasValidImage(image_url)
  const meta = metadata as Record<string, unknown>
  const metaLine = buildMetaLine(category as Category, meta)

  if (variant === 'compact') {
    return <CompactRow rec={recommendation} config={config} metaLine={metaLine} />
  }

  return (
    <Link href={`/rec/${id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        borderRadius: '11px', overflow: 'hidden', position: 'relative',
        background: config.deepDark,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px rgba(0,0,0,0.70)',
      }}>
        {/* Grain */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '11px',
          zIndex: 30, pointerEvents: 'none',
          backgroundImage: GRAIN, backgroundSize: '200px 200px',
          opacity: 0.052, mixBlendMode: 'overlay',
        }} />

        {/* Zone 1 — Image */}
        <div style={{ width: '100%', height: '172px', position: 'relative', overflow: 'hidden' }}>
          {hasImage ? (
            <Image src={image_url!} alt={title} fill style={{ objectFit: 'cover' }} sizes="(max-width:480px) 100vw,480px"/>
          ) : (
            <>
              <div style={{ position: 'absolute', inset: 0, background: getCardGradient(category as Category) }} />
              <DotGrid rgb={config.vividRgb} />
              <Rangoli rgb={config.vividRgb} />
            </>
          )}
          {/* Vignette — dissolves to deepDark. The seamless transition. */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '70%', zIndex: 10, pointerEvents: 'none',
            background: getCardVignette(category as Category),
          }} />
          {/* Category badge */}
          <div style={{
            position: 'absolute', top: '12px', left: '12px', zIndex: 15,
            fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700,
            letterSpacing: '2.5px', textTransform: 'uppercase',
            padding: '4px 11px', borderRadius: '20px', backdropFilter: 'blur(10px)',
            background: `rgba(${config.vividRgb},0.16)`,
            border: `1px solid rgba(${config.vividRgb},0.45)`,
            color: 'rgba(255,255,255,0.94)',
          }}>
            {config.label.toUpperCase()}
          </div>
        </div>

        {/* Zone 2 — Info. Same deepDark as vignette target. */}
        <div style={{ padding: '16px 17px 17px', background: config.deepDark }}>
          {/* Title — Cormorant Garamond italic. Always. */}
          <div style={{
            fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
            fontSize: '26px', color: 'rgba(255,255,255,0.97)',
            lineHeight: 1.10, marginBottom: '5px', letterSpacing: '-0.2px',
          }}>
            {title}
          </div>
          {/* Meta — category color at 65% */}
          {metaLine && (
            <div style={{
              fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 400,
              color: `rgba(${config.vividRgb},0.65)`,
              marginBottom: notes ? '13px' : '15px',
            }}>
              {metaLine}
            </div>
          )}
          {/* Note — quoted, human voice, left border */}
          {notes && (
            <div style={{
              fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300,
              fontSize: '13.5px', color: 'rgba(255,255,255,0.90)',
              lineHeight: 1.55, marginBottom: '15px',
              paddingLeft: '11px', borderLeft: '1.5px solid rgba(255,255,255,0.18)',
            }}>
              &ldquo;{notes.length > 120 ? notes.slice(0, 120) + '…' : notes}&rdquo;
            </div>
          )}
          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '12px', borderTop: '0.5px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300,
              fontSize: '17px', color: '#1fce94',
              textShadow: '0 0 16px rgba(31,206,148,0.50)', letterSpacing: '-0.2px',
            }}>
              taareef
            </div>
            <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.60)' }}>
              from {source_name}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Compact row — for category list view
function CompactRow({ rec, config, metaLine }: {
  rec: Recommendation
  config: ReturnType<typeof CATEGORY_MAP[Category]['valueOf']>
  metaLine: string
}) {
  const hasImage = hasValidImage(rec.image_url)
  const reactionGlow: Record<string, string> = {
    loved: '#f43f5e', good: '#10b981', okay: '#f59e0b', skip: 'rgba(255,255,255,0.25)',
  }

  return (
    <Link href={`/rec/${rec.id}`} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
      textDecoration: 'none', cursor: 'pointer',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: '52px', minWidth: '52px', height: '66px',
        borderRadius: '9px', overflow: 'hidden', position: 'relative',
        background: config.deepDark,
        border: `1px solid rgba(${config.vividRgb},0.22)`,
        flexShrink: 0,
      }}>
        {hasImage ? (
          <Image src={rec.image_url!} alt={rec.title} fill style={{ objectFit: 'cover' }} sizes="52px"/>
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg,rgba(${config.vividRgb},0.80) 0%,rgba(17,17,17,0.95) 100%)` }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle,rgba(${config.vividRgb},1) 1.2px,transparent 1.2px)`, backgroundSize: '10px 10px', opacity: 0.12 }} />
          </>
        )}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize: '17px', color: 'rgba(255,255,255,0.95)',
          marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {rec.title}
        </div>
        <div style={{ fontFamily: 'var(--f-body)', fontSize: '12px', fontWeight: 500, color: '#d41020', marginBottom: '2px' }}>
          from {rec.source_name}
        </div>
        {metaLine && (
          <div style={{ fontFamily: 'var(--f-body)', fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.35)' }}>
            {metaLine}
          </div>
        )}
      </div>
      {/* Reaction dot + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {rec.reaction && (
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: reactionGlow[rec.reaction] ?? 'transparent',
            boxShadow: rec.reaction === 'loved' ? '0 0 6px rgba(244,63,94,0.60)'
              : rec.reaction === 'good' ? '0 0 6px rgba(16,185,129,0.60)' : 'none',
          }} />
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.20)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </Link>
  )
}
