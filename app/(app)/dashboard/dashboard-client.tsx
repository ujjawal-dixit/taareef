'use client'

// app/(app)/dashboard/dashboard-client.tsx
// Interactive dashboard shell.
// Category filter, mixed grid vault, optimistic saves.
// Neon brand name. All design tokens applied directly here.

import { useState, useMemo, useCallback, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryBar }       from '@/components/features/navigation/category-bar'
import { RecommendationCard } from '@/components/features/cards/recommendation-card'
import { EmptyState }         from '@/components/features/vault/empty-state'
import { AppShell }           from '@/components/features/navigation/app-shell'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { useToast }           from '@/components/ui/toast'
import type { Recommendation, Category, CreateRecommendationInput } from '@/lib/types'

type DashboardClientProps = {
  recommendations:    Recommendation[]
  userId:             string
  nudgeAnsweredCount: number
}

export function DashboardClient({
  recommendations: initialRecs,
}: DashboardClientProps) {
  const router  = useRouter()
  const { toast } = useToast()
  const { create }  = useCreateRecommendation()

  const [activeCategory, setActiveCategory]   = useState<Category | null>(null)
  const [isCaptureOpen,  setIsCaptureOpen]     = useState(false)

  // Optimistic UI — card appears instantly on save
  const [optimisticRecs, addOptimistic] = useOptimistic<
    Recommendation[],
    Partial<Recommendation>
  >(
    initialRecs,
    (state, newRec) => [newRec as Recommendation, ...state]
  )

  const filteredRecs = useMemo(() => {
    if (!activeCategory) return optimisticRecs
    return optimisticRecs.filter(r => r.category === activeCategory)
  }, [optimisticRecs, activeCategory])

  const handleSave = useCallback(async (input: CreateRecommendationInput) => {
    // Optimistic add — card appears before network call
    const temp: Partial<Recommendation> = {
      id:          `temp-${Date.now()}`,
      status:      'saved',
      reaction:    null,
      priority:    'medium',
      metadata:    {},
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
      ...input,
    }

    addOptimistic(temp)

    await create(
      input,
      undefined,
      () => {
        toast('Saved ✦', 'success')
        router.refresh()
      },
      (err) => {
        toast(err, 'error')
      }
    )
  }, [create, addOptimistic, toast, router])

  const recCount = optimisticRecs.length
  const hasRecs  = recCount > 0
  const hasFiltered = filteredRecs.length > 0

  return (
    <AppShell onSaveRecommendation={handleSave}>

      {/* Header */}
      <header style={{ padding: '52px 20px 10px' }}>
        {/* Brand name — neon green, WKW shopfront glow */}
        {/* Von Restorff: single saturated element in desaturated field */}
        <span
          className="brand-name"
          aria-label="taareef"
        >
          taareef
        </span>

        <span className="brand-sub">
          {recCount === 0
            ? 'Your vault is ready'
            : `${recCount} recommendation${recCount === 1 ? '' : 's'}`
          }
        </span>
      </header>

      {/* Hairline — neon, left to right fade */}
      <div className="hairline" style={{ margin: '0 20px' }} />

      {/* Category grid — 5×2, all 10 visible, no scroll */}
      {/* Sticky so it stays visible while scrolling the vault */}
      <div
        style={{
          position:          'sticky',
          top:               0,
          zIndex:            20,
          background:        'rgba(8,15,10,0.94)',
          backdropFilter:    'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom:      '0.5px solid rgba(240,230,200,0.07)',
        }}
      >
        <CategoryBar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Vault */}
      <div style={{ padding: '12px 16px 0' }}>

        {!hasRecs ? (
          <EmptyState onAdd={() => setIsCaptureOpen(true)} />
        ) : !hasFiltered ? (
          <EmptyState
            category={activeCategory ?? undefined}
            onAdd={() => setIsCaptureOpen(true)}
          />
        ) : (
          <VaultGrid
            recommendations={filteredRecs}
            onCardClick={id => router.push(`/rec/${id}`)}
          />
        )}

      </div>

    </AppShell>
  )
}

// ── VAULT GRID ────────────────────────────────────────────────────
// Mixed layout: hero card full-width, rest in column.
// Hero is taller — draws the eye. Subsequent cards are standard height.

type VaultGridProps = {
  recommendations: Recommendation[]
  onCardClick:     (id: string) => void
}

function VaultGrid({ recommendations, onCardClick }: VaultGridProps) {
  const [hero, ...rest] = recommendations

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '10px',
      }}
    >
      {hero && (
        <div onClick={() => onCardClick(hero.id)} style={{ cursor: 'pointer' }}>
          <RecommendationCard recommendation={hero} isHero />
        </div>
      )}
      {rest.map(rec => (
        <div
          key={rec.id}
          onClick={() => onCardClick(rec.id)}
          style={{ cursor: 'pointer' }}
        >
          <RecommendationCard recommendation={rec} />
        </div>
      ))}
    </div>
  )
}
