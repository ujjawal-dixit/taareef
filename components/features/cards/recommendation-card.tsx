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
import { PlatformLogo } from '@/components/features/cards/platform-logo'
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
  variant?: 'full' | 'compact' | 'grid'
  categoryConfig?: CategoryConfig  // optional — falls back to CATEGORY_MAP lookup
}

export function RecommendationCard({ recommendation, variant = 'full', categoryConfig: propConfig }: Props) {
  const { id, title, category, source_name, image_url, reaction, notes, metadata } = recommendation
  const config = propConfig ?? CATEGORY_MAP[category as Category]
  if (!config) return null

  const hasImage = hasValidImage(image_url)
  const meta     = metadata as Record<string, unknown>
  const metaLine = buildMetaLine(category as Category, meta, 3)

  if (variant === 'compact') {
    return <CompactRow rec={recommendation} config={config} metaLine={metaLine} />
  }

  if (variant === 'grid') {
    return <GridCard rec={recommendation} config={config} metaLine={metaLine} hasImage={hasImage} />
  }

  // ── FULL CARD — matches taareef-decision-cards.html (locked) ─────
  // Fixed object height; the WELL flexes and the INFO takes only its content
  // height. Built around the decision: record line (year · genre · length),
  // then cast, then tip. Notch carries taareef — from X with a real dash bar.
  // OTT logo lives in the poster bottom-left. No badge, no footer handshake.
  const rgb       = config.vividRgb
  const subtype   = typeof meta.subtype === 'string' ? meta.subtype : null
  const subcatLbl = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : null
  const platform  = Array.isArray(meta.streaming_platforms) && meta.streaming_platforms.length > 0
    && typeof meta.streaming_platforms[0] === 'string'
    ? meta.streaming_platforms[0] as string
    : null

  // The decision line and the secondary "cast" recognizer (category-aware).
  const castLine  = typeof meta.cast === 'string' ? meta.cast
    : Array.isArray(meta.cast) ? meta.cast.filter((x): x is string => typeof x === 'string').slice(0, 2).join(', ')
    : typeof meta.creators === 'string' ? meta.creators
    : null

  // Experienced state: the vow transforms (to watch → watched); loved adds glow + dot.
  const experiencedStatuses = ['experienced', 'done', 'finished', 'read', 'watched', 'visited']
  const statusStr  = typeof recommendation.status === 'string' ? recommendation.status : null
  const isExperienced = statusStr ? experiencedStatuses.includes(statusStr) : false
  const isLoved    = reaction === 'loved'
  const vowText    = isExperienced ? config.participle : `to ${config.infinitive}`

  // Title size curve — comes down from monumental so it leads without starving the record.
  const titleSize  = title.length > 34 ? 19 : title.length > 22 ? 22 : 25

  return (
    <Link href={`/rec/${id}`} style={{ textDecoration: 'none', display: 'block' }}>
      {/* OBJECT — fixed height; contact shadow grounds it as a kept thing */}
      <div style={{
        position: 'relative',
        width:    '100%',
        height:   '432px',
        filter:   'drop-shadow(0 2px 3px rgba(0,0,0,0.65)) drop-shadow(0 11px 20px rgba(0,0,0,0.55))',
      }}>
        {/* RIM — the lit physical edge */}
        <div style={{
          position:     'relative',
          height:       '100%',
          borderRadius: '14px',
          background:   'linear-gradient(to bottom,#2a2a28,#161614 4px,#161614 calc(100% - 6px),#050504)',
          paddingBottom:'5px',
          boxShadow:    'inset 0 1px 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(0,0,0,0.4)',
        }}>
          {/* FACE — flex column so well flexes, info hugs content */}
          <div style={{
            position:      'relative',
            height:        '100%',
            borderRadius:  '12px',
            padding:       '7px',
            overflow:      'hidden',
            display:       'flex',
            flexDirection: 'column',
            background:    'linear-gradient(158deg,#0e1421,#0a0a0a 72%)',
            boxShadow:     isLoved ? `0 0 0 1px rgba(${rgb},0.30)` : undefined,
          }}>
            {/* grain */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none', borderRadius: '12px',
              backgroundImage: GRAIN, backgroundSize: '150px', opacity: 0.07, mixBlendMode: 'overlay',
            }} />

            {/* WELL — flexes to fill; double-line seam */}
            <div style={{
              position: 'relative', borderRadius: '7px', overflow: 'hidden',
              flex: '1 1 auto', minHeight: 0,
              boxShadow: `0 0 0 2px #0a0a0a, 0 0 0 3px rgba(${rgb},0.3)`,
            }}>
              {/* poster (image) OR criterion (motif) */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                {hasImage ? (
                  <>
                    <Image
                      src={image_url!}
                      alt={title}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width:480px) 100vw,480px"
                    />
                    {/* 14% category wash — "poster is a guest in our house" */}
                    <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', background: `rgba(${rgb},0.14)`, zIndex: 4 }} />
                  </>
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `radial-gradient(ellipse at 50% 42%, rgba(${rgb},0.20) 0%, rgba(10,10,10,0.96) 60%, #0a0a0a 100%)`,
                  }}>
                    <CategoryMotif category={category as Category} rgb={rgb} subtype={subtype} size={220} />
                  </div>
                )}

                {/* the "marriage" — poster dissolves into the category-tinted dark */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%', zIndex: 5,
                  background: `linear-gradient(to top, #0e1421, transparent)`,
                }} />

                {/* OTT logo — bottom-left of the poster, on a dark scrim (locked placement) */}
                {hasImage && platform && (
                  <div style={{ position: 'absolute', left: '9px', bottom: '9px', zIndex: 8 }}>
                    <PlatformLogo platform={platform} />
                  </div>
                )}
              </div>

              {/* NOTCH — taareef — from X, one line, real dash bar, fixed 28px */}
              <div style={{
                position: 'absolute', top: 0, right: 0, zIndex: 20,
                background: '#000', borderRadius: '0 7px 0 12px', padding: '0 11px',
                height: '28px', display: 'flex', alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400, fontSize: '14px',
                  lineHeight: 1, color: '#1fce94',
                }}>taareef</span>
                <span style={{
                  display: 'inline-block', width: '10px', height: '1px',
                  background: 'rgba(255,255,255,0.45)', margin: '0 7px',
                }} />
                <span style={{
                  fontFamily: 'var(--f-ui)', fontSize: '12px', fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1, color: config.vividColor,
                }}>from {source_name}</span>
              </div>
            </div>

            {/* INFO — flex:0, takes only content height */}
            <div style={{ flex: '0 0 auto', padding: '12px 12px 11px', position: 'relative', zIndex: 5 }}>
              <div style={{
                fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500,
                fontSize: `${titleSize}px`, color: 'var(--ink)', lineHeight: 1.05, marginBottom: '6px',
              }}>
                {title}
              </div>

              {/* decision line — the spine */}
              {metaLine && (
                <div style={{
                  fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 400,
                  color: 'var(--ink-soft)', lineHeight: 1.55,
                }}>
                  {metaLine}
                </div>
              )}

              {/* secondary recognizer — cast / creators */}
              {castLine && (
                <div style={{
                  fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 400,
                  color: 'var(--ink-faint)', lineHeight: 1.5, marginTop: '1px',
                }}>
                  {castLine}
                </div>
              )}

              {/* tip — 2-line clamp */}
              {notes && (
                <div style={{
                  fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '14px',
                  lineHeight: 1.35, color: 'rgba(244,243,238,0.82)',
                  paddingLeft: '10px', marginTop: '10px',
                  borderLeft: `2px solid rgba(${rgb},0.5)`,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  &ldquo;{notes}&rdquo;
                </div>
              )}

              {/* FOOTER — vow bottom-left (transforms when experienced) + subcategory bottom-right */}
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginTop: '12px', paddingTop: '10px', borderTop: '0.5px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{
                  fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '16px',
                  color: `rgba(${rgb},${isExperienced ? 0.9 : 0.82})`,
                }}>
                  {vowText}
                  {isLoved && (
                    <span style={{
                      display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                      background: config.vividColor, boxShadow: `0 0 7px rgba(${rgb},0.8)`,
                      marginLeft: '7px', verticalAlign: 'middle',
                    }} />
                  )}
                </span>
                {subcatLbl && (
                  <span style={{
                    fontFamily: 'var(--f-ui)', fontSize: '16px', fontWeight: 600,
                    letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-faint)',
                  }}>
                    {subcatLbl}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
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
                  subtype={typeof (rec.metadata as Record<string, unknown>).subtype === 'string'
                    ? ((rec.metadata as Record<string, unknown>).subtype as string)
                    : null}
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
