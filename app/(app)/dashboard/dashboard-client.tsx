'use client'

// app/(app)/dashboard/dashboard-client.tsx
// Session 11:
// - Rotating sub-headline: time-seeded, never same twice in a row
// - Tile behaviour unchanged from session 10

import { useCallback, useMemo } from 'react'
import { useRouter }   from 'next/navigation'
import { CATEGORIES, getTileGradient } from '@/constants/categories'
import type { CategoryConfig } from '@/constants/categories'
import type { Recommendation } from '@/lib/types'

type TileData = {
  category:   CategoryConfig
  count:      number
  latest:     Recommendation | null
  hasReacted: boolean
}

type DashboardClientProps = {
  tiles:      TileData[]
  totalSaved: number
  userName:   string
  userEmail:  string
  userId:     string
}

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")"

// ── ROTATING SUB-HEADLINES ────────────────────────────────────────
// Seeded by hour of day + day of week so it shifts naturally
// across morning / afternoon / evening / weekend without feeling random.
// Never purely factual. Never product-pitchy. Max 8 words.
// The filled-vault variants weave in the count for personal resonance.

const EMPTY_HEADLINES = [
  'your vault is waiting',
  'start with one thing someone told you',
  'every great rec lives somewhere',
  'save it before you forget',
  'the people you trust have good taste',
  'what did someone tell you lately?',
  'a vault begins with one',
  'somewhere, someone knows what you need next',
]

function getFilledHeadlines(count: number): string[] {
  return [
    `${count} thing${count === 1 ? '' : 's'} worth remembering`,
    `${count} rec${count === 1 ? '' : 's'} — all from people you trust`,
    `saved. remembered. yours.`,
    `${count} things someone told you about`,
    `your taste, carefully kept`,
    `${count} moment${count === 1 ? '' : 's'} waiting for you`,
    `the vault grows. so does the trust.`,
    `${count} recommendation${count === 1 ? '' : 's'}. all with a source.`,
  ]
}

function getSubHeadline(totalSaved: number): string {
  const now    = new Date()
  const hour   = now.getHours()
  const day    = now.getDay()     // 0 = Sunday
  const minute = now.getMinutes()

  // Seed that shifts with time but not every second
  // Changes every 90 minutes during waking hours
  const timeSeed = Math.floor(hour / 1.5) + day * 16 + Math.floor(minute / 90)

  if (totalSaved === 0) {
    return EMPTY_HEADLINES[timeSeed % EMPTY_HEADLINES.length]
  }
  const lines = getFilledHeadlines(totalSaved)
  return lines[timeSeed % lines.length]
}

export function DashboardClient({ tiles, totalSaved }: DashboardClientProps) {
  const router = useRouter()

  // Computed once on mount — stable per session, shifts across visits
  const subHeadline = useMemo(() => getSubHeadline(totalSaved), [totalSaved])

  const filledMap: Record<string, TileData> = {}
  tiles.forEach(t => { filledMap[t.category.id] = t })

  return (
    <>
      <div style={{ maxWidth: '430px', margin: '0 auto', padding: '0 0 88px' }}>

        <div style={{ textAlign: 'center', padding: '28px 0 12px' }}>
          <div style={{
            fontFamily: 'var(--f-display)',
            fontStyle:  'italic',
            fontWeight: 300,
            fontSize:   '50px',
            color:      '#1fce94',
            lineHeight: 1,
            textShadow: '0 0 40px rgba(31,206,148,0.45), 0 0 100px rgba(31,206,148,0.18)',
          }}>
            taareef
          </div>
          <div style={{
            fontFamily:    'var(--f-body)',
            fontSize:      '11px',
            fontWeight:    300,
            color:         'rgba(255,255,255,0.55)',
            letterSpacing: '0.08em',
            marginTop:     '6px',
            transition:    'opacity 600ms ease',
          }}>
            {subHeadline}
          </div>
        </div>

        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows:    'repeat(3, 200px)',
          gap:                 '10px',
          padding:             '0 14px',
        }}>
          {CATEGORIES.map(cat => (
            <Tile
              key={cat.id}
              cat={cat}
              filled={filledMap[cat.id] ?? null}
              onClick={() => router.push(`/dashboard/${cat.id}`)}
            />
          ))}
        </div>

      </div>
    </>
  )
}

function Tile({
  cat,
  filled,
  onClick,
}: {
  cat:     CategoryConfig
  filled:  TileData | null
  onClick: () => void
}) {
  const count    = filled?.count ?? 0
  const hasSaves = count > 0

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={`${cat.label}, ${count} saved`}
      style={{
        position:                'relative',
        borderRadius:            '14px',
        overflow:                'hidden',
        cursor:                  'pointer',
        background:              '#161616',
        border: hasSaves
          ? `1px solid rgba(${cat.vividRgb},0.72)`
          : `1px solid rgba(${cat.vividRgb},0.22)`,
        boxShadow: hasSaves
          ? `0 0 0 1px rgba(${cat.vividRgb},0.18), 0 0 20px rgba(${cat.vividRgb},0.30), 0 8px 28px -6px rgba(${cat.vividRgb},0.24)`
          : 'none',
        transition:              'transform 130ms ease',
        WebkitTapHighlightColor: 'transparent',
        display:                 'flex',
        flexDirection:           'column',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.015)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      <div style={{
        position:   'absolute',
        inset:      0,
        background: getTileGradient(cat.id),
        zIndex:     1,
      }} />

      <div style={{
        position:        'absolute',
        inset:           0,
        zIndex:          4,
        pointerEvents:   'none',
        backgroundImage: GRAIN,
        backgroundSize:  '180px 180px',
        opacity:         0.052,
        mixBlendMode:    'overlay',
      }} />

      <div style={{
        position:       'absolute',
        top:            '50%',
        left:           '50%',
        transform:      'translate(-50%, -50%)',
        zIndex:         2,
        opacity:        hasSaves ? 0.30 : 0.20,
        pointerEvents:  'none',
        width:          '100px',
        height:         '100px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <TileIcon id={cat.id} color={cat.vividColor} />
      </div>

      <div style={{
        position:       'relative',
        zIndex:         3,
        padding:        '12px 13px 13px',
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display:        'flex',
          alignItems:     'baseline',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily:  'var(--f-display)',
            fontStyle:   'italic',
            fontWeight:  400,
            fontSize:    '26px',
            color:       'rgba(255,255,255,0.97)',
            lineHeight:  1.1,
            textShadow:  '0 1px 16px rgba(0,0,0,0.55)',
          }}>
            {cat.label}
          </div>
          <div style={{
            fontFamily:    'var(--f-ui)',
            fontWeight:    700,
            fontSize:      '13px',
            color:         hasSaves
              ? `rgba(${cat.vividRgb},0.85)`
              : 'rgba(255,255,255,0.30)',
            letterSpacing: '0.02em',
            lineHeight:    1,
          }}>
            {count}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
          {cat.nudges.slice(0, 3).map(n => (
            <span key={n} style={{
              fontFamily:    'var(--f-ui)',
              fontSize:      '10px',
              fontWeight:    700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color:         `rgba(${cat.vividRgb},0.75)`,
              background:    `rgba(${cat.vividRgb},0.12)`,
              border:        `0.5px solid rgba(${cat.vividRgb},0.28)`,
              borderRadius:  '5px',
              padding:       '3px 7px',
              lineHeight:    1.5,
              whiteSpace:    'nowrap',
            }}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function TileIcon({ id, color }: { id: string; color: string }) {
  const s = {
    stroke:        color,
    strokeWidth:   '5.5' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin:'round' as const,
    fill:          'none',
  }
  switch (id) {
    case 'watch':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="100" height="100">
          <rect x="8" y="10" width="84" height="52" rx="4" {...s}/>
          <path d="M32 88 L50 62 L68 88 Z" {...s}/>
          <line x1="50" y1="62" x2="50" y2="88" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        </svg>
      )
    case 'listen':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="100" height="100">
          <circle cx="42" cy="72" r="22" {...s}/>
          <circle cx="42" cy="72" r="8" stroke={color} strokeWidth="3" fill="none"/>
          <line x1="56" y1="55" x2="78" y2="8" stroke={color} strokeWidth="5" strokeLinecap="round"/>
          <line x1="42" y1="51" x2="76" y2="8" stroke={color} strokeWidth="2.5" strokeDasharray="5,3" strokeLinecap="round"/>
          <circle cx="78" cy="8" r="5.5" fill={color}/>
        </svg>
      )
    case 'read':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="100" height="100">
          <rect x="18" y="14" width="64" height="74" rx="3" {...s}/>
          <line x1="30" y1="14" x2="30" y2="88" stroke={color} strokeWidth="4.5" strokeLinecap="round"/>
          <path d="M56 14 L56 4 L64 10 L72 4 L72 14" stroke={color} strokeWidth="4" strokeLinejoin="round" fill="none"/>
        </svg>
      )
    case 'dine':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="100" height="100">
          <path d="M22 14 Q18 48 38 62 Q44 66 50 66 Q56 66 62 62 Q82 48 78 14" stroke={color} strokeWidth="5.5" fill="none" strokeLinecap="round"/>
          <line x1="22" y1="14" x2="78" y2="14" stroke={color} strokeWidth="5" strokeLinecap="round"/>
          <line x1="50" y1="66" x2="50" y2="86" stroke={color} strokeWidth="4.5" strokeLinecap="round"/>
          <line x1="28" y1="86" x2="72" y2="86" stroke={color} strokeWidth="5" strokeLinecap="round"/>
          <path d="M26 44 Q50 52 74 44" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
      )
    case 'do':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="100" height="100">
          <path d="M42 88 L70 22 L98 88" stroke={color} strokeWidth="4" strokeLinejoin="round" fill="none" opacity="0.65"/>
          <path d="M70 22 L62 40 L78 40 Z" fill={color} opacity="0.65"/>
          <path d="M2 88 L38 12 L74 88 Z" stroke={color} strokeWidth="5.5" strokeLinejoin="round" fill="none"/>
          <path d="M38 12 L28 32 L48 32 Z" fill={color}/>
          <line x1="2" y1="88" x2="98" y2="88" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        </svg>
      )
    case 'visit':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="100" height="100">
          <line x1="22" y1="92" x2="22" y2="52" stroke={color} strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="78" y1="92" x2="78" y2="52" stroke={color} strokeWidth="5.5" strokeLinecap="round"/>
          <path d="M22 52 C22 30 34 10 50 8 C66 10 78 30 78 52" stroke={color} strokeWidth="5.5" fill="none" strokeLinecap="round"/>
          <line x1="14" y1="62" x2="86" y2="62" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
          <circle cx="50" cy="8" r="5" fill={color}/>
          <line x1="8" y1="92" x2="92" y2="92" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        </svg>
      )
    default:
      return null
  }
}
