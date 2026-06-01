'use client'

// components/features/cards/recommendation-card.tsx
// Session 9 — three variants:
//   full    → two-zone card (used on detail screen reference, shared artifact)
//   compact → horizontal row (Read, Dine, Do, Visit category list)
//   grid    → poster card for 2-col grid (Watch, Listen category list)
//
// Fixes this session:
//   - Note left border: rgba(vividRgb,0.35) — not plain white
//   - grid variant added for Watch/Listen poster grid
//   - Category badge stays on full/grid cards (shareable artifact needs it)
//   - Source always visible, every variant

import Link   from 'next/link'
import Image  from 'next/image'
import { CATEGORY_MAP, getCardGradient, getCardVignette, type CategoryConfig } from '@/constants/categories'
import { hasValidImage } from '@/lib/utils/fallback'
import type { Recommendation, Category } from '@/lib/types'

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")"

function DotGrid({ rgb }: { rgb: string }) {
  return (
    <div style={{
      position:        'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle, rgba(${rgb},1) 1.4px, transparent 1.4px)`,
      backgroundSize:  '13px 13px',
      opacity:         0.10,
    }} />
  )
}

function Rangoli({ rgb, small }: { rgb: string; small?: boolean }) {
  const c    = `rgba(${rgb},1)`
  const size = small ? 100 : 152
  const cx   = small ? 50 : 76
  const radii = small ? [44,35,26,18,10,4] : [72,58,44,30,17,6]

  return (
    <svg
      style={{
        position:  'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-54%)', zIndex: 5, pointerEvents: 'none',
        width: `${size}px`, height: `${size}px`,
      }}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
    >
      <circle cx={cx} cy={cx} r={radii[0]} stroke={c} strokeWidth="1.5" opacity="0.22"/>
      <circle cx={cx} cy={cx} r={radii[1]} stroke={c} strokeWidth="1.5" opacity="0.26"/>
      <circle cx={cx} cy={cx} r={radii[2]} stroke={c} strokeWidth="1.8" opacity="0.30"/>
      <circle cx={cx} cy={cx} r={radii[3]} stroke={c} strokeWidth="1.8" opacity="0.32"/>
      <circle cx={cx} cy={cx} r={radii[4]} stroke={c} strokeWidth="1.5" opacity="0.38"/>
      <circle cx={cx} cy={cx} r={radii[5]} fill={c}   opacity="0.45"/>
      {/* Cardinal spokes */}
      <line x1={cx} y1={3}        x2={cx}          y2={cx-radii[1]+4} stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.28"/>
      <line x1={cx} y1={size-3}   x2={cx}          y2={cx+radii[1]-4} stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.28"/>
      <line x1={3}  y1={cx}       x2={cx-radii[1]+4} y2={cx}          stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.28"/>
      <line x1={size-3} y1={cx}   x2={cx+radii[1]-4} y2={cx}          stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.28"/>
      {/* Petal dots at ring 3 cardinal points */}
      <circle cx={cx}      cy={cx-radii[2]} r="2.5" fill={c} opacity="0.35"/>
      <circle cx={cx}      cy={cx+radii[2]} r="2.5" fill={c} opacity="0.35"/>
      <circle cx={cx-radii[2]} cy={cx}      r="2.5" fill={c} opacity="0.35"/>
      <circle cx={cx+radii[2]} cy={cx}      r="2.5" fill={c} opacity="0.35"/>
    </svg>
  )
}

function buildMetaLine(category: Category, meta: Record<string, unknown>): string {
  const parts: string[] = []

  switch (category) {
    case 'watch': {
      const subtype  = typeof meta.subtype === 'string' ? meta.subtype : null
      const director = typeof meta.director === 'string' ? meta.director : null
      const creator  = typeof meta.created_by === 'string' ? meta.created_by : null
      const genre    = Array.isArray(meta.genres)
        ? (meta.genres as string[])[0]
        : typeof meta.genres === 'string' ? meta.genres : null
      const year    = meta.release_year ?? meta.year
      const runtime = meta.runtime_minutes ? `${meta.runtime_minutes} min` : null
      const status  = typeof meta.series_status === 'string' ? meta.series_status : null
      const seasons = meta.seasons ? `${meta.seasons} seasons` : null
      if (subtype === 'series') {
        if (creator) parts.push(creator)
        if (status)  parts.push(status)
        if (seasons) parts.push(seasons)
      } else {
        if (director) parts.push(director)
        if (genre)    parts.push(String(genre))
        if (year)     parts.push(String(year))
        if (runtime)  parts.push(runtime)
      }
      break
    }
    case 'listen': {
      const subtype = typeof meta.subtype === 'string' ? meta.subtype : null
      const artist  = typeof meta.artist === 'string' ? meta.artist : null
      const host    = typeof meta.host === 'string' ? meta.host : null
      const genre   = typeof meta.genre === 'string' ? meta.genre : null
      const year    = meta.release_year ?? meta.year
      const album   = typeof meta.album === 'string' ? meta.album : null
      if (subtype === 'podcast') {
        if (host) parts.push(host)
      } else if (subtype === 'song') {
        if (artist) parts.push(artist)
        if (album)  parts.push(album)
      } else if (subtype === 'artist') {
        if (genre) parts.push(genre)
      } else {
        if (artist) parts.push(artist)
        if (year)   parts.push(String(year))
      }
      break
    }
    case 'read': {
      const author   = typeof meta.author === 'string' ? meta.author : null
      const subgenre = typeof meta.subgenre === 'string' ? meta.subgenre
        : typeof meta.genre === 'string' ? meta.genre : null
      const year = meta.year ?? meta.published_year
      if (author)   parts.push(author)
      if (year)     parts.push(String(year))
      if (subgenre) parts.push(subgenre)
      break
    }
    case 'dine': {
      const type = typeof meta.type === 'string' ? meta.type : null
      const city = typeof meta.city === 'string' ? meta.city
        : typeof (meta.location as Record<string,unknown>)?.city === 'string'
          ? (meta.location as Record<string,unknown>).city as string
          : null
      if (type) parts.push(type)
      if (city) parts.push(city)
      break
    }
    case 'do': {
      const location   = typeof meta.city === 'string' ? meta.city
        : typeof meta.location === 'string' ? meta.location : null
      const difficulty = typeof meta.difficulty === 'string' ? meta.difficulty : null
      if (location)   parts.push(location)
      if (difficulty) parts.push(difficulty)
      break
    }
    case 'visit': {
      const venue = typeof meta.venue === 'string' ? meta.venue : null
      const city  = typeof meta.city === 'string' ? meta.city : null
      if (venue) parts.push(venue)
      if (city)  parts.push(city)
      break
    }
  }

  return parts.slice(0, 3).join(' · ')
}

function getDateUrgency(dateStr: string | null): 'none' | 'info' | 'soon' | 'urgent' | 'closed' {
  if (!dateStr) return 'none'
  const cleaned = dateStr.replace(/until|closes|closing|through/gi, '').trim()
  const parsed  = new Date(cleaned)
  if (isNaN(parsed.getTime())) return 'info'
  const now  = new Date()
  const days = Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0)   return 'closed'
  if (days <= 7)  return 'urgent'
  if (days <= 30) return 'soon'
  return 'info'
}

type Props = {
  recommendation: Recommendation
  variant?: 'full' | 'compact' | 'grid'
}

export function RecommendationCard({ recommendation, variant = 'full' }: Props) {
  const { id, title, category, source_name, image_url, reaction, notes, metadata } = recommendation
  const config = CATEGORY_MAP[category as Category]
  if (!config) return null

  const hasImage = hasValidImage(image_url)
  const meta     = metadata as Record<string, unknown>
  const metaLine = buildMetaLine(category as Category, meta)

  if (variant === 'compact') {
    return <CompactRow rec={recommendation} config={config} metaLine={metaLine} />
  }

  if (variant === 'grid') {
    return <GridCard rec={recommendation} config={config} metaLine={metaLine} hasImage={hasImage} />
  }

  // ── FULL CARD ──────────────────────────────────────────────────
  return (
    <Link href={`/rec/${id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        borderRadius: '11px',
        overflow:     'hidden',
        position:     'relative',
        background:   config.deepDark,
        border:       `1px solid rgba(${config.vividRgb},0.30)`,
        boxShadow:    `0 0 0 1px rgba(${config.vividRgb},0.06), 0 20px 50px rgba(0,0,0,0.70)`,
      }}>
        {/* Grain */}
        <div style={{
          position:        'absolute', inset: 0, borderRadius: '11px',
          zIndex:          30, pointerEvents: 'none',
          backgroundImage: GRAIN, backgroundSize: '200px 200px',
          opacity:         0.052, mixBlendMode: 'overlay',
        }} />

        {/* Zone 1 — Image */}
        <div style={{ width: '100%', height: '172px', position: 'relative', overflow: 'hidden' }}>
          {hasImage ? (
            <Image
              src={image_url!}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width:480px) 100vw,480px"
            />
          ) : (
            <>
              <div style={{ position: 'absolute', inset: 0, background: getCardGradient(category as Category) }} />
              <DotGrid rgb={config.vividRgb} />
              <Rangoli rgb={config.vividRgb} />
            </>
          )}
          <div style={{
            position:   'absolute', bottom: 0, left: 0, right: 0,
            height:     '70%', zIndex: 10, pointerEvents: 'none',
            background: getCardVignette(category as Category),
          }} />
          {/* Category badge */}
          <div style={{
            position:      'absolute', top: '12px', left: '12px', zIndex: 15,
            fontFamily:    'var(--f-ui)', fontSize: '9px', fontWeight: 700,
            letterSpacing: '2.5px', textTransform: 'uppercase',
            padding:       '4px 11px', borderRadius: '20px',
            backdropFilter:'blur(10px)',
            background:    `rgba(${config.vividRgb},0.16)`,
            border:        `1px solid rgba(${config.vividRgb},0.45)`,
            color:         'rgba(255,255,255,0.94)',
          }}>
            {config.label.toUpperCase()}
          </div>
        </div>

        {/* Zone 2 — Info */}
        <div style={{ padding: '16px 17px 17px', background: config.deepDark }}>
          <div style={{
            fontFamily:    'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
            fontSize:      '26px', color: 'rgba(255,255,255,0.97)',
            lineHeight:    1.10, marginBottom: '5px', letterSpacing: '-0.2px',
          }}>
            {title}
          </div>
          {metaLine && (
            <div style={{
              fontFamily:   'var(--f-body)', fontSize: '11px', fontWeight: 400,
              color:        `rgba(${config.vividRgb},0.65)`,
              marginBottom: notes ? '13px' : '15px',
            }}>
              {metaLine}
            </div>
          )}
          {notes && (
            <div style={{
              fontFamily:   'var(--f-display)', fontStyle: 'italic', fontWeight: 300,
              fontSize:     '13.5px', color: 'rgba(255,255,255,0.90)',
              lineHeight:   1.55, marginBottom: '15px',
              paddingLeft:  '11px',
              // Fixed: category vivid at 35%, not plain white
              borderLeft:   `1.5px solid rgba(${config.vividRgb},0.35)`,
            }}>
              &ldquo;{notes.length > 120 ? notes.slice(0, 120) + '…' : notes}&rdquo;
            </div>
          )}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            paddingTop:     '12px',
            borderTop:      '0.5px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              fontFamily:    'var(--f-display)', fontStyle: 'italic', fontWeight: 300,
              fontSize:      '17px', color: '#1fce94',
              textShadow:    '0 0 16px rgba(31,206,148,0.50)', letterSpacing: '-0.2px',
            }}>
              taareef
            </div>
            <div style={{
              fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 400,
              color:      'rgba(255,255,255,0.60)',
            }}>
              from {source_name}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── GRID CARD — Watch / Listen 2-col poster grid ──────────────────
// Letterboxd-style: image dominant, minimal info below

function GridCard({ rec, config, metaLine, hasImage }: {
  rec:      Recommendation
  config:   CategoryConfig
  metaLine: string
  hasImage: boolean
}) {
  return (
    <Link href={`/rec/${rec.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        borderRadius: '10px',
        overflow:     'hidden',
        position:     'relative',
        background:   config.deepDark,
        border:       `1px solid rgba(${config.vividRgb},0.22)`,
        boxShadow:    `0 8px 24px rgba(0,0,0,0.55)`,
      }}>
        {/* Grain */}
        <div style={{
          position:        'absolute', inset: 0, borderRadius: '10px',
          zIndex:          30, pointerEvents: 'none',
          backgroundImage: GRAIN, backgroundSize: '180px 180px',
          opacity:         0.048, mixBlendMode: 'overlay',
        }} />

        {/* Image zone — 3:4 aspect ratio, cinematic */}
        <div style={{
          width:    '100%',
          paddingTop:'133%',  // 3:4 ratio
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            {hasImage ? (
              <Image
                src={rec.image_url!}
                alt={rec.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width:480px) 50vw, 215px"
              />
            ) : (
              <>
                <div style={{ position: 'absolute', inset: 0, background: getCardGradient(rec.category as Category) }} />
                <DotGrid rgb={config.vividRgb} />
                <Rangoli rgb={config.vividRgb} small />
              </>
            )}
            {/* Bottom vignette */}
            <div style={{
              position:   'absolute', bottom: 0, left: 0, right: 0,
              height:     '60%', zIndex: 10, pointerEvents: 'none',
              background: getCardVignette(rec.category as Category),
            }} />
            {/* Reaction dot — top right if reacted */}
            {rec.reaction && (
              <div style={{
                position:     'absolute', top: '8px', right: '8px', zIndex: 15,
                width:        '8px', height: '8px', borderRadius: '50%',
                background:   rec.reaction === 'loved' ? '#f43f5e'
                  : rec.reaction === 'good' ? '#10b981'
                  : rec.reaction === 'okay' ? '#f59e0b'
                  : 'rgba(255,255,255,0.30)',
                boxShadow:    rec.reaction === 'loved' ? '0 0 6px rgba(244,63,94,0.70)'
                  : rec.reaction === 'good' ? '0 0 6px rgba(16,185,129,0.70)' : 'none',
              }} />
            )}
          </div>
        </div>

        {/* Info zone — compact, below image */}
        <div style={{ padding: '10px 11px 12px', background: config.deepDark }}>
          <div style={{
            fontFamily:    'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
            fontSize:      '15px', color: 'rgba(255,255,255,0.95)',
            lineHeight:    1.2, marginBottom: '3px',
            display:       '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient:'vertical',
            overflow:       'hidden',
          }}>
            {rec.title}
          </div>
          {metaLine && (
            <div style={{
              fontFamily: 'var(--f-body)', fontSize: '10px', fontWeight: 400,
              color:      `rgba(${config.vividRgb},0.60)`,
              marginBottom:'3px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {metaLine}
            </div>
          )}
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: '10px', fontWeight: 500,
            color:      '#d41020',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            from {rec.source_name}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── COMPACT ROW — Read / Dine / Do / Visit list rows ─────────────

function CompactRow({ rec, config, metaLine }: {
  rec:      Recommendation
  config:   CategoryConfig
  metaLine: string
}) {
  const hasImage = hasValidImage(rec.image_url)
  const reactionColors: Record<string, string> = {
    loved: '#f43f5e', good: '#10b981', okay: '#f59e0b',
  }

  return (
    <Link href={`/rec/${rec.id}`} style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '12px',
      padding:        '11px 0',
      borderBottom:   `1px solid rgba(${config.vividRgb},0.08)`,
      textDecoration: 'none',
      cursor:         'pointer',
    }}>
      {/* Thumbnail */}
      <div style={{
        width:        '52px',
        minWidth:     '52px',
        height:       '66px',
        borderRadius: '9px',
        overflow:     'hidden',
        position:     'relative',
        background:   config.deepDark,
        border:       `1px solid rgba(${config.vividRgb},0.22)`,
        flexShrink:   0,
      }}>
        {hasImage ? (
          <Image
            src={rec.image_url!}
            alt={rec.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="52px"
          />
        ) : (
          <>
            <div style={{
              position:   'absolute', inset: 0,
              background: `linear-gradient(135deg, rgba(${config.vividRgb},0.70) 0%, rgba(17,17,17,0.95) 100%)`,
            }} />
            <div style={{
              position:        'absolute', inset: 0,
              backgroundImage: `radial-gradient(circle, rgba(${config.vividRgb},1) 1.2px, transparent 1.2px)`,
              backgroundSize:  '10px 10px',
              opacity:         0.12,
            }} />
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily:    'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize:      '17px', color: 'rgba(255,255,255,0.95)',
          marginBottom:  '3px',
          whiteSpace:    'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {rec.title}
        </div>
        <div style={{
          fontFamily:   'var(--f-body)', fontSize: '12px', fontWeight: 500,
          color:        '#d41020',
          marginBottom: '2px',
        }}>
          from {rec.source_name}
        </div>
        {metaLine && (
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: '10px', fontWeight: 300,
            color:      'rgba(255,255,255,0.35)',
          }}>
            {metaLine}
          </div>
        )}
        {/* Visit urgency date */}
        {rec.category === 'visit' && (() => {
          const meta    = rec.metadata as Record<string, unknown>
          const dateStr = typeof meta.dates === 'string' ? meta.dates : null
          const urgency = getDateUrgency(dateStr)
          if (!dateStr || urgency === 'none') return null
          const urgencyStyle: Record<string, React.CSSProperties> = {
            info:   { color: 'rgba(255,255,255,0.35)' },
            soon:   { color: 'rgba(30,159,235,0.70)' },
            urgent: { color: 'rgba(30,159,235,1.0)', fontWeight: 600 },
            closed: { color: 'rgba(255,255,255,0.20)', textDecoration: 'line-through' },
          }
          return (
            <div style={{
              fontFamily: 'var(--f-body)', fontSize: '10px',
              display:    'flex', alignItems: 'center', gap: '4px',
              marginTop:  '2px',
              ...urgencyStyle[urgency],
            }}>
              {urgency === 'urgent' && (
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: 'rgba(30,159,235,1)', flexShrink: 0, display: 'inline-block',
                }} />
              )}
              {dateStr}
            </div>
          )
        })()}
      </div>

      {/* Reaction dot + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {rec.reaction && rec.reaction !== 'skip' && (
          <div style={{
            width:     '7px', height: '7px', borderRadius: '50%',
            background:reactionColors[rec.reaction] ?? 'transparent',
            boxShadow: rec.reaction === 'loved' ? '0 0 5px rgba(244,63,94,0.60)'
              : rec.reaction === 'good' ? '0 0 5px rgba(16,185,129,0.60)' : 'none',
          }} />
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.20)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </Link>
  )
}
