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
import { CategoryMotif } from '@/components/features/cards/category-motif'
import { buildMetaLine, getDateUrgency } from '@/lib/card/derive'
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

type Props = {
  recommendation: Recommendation
  variant: 'compact' | 'grid'
  categoryConfig?: CategoryConfig  // optional — falls back to CATEGORY_MAP lookup
}

export function RecommendationCard({ recommendation, variant, categoryConfig: propConfig }: Props) {
  const { category, image_url, metadata } = recommendation
  const config = propConfig ?? CATEGORY_MAP[category as Category]
  if (!config) return null

  const hasImage = hasValidImage(image_url)
  const meta     = metadata as import('@/lib/types').RecMetadata
  const metaLine = buildMetaLine(category as Category, meta, 3)

  if (variant === 'compact') {
    return <CompactRow rec={recommendation} config={config} metaLine={metaLine} />
  }

  return <GridCard rec={recommendation} config={config} metaLine={metaLine} hasImage={hasImage} />
}

// ── GRID CARD — Watch / Listen 2-col poster grid ──────────────────
// Letterboxd-style: image fills a 2:3 ratio zone (film poster ratio).
// Cards without confirmed posters show Criterion mini — gradient + rangoli.
// Info zone below is compact — title, source only. Meta is for the detail screen.
// Reaction dot: category vivid for loved, dimmer for good, quiet for okay.

function GridCard({ rec, config, metaLine, hasImage }: {
  rec:      Recommendation
  config:   CategoryConfig
  metaLine: string
  hasImage: boolean
}) {
  // Dynamic title sizing — short titles feel large, long ones compress
  const titleLen  = rec.title.length
  const titleSize = titleLen <= 12 ? '17px' : titleLen <= 22 ? '15px' : '13px'

  // Reaction dot colors use category vivid for loved, stepping down for others
  const reactionDot = rec.reaction === 'loved'
    ? { bg: config.vividColor, glow: `0 0 6px rgba(${config.vividRgb},0.80)` }
    : rec.reaction === 'good'
    ? { bg: `rgba(${config.vividRgb},0.55)`, glow: 'none' }
    : rec.reaction === 'okay'
    ? { bg: 'rgba(255,255,255,0.22)', glow: 'none' }
    : null

  return (
    <Link href={`/rec/${rec.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        borderRadius: '11px',
        overflow:     'hidden',
        position:     'relative',
        background:   config.deepDark,
        // Reaction-aware border — loved cards glow in category color
        border:       rec.reaction === 'loved'
          ? `1px solid rgba(${config.vividRgb},0.45)`
          : `1px solid rgba(${config.vividRgb},0.18)`,
        boxShadow:    rec.reaction === 'loved'
          ? `0 0 14px rgba(${config.vividRgb},0.18), 0 8px 24px rgba(0,0,0,0.55)`
          : '0 8px 24px rgba(0,0,0,0.55)',
        transition:   'transform 120ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      >
        {/* Grain */}
        <div style={{
          position:        'absolute', inset: 0, borderRadius: '11px',
          zIndex:          30, pointerEvents: 'none',
          backgroundImage: GRAIN, backgroundSize: '180px 180px',
          opacity:         0.048, mixBlendMode: 'overlay',
        }} />

        {/* Image zone — 2:3 ratio (standard film poster) */}
        <div style={{
          width:      '100%',
          paddingTop: '150%',   // 2:3 = 150%
          position:   'relative',
          overflow:   'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            {hasImage ? (
              <Image
                src={rec.image_url!}
                alt={rec.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width:480px) 50vw, 200px"
              />
            ) : (
              // Criterion mini — same language as full card, scaled to grid slot
              <>
                <div style={{ position: 'absolute', inset: 0, background: getCardGradient(rec.category as Category) }} />
                <DotGrid rgb={config.vividRgb} />
                <CategoryMotif
                  category={rec.category as Category}
                  rgb={config.vividRgb}
                  subtype={(rec.metadata as import('@/lib/types').RecMetadata).subtype ?? null}
                  size={132}
                />
                {/* Title rendered in image zone for Criterion mode */}
                <div style={{
                  position:   'absolute',
                  bottom:     0,
                  left:       0,
                  right:      0,
                  padding:    '28px 10px 10px',
                  zIndex:     12,
                  background: getCardVignette(rec.category as Category),
                }}>
                  <div style={{
                    fontFamily:  'var(--f-display)',
                    fontStyle:   'italic',
                    fontWeight:  400,
                    fontSize:    titleSize,
                    color:       'rgba(255,255,255,0.95)',
                    lineHeight:  1.2,
                    display:     '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow:    'hidden',
                  }}>
                    {rec.title}
                  </div>
                </div>
              </>
            )}

            {/* Vignette on poster images */}
            {hasImage && (
              <div style={{
                position:   'absolute', bottom: 0, left: 0, right: 0,
                height:     '45%', zIndex: 10, pointerEvents: 'none',
                background: getCardVignette(rec.category as Category),
              }} />
            )}

            {/* Reaction dot — top right, category-vivid for loved */}
            {reactionDot && (
              <div style={{
                position:  'absolute', top: '8px', right: '8px', zIndex: 15,
                width:     '8px', height: '8px', borderRadius: '50%',
                background:reactionDot.bg,
                boxShadow: reactionDot.glow,
              }} />
            )}
          </div>
        </div>

        {/* Info zone — title + source. Minimal. Detail screen handles the rest. */}
        <div style={{ padding: '9px 10px 11px', background: config.deepDark }}>
          {/* Title — dynamic size, only shown when image exists (Criterion mode has it above) */}
          {hasImage && (
            <div style={{
              fontFamily:      'var(--f-display)',
              fontStyle:       'italic',
              fontWeight:      400,
              fontSize:        titleSize,
              color:           'rgba(255,255,255,0.95)',
              lineHeight:      1.2,
              marginBottom:    '4px',
              display:         '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow:        'hidden',
            } as React.CSSProperties}>
              {rec.title}
            </div>
          )}
          {/* Source — always shown */}
          <div style={{
            fontFamily:   'var(--f-body)',
            fontSize:     '11px',
            fontWeight:   500,
            color:        config.vividColor,
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
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
          color:        config.vividColor,
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
          const meta    = rec.metadata as import('@/lib/types').RecMetadata
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
