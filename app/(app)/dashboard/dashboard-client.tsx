'use client'

// app/(app)/dashboard/dashboard-client.tsx
//
// LAYOUT PHILOSOPHY:
// The vault is not a flat list. It is a series of rooms.
// Each category is a room. Cards stack inside it.
// You scroll through Film's room, then Music's room, then Food's room.
// The category label is the doorframe — ambient, architectural.
// 
// The sticky category strip at top is for navigation only —
// tapping a category scrolls to that room.
// 
// WKW LIGHT:
// Cards don't sit in a void. They have internal atmosphere.
// The image zone has a light source — a radial gradient from
// a specific corner, in the category's dominant colour.
// This is the half-open-door light from Chungking Express.

import { useState, useMemo, useCallback, useRef } from 'react'
import { useRouter }              from 'next/navigation'
import { RecommendationCard }     from '@/components/features/cards/recommendation-card'
import { EmptyState }             from '@/components/features/vault/empty-state'
import { AppShell }               from '@/components/features/navigation/app-shell'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { useToast }               from '@/components/ui/toast'
import { CATEGORIES, getCategoryConfig } from '@/constants/categories'
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

  // Refs for scrolling to category sections
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  function scrollToCategory(catId: string) {
    const el = sectionRefs.current[catId]
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top, behavior: 'smooth' })
    }
    setActiveCategory(catId as Category)
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
        // Scroll to the category this was saved in
        setTimeout(() => scrollToCategory(real.category), 400)
      },
      (err) => {
        setLocalRecs(prev => prev.filter(r => r.id !== tempId))
        toast(err, 'error')
      }
    )
  }, [create, toast])

  // Group recommendations by category, in category display order
  const grouped = useMemo(() => {
    const map: Record<string, Recommendation[]> = {}
    localRecs.forEach(r => {
      if (!map[r.category]) map[r.category] = []
      map[r.category].push(r)
    })
    return map
  }, [localRecs])

  // Categories that have at least one save — in display order
  const activeCategories = CATEGORIES.filter(c => (grouped[c.id]?.length ?? 0) > 0)
  const hasAnything = localRecs.length > 0

  return (
    <AppShell onSaveRecommendation={handleSave}>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <header style={{ padding: '56px 20px 0', textAlign: 'center' }}>
        <h1 aria-label="taareef" style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    300, fontStyle: 'italic',
          fontSize:      '42px', letterSpacing: '-0.01em',
          lineHeight:    1, color: '#1fce94',
          textShadow:    '0 0 20px rgba(31,206,148,0.65), 0 0 48px rgba(31,206,148,0.28), 0 0 88px rgba(31,206,148,0.10)',
          margin:        0,
        }}>
          taareef
        </h1>
        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '11.5px', fontWeight: 400,
          color: 'rgba(240,230,200,0.50)', letterSpacing: '0.05em', marginTop: '7px',
        }}>
          {localRecs.length === 0
            ? 'your vault is ready'
            : `${localRecs.length} saved`}
        </p>
        {/* Symmetric hairline */}
        <div style={{
          height: '0.5px', margin: '16px auto 0', maxWidth: '160px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.18) 20%, rgba(31,206,148,0.55) 50%, rgba(31,206,148,0.18) 80%, transparent)',
        }} aria-hidden="true" />
      </header>

      {/* ── CATEGORY STRIP ────────────────────────────────────── */}
      {/* Horizontal scroll. Only shows categories with saves.    */}
      {/* Tapping scrolls to that room in the vault.             */}
      {hasAnything && (
        <nav
          aria-label="Jump to category"
          style={{
            position:             'sticky',
            top:                  0,
            zIndex:               20,
            background:           'rgba(8,15,10,0.97)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom:         '0.5px solid rgba(240,230,200,0.06)',
            marginTop:            '20px',
            overflowX:            'auto',
            scrollbarWidth:       'none',
            // Hide webkit scrollbar
          }}
        >
          <style>{`::-webkit-scrollbar { display: none; }`}</style>
          <div style={{
            display:        'flex',
            gap:            '6px',
            padding:        '10px 16px',
            width:          'max-content',
            minWidth:       '100%',
          }}>
            {/* All button */}
            <button
              onClick={() => {
                setActiveCategory(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              aria-pressed={activeCategory === null}
              style={{
                padding:       '7px 14px',
                borderRadius:  '20px',
                border:        `1px solid ${activeCategory === null ? 'rgba(31,206,148,0.55)' : 'rgba(240,230,200,0.10)'}`,
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

            {activeCategories.map(cat => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  aria-pressed={isActive}
                  style={{
                    padding:       '7px 14px',
                    borderRadius:  '20px',
                    border:        `1px solid ${isActive ? cat.colourHex + '80' : 'rgba(240,230,200,0.10)'}`,
                    background:    isActive ? cat.colourHex + '18' : 'rgba(240,230,200,0.03)',
                    fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
                    fontSize:      '11px', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color:         isActive ? cat.colourHex : 'rgba(240,230,200,0.50)',
                    cursor:        'pointer', whiteSpace: 'nowrap',
                    transition:    'all 180ms ease',
                    WebkitTapHighlightColor: 'transparent',
                    // Count badge
                    display:       'flex',
                    alignItems:    'center',
                    gap:           '5px',
                  }}
                >
                  {cat.label}
                  <span style={{
                    fontSize:      '9px',
                    color:         isActive ? cat.colourHex : 'rgba(240,230,200,0.28)',
                    fontWeight:    700,
                    transition:    'color 180ms ease',
                  }}>
                    {grouped[cat.id]?.length ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* ── VAULT ─────────────────────────────────────────────── */}
      {/* Rooms pattern: each category is a section.              */}
      {/* The section header is the doorframe.                    */}
      {/* Cards stack beneath it, breathing with 14px padding.   */}
      <main
        aria-label="Your vault"
        style={{ padding: '0 0 24px' }}
      >
        {!hasAnything ? (
          <div style={{ padding: '0 14px' }}>
            <EmptyState />
          </div>
        ) : (
          // Filter: show all rooms, or just the active one
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
                  {/* Room label — the doorframe */}
                  <div style={{
                    display:       'flex',
                    alignItems:    'baseline',
                    gap:           '10px',
                    padding:       '0 18px 12px',
                    borderBottom:  `0.5px solid ${cat.colourHex}18`,
                    marginBottom:  '12px',
                  }}>
                    <h2 style={{
                      fontFamily:    'var(--font-cormorant), Georgia, serif',
                      fontWeight:    400,
                      fontStyle:     'italic',
                      fontSize:      '22px',
                      letterSpacing: '-0.01em',
                      color:         'rgba(240,230,200,0.90)',
                      margin:        0,
                    }}>
                      {cat.label}
                    </h2>
                    {/* Count — small, subordinate */}
                    <span style={{
                      fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
                      fontSize:      '11px',
                      fontWeight:    400,
                      color:         'rgba(240,230,200,0.28)',
                    }}>
                      {recs.length}
                    </span>
                    {/* Colour line — traces the room's identity */}
                    <div style={{
                      flex:        1,
                      height:      '0.5px',
                      background:  `linear-gradient(to right, ${cat.colourHex}35, transparent)`,
                      marginLeft:  '4px',
                    }} aria-hidden="true" />
                  </div>

                  {/* Cards in this room */}
                  <div style={{
                    padding: '0 14px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                  }}>
                    {recs.map((rec, i) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        isHero={i === 0 && recs.length >= 2}
                        onClick={() => {
                          if (!rec.id.startsWith('temp-')) {
                            router.push(`/rec/${rec.id}`)
                          }
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
