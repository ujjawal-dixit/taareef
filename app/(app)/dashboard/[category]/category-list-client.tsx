'use client'

// app/(app)/dashboard/[category]/category-list-client.tsx
// Session 11:
// - Grid/list toggle per-category (persisted in localStorage)
// - Grid: 2-col poster grid for Watch/Listen (default grid)
// - List: compact rows for all categories
// - Criterion mini for unconfirmed/no-image cards in grid
// - Category-specific empty state copy (not a product pitch)
// - Delete toast with 10-second soft-delete undo

import { useState, useEffect, useRef } from 'react'
import Link                      from 'next/link'
import { useSave, useSaveEvents } from '@/components/features/navigation/app-providers'
import { RecommendationCard }    from '@/components/features/cards/recommendation-card'
import { useRouter }             from 'next/navigation'
import type { Recommendation } from '@/lib/types'
import type { CategoryConfig }   from '@/constants/categories'
import { trackCategoryViewed }   from '@/lib/analytics/track'

type Props = {
  recommendations: Recommendation[]
  categoryConfig:  CategoryConfig
  deletedId?:      string   // passed via search param after delete redirect
}

// Categories that default to grid view
const GRID_DEFAULTS = new Set(['watch', 'listen'])

// Category-specific empty state copy — Taareef's own voice
const EMPTY_COPY: Record<string, { headline: string; body: string }> = {
  watch: {
    headline: 'Every film someone loves',
    body:     "was made for the moment they'd share it with you.",
  },
  listen: {
    headline: "Music doesn't find you by accident.",
    body:     'Someone carried it to you.',
  },
  read: {
    headline: 'A book recommended is a door',
    body:     'someone held open.',
  },
  dine: {
    headline: "The best meal you'll ever have",
    body:     "starts with someone saying — trust me.",
  },
  do: {
    headline: 'The things worth doing',
    body:     'always need someone to go first.',
  },
  visit: {
    headline: 'Some things only exist for a while.',
    body:     "Someone made sure you'd know.",
  },
}

// ── DELETE TOAST ──────────────────────────────────────────────────
// Shows after redirect from card detail after deletion.
// 10-second window to undo. On undo: PATCH status back to 'saved'.

function DeleteToast({ title, recId, categoryId, onDismiss }: {
  title:      string
  recId:      string
  categoryId: string
  onDismiss:  () => void
}) {
  const [countdown, setCountdown]   = useState(10)
  const [undoing,   setUndoing]     = useState(false)
  const [undone,    setUndone]      = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router      = useRouter()

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(intervalRef.current!)
          onDismiss()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [onDismiss])

  async function handleUndo() {
    clearInterval(intervalRef.current!)
    setUndoing(true)
    try {
      await fetch(`/api/recommendations/${recId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'saved' }),
      })
      setUndone(true)
      setTimeout(() => {
        onDismiss()
        router.refresh()
      }, 1200)
    } catch {
      onDismiss()
    }
  }

  return (
    <div style={{
      position:      'fixed',
      bottom:        '88px',   // above bottom nav
      left:          '50%',
      transform:     'translateX(-50%)',
      zIndex:        200,
      maxWidth:      '360px',
      width:         'calc(100% - 32px)',
      background:    '#1e1e1e',
      border:        '1px solid rgba(255,255,255,0.10)',
      borderRadius:  '14px',
      padding:       '12px 16px',
      display:       'flex',
      alignItems:    'center',
      justifyContent:'space-between',
      gap:           '12px',
      boxShadow:     '0 8px 32px rgba(0,0,0,0.60)',
      animation:     'toastIn 220ms cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily:  'var(--f-body)',
          fontSize:    '13px',
          fontWeight:  400,
          color:       undone ? '#1fce94' : 'rgba(255,255,255,0.80)',
          whiteSpace:  'nowrap',
          overflow:    'hidden',
          textOverflow:'ellipsis',
          transition:  'color 300ms ease',
        }}>
          {undone
            ? `${title} restored`
            : `${title} removed`}
        </div>
        {!undone && (
          <div style={{
            fontFamily: 'var(--f-body)',
            fontSize:   '11px',
            fontWeight: 300,
            color:      'rgba(255,255,255,0.30)',
            marginTop:  '2px',
          }}>
            Permanently deleted in {countdown}s
          </div>
        )}
      </div>
      {!undone && (
        <button
          onClick={handleUndo}
          disabled={undoing}
          style={{
            fontFamily:              'var(--f-ui)',
            fontSize:                '11px',
            fontWeight:              700,
            letterSpacing:           '1px',
            textTransform:           'uppercase',
            color:                   '#1fce94',
            background:              'rgba(31,206,148,0.10)',
            border:                  '1px solid rgba(31,206,148,0.25)',
            borderRadius:            '8px',
            padding:                 '6px 14px',
            cursor:                  undoing ? 'not-allowed' : 'pointer',
            flexShrink:              0,
            WebkitTapHighlightColor: 'transparent',
            opacity:                 undoing ? 0.5 : 1,
          }}
        >
          {undoing ? '…' : 'Undo'}
        </button>
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────

export function CategoryListClient({ recommendations: serverRecs, categoryConfig: cfg, deletedId }: Props) {

  const { openCapture } = useSave()

  const [recs,        setRecs]        = useState<Recommendation[]>(
    // Filter out the deleted card immediately if redirected post-delete
    serverRecs.filter(r => r.id !== deletedId)
  )
  const [activeNudge, setActiveNudge] = useState<string>('All')

  // Session 17 — measurement only. Q: which categories are alive and which
  // are inert? Fire-and-forget; cannot fail a render.
  useEffect(() => {
    trackCategoryViewed(cfg.id)
  }, [cfg.id])

  // Grid/list toggle — per-category, persisted in localStorage
  const storageKey = `taareef-view-${cfg.id}`
  const defaultGrid = GRID_DEFAULTS.has(cfg.id)

  const [isGrid, setIsGrid] = useState<boolean>(() => {
    // Server-safe: default to GRID_DEFAULTS, override with stored pref on client
    return defaultGrid
  })

  // Restore preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) setIsGrid(stored === 'grid')
    } catch {}
  }, [storageKey])

  function toggleView() {
    setIsGrid(prev => {
      const next = !prev
      try { localStorage.setItem(storageKey, next ? 'grid' : 'list') } catch {}
      return next
    })
  }

  // Delete toast — shown when redirected from detail after deletion
  const [showDeleteToast, setShowDeleteToast] = useState<{
    title: string; recId: string
  } | null>(() => {
    if (!deletedId) return null
    const deleted = serverRecs.find(r => r.id === deletedId)
    return deleted ? { title: deleted.title, recId: deletedId } : null
  })

  // The save itself lives in the provider above the router. This screen
  // only reacts: insert immediately, swap in the real card when it
  // lands, remove it if the save failed.
  useSaveEvents({
    onOptimistic: (temp) => {
      if (temp.category === cfg.id) setRecs(prev => [temp, ...prev])
    },
    onSaved: (real, tempId) => {
      setRecs(prev => {
        const hadTemp = prev.some(r => r.id === tempId)
        if (hadTemp) return prev.map(r => r.id === tempId ? real : r)
        // Saved into this category from elsewhere — add it.
        return real.category === cfg.id ? [real, ...prev] : prev
      })
    },
    onFailed: (tempId) => {
      setRecs(prev => prev.filter(r => r.id !== tempId))
    },
  })

  const nudges   = ['All', ...cfg.nudges]
  const filtered = activeNudge === 'All'
    ? recs
    : recs.filter(r => {
        const meta = r.metadata as import('@/lib/types').RecMetadata
        const sub  = meta.subtype ?? ''
        return sub.toLowerCase() === activeNudge.toLowerCase()
      })

  const emptyCopy = EMPTY_COPY[cfg.id] ?? {
    headline: 'Nothing saved here yet',
    body:     'Start with something someone told you about.',
  }

  const canToggle = true  // All categories support both views

  return (
    <>
      <div style={{ maxWidth: '430px', margin: '0 auto', paddingBottom: '100px' }}>

        {/* Back nav */}
        <div style={{ padding: '52px 16px 0' }}>
          <Link
            href="/dashboard"
            style={{
              display:                 'flex',
              alignItems:              'center',
              justifyContent:          'center',
              gap:                     '8px',
              height:                  '50px',
              borderRadius:            '14px',
              border:                  '1px solid rgba(31,206,148,0.38)',
              background:              'rgba(31,206,148,0.06)',
              fontFamily:              'var(--f-ui)',
              fontSize:                '13px',
              fontWeight:              700,
              letterSpacing:           '0.08em',
              textTransform:           'uppercase',
              color:                   '#1fce94',
              textDecoration:          'none',
              textShadow:              '0 0 12px rgba(31,206,148,0.45)',
              boxShadow:               '0 0 24px rgba(31,206,148,0.08)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            vault
          </Link>
        </div>

        {/* Header — category name, count, toggle */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
          }}>
            <h1 style={{
              fontFamily: 'var(--f-display)',
              fontWeight: 400,
              fontStyle:  'italic',
              fontSize:   '36px',
              color:      'rgba(255,255,255,0.95)',
              margin:     0,
              textShadow: `0 0 24px rgba(${cfg.vividRgb},0.28)`,
            }}>
              {cfg.label}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Count */}
              <span style={{
                fontFamily: 'var(--f-ui)',
                fontSize:   '13px',
                fontWeight: 700,
                color:      recs.length > 0
                  ? `rgba(${cfg.vividRgb},0.75)`
                  : 'rgba(255,255,255,0.22)',
              }}>
                {activeNudge === 'All' ? recs.length : filtered.length}
              </span>

              {/* Grid/list toggle — only when there are saves */}
              {recs.length > 0 && canToggle && (
                <button
                  onClick={toggleView}
                  aria-label={isGrid ? 'Switch to list view' : 'Switch to grid view'}
                  style={{
                    background:              'none',
                    border:                  'none',
                    cursor:                  'pointer',
                    padding:                 '4px',
                    display:                 'flex',
                    alignItems:              'center',
                    justifyContent:          'center',
                    color:                   `rgba(${cfg.vividRgb},0.65)`,
                    WebkitTapHighlightColor: 'transparent',
                    transition:              'color 160ms ease',
                    borderRadius:            '6px',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = `rgba(${cfg.vividRgb},1)` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = `rgba(${cfg.vividRgb},0.65)` }}
                >
                  {isGrid ? <ListIcon /> : <GridIcon />}
                </button>
              )}
            </div>
          </div>

          <div style={{
            height:     '0.5px',
            marginTop:  '10px',
            background: `linear-gradient(to right, rgba(${cfg.vividRgb},0.55), transparent)`,
          }} />
        </div>

        {/* Subcategory pills — only when saves exist */}
        {recs.length > 0 && <div style={{
          display:    'flex',
          gap:        '6px',
          padding:    '14px 20px 0',
          flexWrap:   'nowrap',
          overflowX:  'auto',
          // Hide scrollbar but keep scrollable
          msOverflowStyle: 'none',
          scrollbarWidth:  'none',
        } as React.CSSProperties}>
          {nudges.map(n => {
            const on = activeNudge === n
            return (
              <button
                key={n}
                onClick={() => setActiveNudge(n)}
                style={{
                  fontFamily:              'var(--f-ui)',
                  fontSize:                '11px',
                  fontWeight:              700,
                  letterSpacing:           '1.2px',
                  textTransform:           'uppercase',
                  color:                   on
                    ? 'rgba(255,255,255,0.95)'
                    : `rgba(${cfg.vividRgb},0.72)`,
                  background:              on
                    ? `rgba(${cfg.vividRgb},0.28)`
                    : `rgba(${cfg.vividRgb},0.08)`,
                  border:                  `1px solid rgba(${cfg.vividRgb},${on ? '0.65' : '0.22'})`,
                  borderRadius:            '20px',
                  padding:                 '6px 14px',
                  height:                  '30px',
                  cursor:                  'pointer',
                  transition:              'all 140ms ease',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace:              'nowrap',
                  flexShrink:              0,
                  boxShadow:               on ? `0 0 10px rgba(${cfg.vividRgb},0.22)` : 'none',
                }}
              >
                {n}
              </button>
            )
          })}
        </div>}

        {/* Empty state — Taareef's voice + save invitation */}
        {recs.length === 0 && (
          <div style={{
            padding:       '64px 32px 0',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            textAlign:     'center',
          }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontFamily:  'var(--f-display)',
                fontStyle:   'italic',
                fontWeight:  400,
                fontSize:    '21px',
                color:       `rgba(${cfg.vividRgb},0.72)`,
                lineHeight:  1.45,
                marginBottom:'10px',
              }}>
                {emptyCopy.headline}
              </div>
              <div style={{
                fontFamily: 'var(--f-body)',
                fontSize:   '14px',
                fontWeight: 300,
                color:      'rgba(255,255,255,0.32)',
                lineHeight: 1.65,
              }}>
                {emptyCopy.body}
              </div>
            </div>

            <div style={{
              width:      '24px',
              height:     '0.5px',
              background: `rgba(${cfg.vividRgb},0.28)`,
              marginBottom:'28px',
            }} />

            <button
              onClick={() => {
                openCapture()
              }}
              style={{
                width:                   '56px',
                height:                  '56px',
                borderRadius:            '50%',
                background:              `rgba(${cfg.vividRgb},0.10)`,
                border:                  `1px solid rgba(${cfg.vividRgb},0.32)`,
                display:                 'flex',
                alignItems:              'center',
                justifyContent:          'center',
                cursor:                  'pointer',
                transition:              'all 200ms ease',
                WebkitTapHighlightColor: 'transparent',
                boxShadow:               `0 0 20px rgba(${cfg.vividRgb},0.12)`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = `rgba(${cfg.vividRgb},0.20)`
                el.style.boxShadow = `0 0 32px rgba(${cfg.vividRgb},0.28)`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = `rgba(${cfg.vividRgb},0.10)`
                el.style.boxShadow = `0 0 20px rgba(${cfg.vividRgb},0.12)`
              }}
              aria-label={`Save something to ${cfg.label}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <line x1="10" y1="2" x2="10" y2="18" stroke={cfg.vividColor} strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="2" y1="10" x2="18" y2="10" stroke={cfg.vividColor} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <div style={{
              fontFamily:    'var(--f-ui)',
              fontSize:      '9px',
              fontWeight:    700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color:         `rgba(${cfg.vividRgb},0.38)`,
              marginTop:     '10px',
            }}>
              Save the first one
            </div>
          </div>
        )}

        {/* Content */}
        {filtered.length > 0 && isGrid && (
          <div style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1fr',
            // Align all grid cells — uniform gap, uniform padding
            gap:                 '12px',
            padding:             '16px 14px 0',
          }}>
            {filtered.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                variant="grid"
                categoryConfig={cfg}
              />
            ))}
          </div>
        )}

        {filtered.length > 0 && !isGrid && (
          <div style={{ padding: '12px 16px 0' }}>
            {filtered.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                variant="compact"
                categoryConfig={cfg}
              />
            ))}
          </div>
        )}

        {recs.length > 0 && filtered.length === 0 && (
          <div style={{
            padding:   '40px 32px',
            textAlign: 'center',
            fontFamily:'var(--f-body)',
            fontSize:  '13px',
            color:     'rgba(255,255,255,0.28)',
          }}>
            Nothing tagged as {activeNudge.toLowerCase()} yet.
          </div>
        )}

      </div>

      {/* Delete toast */}
      {showDeleteToast && (
        <DeleteToast
          title={showDeleteToast.title}
          recId={showDeleteToast.recId}
          categoryId={cfg.id}
          onDismiss={() => setShowDeleteToast(null)}
        />
      )}

    </>
  )
}

// ── TOGGLE ICONS ──────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="10" y1="4" x2="17" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="1" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="10" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
