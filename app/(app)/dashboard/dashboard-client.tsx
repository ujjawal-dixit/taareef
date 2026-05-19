'use client'

// app/(app)/dashboard/dashboard-client.tsx
// Fix: category strip sticky positioning.
// The strip must be sticky relative to the page scroll, not a flex container.
// Solution: remove flex from the parent, let the strip be a block element
// with position:sticky top:0. The viewport is the scroll root.

import { useState, useMemo, useCallback, useRef } from 'react'
import { useRouter }              from 'next/navigation'
import { RecommendationCard }     from '@/components/features/cards/recommendation-card'
import { EmptyState }             from '@/components/features/vault/empty-state'
import { AppShell }               from '@/components/features/navigation/app-shell'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { useToast }               from '@/components/ui/toast'
import { CATEGORIES }             from '@/constants/categories'
import type { Recommendation, Category, CreateRecommendationInput } from '@/lib/types'

type Props = {
  recommendations:    Recommendation[]
  userId:             string
  nudgeAnsweredCount: number
  userEmail:          string
  userName:           string
}

export function DashboardClient({ recommendations: serverRecs }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const { create } = useCreateRecommendation()

  const [localRecs,      setLocalRecs]      = useState<Recommendation[]>(serverRecs)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  function scrollToCategory(catId: string) {
    setActiveCategory(catId as Category)
    const el = sectionRefs.current[catId]
    if (el) {
      // Account for sticky strip height (~52px) + some breathing room
      const top = el.getBoundingClientRect().top + window.scrollY - 60
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const handleSave = useCallback(async (input: CreateRecommendationInput) => {
    const tempId = `temp-${Date.now()}`
    const temp: Recommendation = {
      id: tempId, user_id: '', status: 'saved', reaction: null,
      priority: input.priority ?? 'medium', metadata: input.metadata ?? {},
      url: input.url ?? null, image_url: input.image_url ?? null,
      notes: input.notes ?? null, location: input.location ?? null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      ...input,
    }
    setLocalRecs(prev => [temp, ...prev])
    await create(input, undefined,
      (real) => {
        setLocalRecs(prev => prev.map(r => r.id === tempId ? real : r))
        toast('Saved ✦', 'success')
        setTimeout(() => scrollToCategory(real.category), 500)
      },
      (err) => {
        setLocalRecs(prev => prev.filter(r => r.id !== tempId))
        toast(err, 'error')
      }
    )
  }, [create, toast])

  const grouped = useMemo(() => {
    const map: Record<string, Recommendation[]> = {}
    localRecs.forEach(r => {
      if (!map[r.category]) map[r.category] = []
      map[r.category].push(r)
    })
    return map
  }, [localRecs])

  const populatedCategories = CATEGORIES.filter(c => (grouped[c.id]?.length ?? 0) > 0)
  const hasAny = localRecs.length > 0

  return (
    <AppShell onSaveRecommendation={handleSave}>

      {/* ── HEADER ────────────────────────────────────────── */}
      <header style={{ padding: '56px 20px 0', textAlign: 'center' }}>
        <h1 aria-label="taareef" style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    300, fontStyle: 'italic',
          fontSize:      '42px', letterSpacing: '-0.01em',
          lineHeight:    1, color: '#1fce94',
          textShadow:    '0 0 20px rgba(31,206,148,0.65), 0 0 48px rgba(31,206,148,0.28), 0 0 88px rgba(31,206,148,0.10)',
          margin: 0,
        }}>
          taareef
        </h1>
        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '11.5px', fontWeight: 400,
          color: 'rgba(240,230,200,0.50)', letterSpacing: '0.05em', marginTop: '7px',
        }}>
          {localRecs.length === 0 ? 'your vault is ready' : `${localRecs.length} saved`}
        </p>
        <div style={{
          height: '0.5px', margin: '16px auto 0', maxWidth: '160px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.18) 20%, rgba(31,206,148,0.55) 50%, rgba(31,206,148,0.18) 80%, transparent)',
        }} aria-hidden="true" />
      </header>

      {/* ── CATEGORY STRIP ────────────────────────────────── */}
      {/*
        STICKY FIX:
        position:sticky only works when the element is inside a scroll container
        that is the window (or has overflow:auto/scroll).
        The AppShell uses a div with overflowX:hidden — this doesn't prevent
        vertical scroll on window. The sticky should work.
        Key: the strip must NOT be inside a flex column that has height:auto.
        We keep the strip as a direct block child of the scroll document.
      */}
      {hasAny && (
        <div
          role="navigation"
          aria-label="Jump to category"
          style={{
            position:             'sticky',
            top:                  0,
            zIndex:               50,
            background:           'rgba(8,15,10,0.98)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom:         '0.5px solid rgba(240,230,200,0.06)',
            marginTop:            '20px',
          }}
        >
          <div style={{
            display:    'flex',
            gap:        '6px',
            padding:    '10px 14px',
            overflowX:  'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            <style>{`::-webkit-scrollbar { display: none; }`}</style>

            {/* All */}
            <button
              onClick={() => { setActiveCategory(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              aria-pressed={activeCategory === null}
              style={{
                padding:       '7px 14px', borderRadius: '20px', flexShrink: 0,
                border:        `1px solid ${activeCategory === null ? 'rgba(31,206,148,0.55)' : 'rgba(240,230,200,0.12)'}`,
                background:    activeCategory === null ? 'rgba(31,206,148,0.12)' : 'rgba(240,230,200,0.03)',
                fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
                fontSize:      '11px', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color:         activeCategory === null ? '#1fce94' : 'rgba(240,230,200,0.50)',
                cursor:        'pointer', whiteSpace: 'nowrap',
                transition:    'all 180ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              All
            </button>

            {populatedCategories.map(cat => {
              const isActive = activeCategory === cat.id
              const count    = grouped[cat.id]?.length ?? 0
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  aria-pressed={isActive}
                  style={{
                    display:       'flex', alignItems: 'center', gap: '5px',
                    padding:       '7px 14px', borderRadius: '20px', flexShrink: 0,
                    border:        `1px solid ${isActive ? cat.colourHex + '80' : 'rgba(240,230,200,0.12)'}`,
                    background:    isActive ? cat.colourHex + '18' : 'rgba(240,230,200,0.03)',
                    fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
                    fontSize:      '11px', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color:         isActive ? cat.colourHex : 'rgba(240,230,200,0.50)',
                    cursor:        'pointer', whiteSpace: 'nowrap',
                    transition:    'all 180ms ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.label}
                  <span style={{
                    fontSize: '9px', fontWeight: 700,
                    color: isActive ? cat.colourHex : 'rgba(240,230,200,0.28)',
                    transition: 'color 180ms ease',
                  }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── VAULT ─────────────────────────────────────────── */}
      <main aria-label="Your vault" style={{ padding: '0 0 24px' }}>
        {!hasAny ? (
          <div style={{ padding: '0 14px' }}>
            <EmptyState />
          </div>
        ) : (
          CATEGORIES
            .filter(cat => {
              const hasRecs = (grouped[cat.id]?.length ?? 0) > 0
              if (!hasRecs) return false
              if (activeCategory && activeCategory !== cat.id) return false
              return true
            })
            .map(cat => {
              const recs = grouped[cat.id] ?? []
              return (
                <section
                  key={cat.id}
                  ref={el => { sectionRefs.current[cat.id] = el }}
                  aria-label={cat.labelPlural}
                  style={{ marginTop: '28px' }}
                >
                  {/* Room label */}
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: '10px',
                    padding: '0 18px 12px',
                    borderBottom: `0.5px solid ${cat.colourHex}18`,
                    marginBottom: '12px',
                  }}>
                    <h2 style={{
                      fontFamily:    'var(--font-cormorant), Georgia, serif',
                      fontWeight:    400, fontStyle: 'italic',
                      fontSize:      '22px', letterSpacing: '-0.01em',
                      color:         'rgba(240,230,200,0.90)', margin: 0,
                    }}>
                      {cat.label}
                    </h2>
                    <span style={{
                      fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                      fontSize: '11px', color: 'rgba(240,230,200,0.28)',
                    }}>
                      {recs.length}
                    </span>
                    <div style={{
                      flex: 1, height: '0.5px',
                      background: `linear-gradient(to right, ${cat.colourHex}35, transparent)`,
                    }} aria-hidden="true" />
                  </div>

                  {/* Cards */}
                  <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recs.map((rec, i) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        isHero={i === 0 && recs.length >= 2}
                        onClick={() => {
                          if (!rec.id.startsWith('temp-')) router.push(`/rec/${rec.id}`)
                        }}
                      />
                    ))}
                  </div>
                </section>
              )
            })
        )}
      </main>

    </AppShell>
  )
}
