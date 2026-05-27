'use client'

// app/(app)/dashboard/dashboard-client.tsx
// 2×3 mosaic. 6 categories, always all visible.
// Tile: left vivid wash → matte black. Folk icon ghost top-right.
// Subcategory nudge pills at bottom when empty.

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/features/navigation/app-shell'
import { useToast } from '@/components/ui/toast'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { CATEGORIES, getTileGradient } from '@/constants/categories'
import type { CategoryConfig } from '@/constants/categories'
import type { Recommendation, CreateRecommendationInput } from '@/lib/types'

type TileData = {
  category: CategoryConfig
  count: number
  latest: Recommendation | null
  hasReacted: boolean
}

type DashboardClientProps = {
  tiles: TileData[]
  totalSaved: number
  userName: string
  userEmail: string
  userId: string
}

export function DashboardClient({ tiles, totalSaved }: DashboardClientProps) {
  const router = useRouter()
  const { toast } = useToast()
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
      <div style={{ maxWidth: '430px', margin: '0 auto', paddingBottom: '88px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', padding: '48px 0 8px' }}>
          <div style={{
            fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300,
            fontSize: '50px', color: '#1fce94', lineHeight: 1,
            textShadow: '0 0 40px rgba(31,206,148,0.45),0 0 100px rgba(31,206,148,0.18)',
          }}>
            taareef
          </div>
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300,
            color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em', marginTop: '6px',
          }}>
            {totalSaved === 0
              ? 'your vault is waiting'
              : `${totalSaved} recommendation${totalSaved === 1 ? '' : 's'}, remembered`}
          </div>
        </div>

        {/* 2×3 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '18px 14px 0' }}>
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

function Tile({ cat, filled, onClick }: { cat: CategoryConfig; filled: TileData | null; onClick: () => void }) {
  const count = filled?.count ?? 0
  const latest = filled?.latest ?? null

  return (
    <div
      onClick={onClick}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={`${cat.label}${count > 0 ? `, ${count} saved` : ', empty'}`}
      style={{
        position: 'relative', borderRadius: '14px', height: '148px',
        overflow: 'hidden', cursor: 'pointer', background: '#161616',
        border: `1px solid rgba(${cat.vividRgb},0.30)`,
        boxShadow: `0 10px 28px -8px rgba(${cat.vividRgb},0.28)`,
        transition: 'transform 130ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.015)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {/* Color wash */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '14px', background: getTileGradient(cat.id), zIndex: 1 }} />

      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '14px', zIndex: 4, pointerEvents: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")",
        backgroundSize: '180px 180px', opacity: 0.050, mixBlendMode: 'overlay',
      }} />

      {/* Ghost folk icon — top-right background */}
      <div style={{ position: 'absolute', top: '8px', right: '6px', zIndex: 2, opacity: 0.16, pointerEvents: 'none', transform: 'rotate(-3deg)', width: '86px', height: '86px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TileIcon id={cat.id} color={cat.vividColor} />
      </div>

      {/* Count badge */}
      {count > 0 && (
        <div style={{
          position: 'absolute', top: '11px', right: '11px', zIndex: 5,
          background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: '10px',
          width: '20px', height: '20px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '0.5px solid rgba(255,255,255,0.14)',
        }}>
          {count > 99 ? '99+' : count}
        </div>
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, padding: '14px 13px 13px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize: '22px', color: '#ffffff', lineHeight: 1.1,
          textShadow: `0 0 10px rgba(${cat.vividRgb},0.55)`,
        }}>
          {cat.label}
        </div>
        <div>
          {count === 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {cat.nudges.map(n => (
                <span key={n} style={{
                  fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.2px', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.36)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.10)',
                  borderRadius: '4px', padding: '2px 6px', lineHeight: 1.5,
                }}>
                  {n}
                </span>
              ))}
            </div>
          ) : latest ? (
            <>
              <div style={{
                fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
                fontSize: '13px', color: 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px',
              }}>
                {latest.title}
              </div>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '10px', fontWeight: 500, color: '#d41020' }}>
                from {latest.source_name}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function TileIcon({ id, color }: { id: string; color: string }) {
  const s = { stroke: color, strokeWidth: '5.5', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  switch (id) {
    case 'watch': return (
      <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
        <rect x="8" y="10" width="84" height="52" rx="4" {...s}/>
        <path d="M32 88 L50 62 L68 88 Z" {...s}/>
        <line x1="50" y1="62" x2="50" y2="88" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      </svg>
    )
    case 'listen': return (
      <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
        <circle cx="42" cy="72" r="22" {...s}/>
        <circle cx="42" cy="72" r="8" stroke={color} strokeWidth="3" fill="none"/>
        <line x1="56" y1="55" x2="78" y2="8" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <line x1="42" y1="51" x2="76" y2="8" stroke={color} strokeWidth="2.5" strokeDasharray="5,3" strokeLinecap="round"/>
        <circle cx="78" cy="8" r="5.5" fill={color}/>
      </svg>
    )
    case 'read': return (
      <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
        <rect x="18" y="14" width="64" height="74" rx="3" {...s}/>
        <line x1="30" y1="14" x2="30" y2="88" stroke={color} strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M56 14 L56 4 L64 10 L72 4 L72 14" stroke={color} strokeWidth="4" strokeLinejoin="round" fill="none"/>
      </svg>
    )
    case 'dine': return (
      <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
        <path d="M22 14 Q18 48 38 62 Q44 66 50 66 Q56 66 62 62 Q82 48 78 14" stroke={color} strokeWidth="5.5" fill="none" strokeLinecap="round"/>
        <line x1="22" y1="14" x2="78" y2="14" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <line x1="50" y1="66" x2="50" y2="86" stroke={color} strokeWidth="4.5" strokeLinecap="round"/>
        <line x1="28" y1="86" x2="72" y2="86" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <path d="M26 44 Q50 52 74 44" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    )
    case 'do': return (
      <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
        <path d="M38 88 L68 24 L98 88" stroke={color} strokeWidth="4.5" strokeLinejoin="round" fill="none"/>
        <path d="M68 24 L58 44 L78 44 Z" fill={color}/>
        <path d="M2 88 L36 10 L70 88 Z" stroke={color} strokeWidth="5.5" strokeLinejoin="round" fill="none"/>
        <path d="M36 10 L24 34 L48 34 Z" fill={color}/>
        <line x1="2" y1="88" x2="98" y2="88" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      </svg>
    )
    case 'visit': return (
      <svg viewBox="0 0 100 100" fill="none" width="86" height="86">
        <line x1="22" y1="92" x2="22" y2="52" stroke={color} strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="78" y1="92" x2="78" y2="52" stroke={color} strokeWidth="5.5" strokeLinecap="round"/>
        <path d="M22 52 C22 30 34 10 50 8 C66 10 78 30 78 52" stroke={color} strokeWidth="5.5" fill="none" strokeLinecap="round"/>
        <line x1="14" y1="62" x2="86" y2="62" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="50" cy="8" r="5" fill={color}/>
        <line x1="8" y1="92" x2="92" y2="92" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      </svg>
    )
    default: return null
  }
}
