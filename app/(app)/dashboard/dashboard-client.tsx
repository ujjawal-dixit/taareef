'use client'

// app/(app)/dashboard/dashboard-client.tsx
// Session 9 — full redesign per critique session decisions:
// - Count shown on ALL tiles (including 0), positioned far right of header row
// - Title/source removed from filled tiles — count is the only data signal
// - All 6 tiles always show subcategory pills
// - Filled tiles: glowing border in category vivid color
// - Empty tiles: no border, dimmed opacity 0.60 + weaker vivid wash
// - Ghost folk icon shifted down to avoid count collision
// - Do icon: exactly 2 triangles (was 3)
// - Label font 26px (was 22px)
// - Tile height fills viewport proportionally

import { useCallback } from 'react'
import { useRouter }   from 'next/navigation'
import { AppShell }    from '@/components/features/navigation/app-shell'
import { useToast }    from '@/components/ui/toast'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { CATEGORIES, getTileGradient } from '@/constants/categories'
import type { CategoryConfig } from '@/constants/categories'
import type { Recommendation, CreateRecommendationInput } from '@/lib/types'

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

export function DashboardClient({ tiles, totalSaved }: DashboardClientProps) {
  const router     = useRouter()
  const { toast }  = useToast()
  const { create } = useCreateRecommendation()

  const handleSave = useCallback(async (input: CreateRecommendationInput) => {
    await create(
      input, undefined,
      () => { toast('Saved ✦', 'success'); router.refresh() },
      (err) => toast(err, 'error'),
    )
  }, [create, toast, router])

  const filledMap: Record<string, TileData> = {}
  tiles.forEach(t => { filledMap[t.category.id] = t })

  return (
    <AppShell onSaveRecommendation={handleSave}>
      <div style={{
        maxWidth:      '430px',
        margin:        '0 auto',
        minHeight:     '100dvh',
        display:       'flex',
        flexDirection: 'column',
        padding:       '0 0 88px',
      }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', padding: '44px 0 16px', flexShrink: 0 }}>
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
            color:         'rgba(255,255,255,0.22)',
            letterSpacing: '0.08em',
            marginTop:     '6px',
          }}>
            {totalSaved === 0
              ? 'your vault is waiting'
              : `${totalSaved} recommendation${totalSaved === 1 ? '' : 's'}, remembered`}
          </div>
        </div>

        {/* 2×3 grid — fills remaining height proportionally */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows:    'repeat(3, 1fr)',
          gap:                 '10px',
          padding:             '0 14px',
          flex:                1,
          minHeight:           0,
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
    </AppShell>
  )
}

// ── TILE ──────────────────────────────────────────────────────────

function Tile({
  cat,
  filled,
  onClick,
}: {
  cat:    CategoryConfig
  filled: TileData | null
  onClick: () => void
}) {
  const count    = filled?.count ?? 0
  const hasSaves = count > 0

  // Filled tiles: full opacity, glowing vivid border
  // Empty tiles: 60% opacity, weaker vivid wash, no border
  const tileStyle: React.CSSProperties = {
    position:    'relative',
    borderRadius:'14px',
    minHeight:   '148px',
    overflow:    'hidden',
    cursor:      'pointer',
    background:  '#161616',
    opacity:     hasSaves ? 1 : 0.62,
    // Glowing border only on filled tiles — category vivid color, reference confirmed
    border:      hasSaves
      ? `1px solid rgba(${cat.vividRgb},0.70)`
      : `1px solid rgba(${cat.vividRgb},0.14)`,
    boxShadow:   hasSaves
      ? `0 0 0 1px rgba(${cat.vividRgb},0.18), 0 0 18px rgba(${cat.vividRgb},0.28), 0 8px 24px -6px rgba(${cat.vividRgb},0.22)`
      : `0 8px 24px -6px rgba(${cat.vividRgb},0.10)`,
    transition:  'transform 130ms ease, opacity 130ms ease',
    WebkitTapHighlightColor: 'transparent',
    display:     'flex',
    flexDirection:'column',
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={`${cat.label}, ${count} saved`}
      style={tileStyle}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.015)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {/* Color wash — vivid floods left, dissolves to black */}
      {/* Filled tiles: vivid floods to 55%. Empty: floods to only 25% */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: hasSaves
          ? getTileGradient(cat.id)
          : `linear-gradient(100deg, rgba(${cat.vividRgb},0.55) 0%, rgba(${cat.vividRgb},0.14) 38%, rgba(17,17,17,0.98) 100%)`,
        zIndex: 1,
      }} />

      {/* Grain texture */}
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

      {/* Ghost folk icon — shifted down to clear count badge space */}
      <div style={{
        position:      'absolute',
        top:           '32px',  // was 8px — shifted down to not collide with count
        right:         '6px',
        zIndex:        2,
        opacity:       hasSaves ? 0.18 : 0.12,
        pointerEvents: 'none',
        transform:     'rotate(-3deg)',
        width:         '86px',
        height:        '86px',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
      }}>
        <TileIcon id={cat.id} color={cat.vividColor} />
      </div>

      {/* Content */}
      <div style={{
        position:      'relative',
        zIndex:        3,
        padding:       '12px 13px 13px',
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        justifyContent:'space-between',
      }}>

        {/* Top row: category label + count on opposite end */}
        <div style={{
          display:        'flex',
          alignItems:     'baseline',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: 'var(--f-display)',
            fontStyle:  'italic',
            fontWeight: 400,
            fontSize:   '26px',
            color:      'rgba(255,255,255,0.97)',
            lineHeight: 1.1,
            textShadow: '0 1px 12px rgba(0,0,0,0.40)',
          }}>
            {cat.label}
          </div>
          {/* Count — always shown, even 0. Far right, opposite end from label */}
          <div style={{
            fontFamily:    'var(--f-ui)',
            fontWeight:    700,
            fontSize:      '13px',
            color:         hasSaves ? `rgba(${cat.vividRgb},0.85)` : 'rgba(255,255,255,0.22)',
            letterSpacing: '0.02em',
            lineHeight:    1,
          }}>
            {count}
          </div>
        </div>

        {/* Bottom — subcategory pills always shown on all tiles */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', marginTop: '8px' }}>
          {cat.nudges.slice(0, 3).map(n => (
            <span key={n} style={{
              fontFamily:    'var(--f-ui)',
              fontSize:      '10px',
              fontWeight:    700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color:         hasSaves ? `rgba(${cat.vividRgb},0.75)` : 'rgba(255,255,255,0.35)',
              background:    hasSaves ? `rgba(${cat.vividRgb},0.12)` : 'rgba(0,0,0,0.20)',
              border:        `0.5px solid ${hasSaves ? `rgba(${cat.vividRgb},0.25)` : 'rgba(255,255,255,0.10)'}`,
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

// ── TILE FOLK ICONS ───────────────────────────────────────────────
// Warli geometric language. Circles, lines, triangles only.
// Do icon: exactly 2 triangles (front larger, back smaller behind it)

function TileIcon({ id, color }: { id: string; color: string }) {
  const s = {
    stroke:          color,
    strokeWidth:     '5.5' as const,
    strokeLinecap:   'round' as const,
    strokeLinejoin:  'round' as const,
    fill:            'none',
  }

  switch (id) {
    case 'watch':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
          <rect x="8" y="10" width="84" height="52" rx="4" {...s}/>
          <path d="M32 88 L50 62 L68 88 Z" {...s}/>
          <line x1="50" y1="62" x2="50" y2="88" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        </svg>
      )
    case 'listen':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
          <circle cx="42" cy="72" r="22" {...s}/>
          <circle cx="42" cy="72" r="8" stroke={color} strokeWidth="3" fill="none"/>
          <line x1="56" y1="55" x2="78" y2="8" stroke={color} strokeWidth="5" strokeLinecap="round"/>
          <line x1="42" y1="51" x2="76" y2="8" stroke={color} strokeWidth="2.5" strokeDasharray="5,3" strokeLinecap="round"/>
          <circle cx="78" cy="8" r="5.5" fill={color}/>
        </svg>
      )
    case 'read':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
          <rect x="18" y="14" width="64" height="74" rx="3" {...s}/>
          <line x1="30" y1="14" x2="30" y2="88" stroke={color} strokeWidth="4.5" strokeLinecap="round"/>
          <path d="M56 14 L56 4 L64 10 L72 4 L72 14" stroke={color} strokeWidth="4" strokeLinejoin="round" fill="none"/>
        </svg>
      )
    case 'dine':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
          <path d="M22 14 Q18 48 38 62 Q44 66 50 66 Q56 66 62 62 Q82 48 78 14" stroke={color} strokeWidth="5.5" fill="none" strokeLinecap="round"/>
          <line x1="22" y1="14" x2="78" y2="14" stroke={color} strokeWidth="5" strokeLinecap="round"/>
          <line x1="50" y1="66" x2="50" y2="86" stroke={color} strokeWidth="4.5" strokeLinecap="round"/>
          <line x1="28" y1="86" x2="72" y2="86" stroke={color} strokeWidth="5" strokeLinecap="round"/>
          <path d="M26 44 Q50 52 74 44" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
      )
    case 'do':
      // Exactly 2 triangles: back (smaller, right) + front (larger, left)
      // Ground line connects them. No third triangle.
      return (
        <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
          {/* Back mountain — smaller, behind */}
          <path d="M42 88 L70 22 L98 88" stroke={color} strokeWidth="4" strokeLinejoin="round" fill="none" opacity="0.70"/>
          {/* Back mountain snow cap */}
          <path d="M70 22 L62 40 L78 40 Z" fill={color} opacity="0.70"/>
          {/* Front mountain — larger, in front */}
          <path d="M2 88 L38 12 L74 88 Z" stroke={color} strokeWidth="5.5" strokeLinejoin="round" fill="none"/>
          {/* Front mountain snow cap */}
          <path d="M38 12 L28 32 L48 32 Z" fill={color}/>
          {/* Ground line */}
          <line x1="2" y1="88" x2="98" y2="88" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        </svg>
      )
    case 'visit':
      return (
        <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
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
