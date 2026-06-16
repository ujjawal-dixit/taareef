// components/features/cards/full-card.tsx
// The single source of truth for the full two-zone card markup.
// Rendered by the detail screen now, and (later) by the share/export path —
// so the card a person sees and the card they share are the same definition.
//
// This is a presentational component: it takes already-computed display values
// as props and renders them. Derivation stays with the caller, so extracting
// this changed nothing about what gets shown.

import type { Ref } from 'react'
import Image from 'next/image'
import { CategoryMotif } from '@/components/features/cards/category-motif'
import { PlatformLogo } from '@/components/features/cards/platform-logo'
import type { CategoryConfig } from '@/constants/categories'
import type { Recommendation, Category } from '@/lib/types'

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")"

export type FullCardProps = {
  cardRef?:     Ref<HTMLDivElement>
  rec:          Recommendation
  cfg:          CategoryConfig
  rgb:          string
  hasImage:     boolean
  liveImageUrl: string | null
  dSubtype:     string | null
  subcatLbl:    string | null
  platform:     string | null
  castLine:     string | null
  metaLine:     string
  note:         string | null
  isLoved:      boolean
  isExp:        boolean
  vowText:      string
  titleSize:    number
  srcDisplay:   string
}

export function FullCard({
  cardRef, rec, cfg, rgb, hasImage, liveImageUrl, dSubtype, subcatLbl,
  platform, castLine, metaLine, note, isLoved, isExp, vowText, titleSize, srcDisplay,
}: FullCardProps) {
  return (
    <div ref={cardRef} style={{
      position: 'relative',
      width:    'calc(100% - 32px)',
      height:   '432px',
      margin:   '12px 16px 0',
      filter:   'drop-shadow(0 2px 3px rgba(0,0,0,0.65)) drop-shadow(0 11px 20px rgba(0,0,0,0.55))',
    }}>
      {/* RIM */}
      <div style={{
        position: 'relative', height: '100%', borderRadius: '14px',
        background: 'linear-gradient(to bottom,#2a2a28,#161614 4px,#161614 calc(100% - 6px),#050504)',
        paddingBottom: '5px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(0,0,0,0.4)',
      }}>
        {/* FACE — flex column */}
        <div style={{
          position: 'relative', height: '100%', borderRadius: '12px', padding: '7px',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(158deg,#0e1421,#0a0a0a 72%)',
          boxShadow: isLoved ? `0 0 0 1px rgba(${rgb},0.30)` : undefined,
        }}>
          {/* grain */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none', borderRadius: '12px',
            backgroundImage: GRAIN, backgroundSize: '150px', opacity: 0.07, mixBlendMode: 'overlay',
          }} />

          {/* WELL — flexes */}
          <div style={{
            position: 'relative', borderRadius: '7px', overflow: 'hidden',
            flex: '1 1 auto', minHeight: 0,
            boxShadow: `0 0 0 2px #0a0a0a, 0 0 0 3px rgba(${rgb},0.3)`,
          }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              {hasImage ? (
                <>
                  <Image
                    src={liveImageUrl!}
                    alt={rec.title}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                    sizes="(max-width:480px) 100vw,480px"
                    priority
                  />
                  <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', background: `rgba(${rgb},0.14)`, zIndex: 4 }} />
                </>
              ) : (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `radial-gradient(ellipse at 50% 42%, rgba(${rgb},0.20) 0%, rgba(10,10,10,0.96) 60%, #0a0a0a 100%)`,
                }}>
                  <CategoryMotif category={rec.category as Category} rgb={rgb} subtype={dSubtype} size={220} />
                </div>
              )}

              {/* marriage */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%', zIndex: 5,
                background: 'linear-gradient(to top, #0e1421, transparent)',
              }} />

              {/* OTT logo — poster bottom-left */}
              {hasImage && platform && (
                <div style={{ position: 'absolute', left: '9px', bottom: '9px', zIndex: 8 }}>
                  <PlatformLogo platform={platform} />
                </div>
              )}
            </div>

            {/* NOTCH — taareef — from X */}
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
                letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1, color: cfg.vividColor,
              }}>from {srcDisplay}</span>
            </div>
          </div>

          {/* INFO */}
          <div style={{ flex: '0 0 auto', padding: '12px 12px 11px', position: 'relative', zIndex: 5 }}>
            <div style={{
              fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500,
              fontSize: `${titleSize}px`, color: 'var(--ink)', lineHeight: 1.05, marginBottom: '6px',
            }}>
              {rec.title}
            </div>

            {metaLine && (
              <div style={{
                fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 400,
                color: 'var(--ink-soft)', lineHeight: 1.55,
              }}>
                {metaLine}
              </div>
            )}

            {castLine && (
              <div style={{
                fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 400,
                color: 'var(--ink-faint)', lineHeight: 1.5, marginTop: '1px',
              }}>
                {castLine}
              </div>
            )}

            {note && (
              <div style={{
                fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '14px',
                lineHeight: 1.35, color: 'rgba(244,243,238,0.82)',
                paddingLeft: '10px', marginTop: '10px',
                borderLeft: `2px solid rgba(${rgb},0.5)`,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                &ldquo;{note}&rdquo;
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginTop: '12px', paddingTop: '10px', borderTop: '0.5px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{
                fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '16px',
                color: `rgba(${rgb},${isExp ? 0.9 : 0.82})`,
              }}>
                {vowText}
                {isLoved && (
                  <span style={{
                    display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                    background: cfg.vividColor, boxShadow: `0 0 7px rgba(${rgb},0.8)`,
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
  )
}
