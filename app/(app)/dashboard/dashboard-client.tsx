// app/(app)/dashboard/dashboard-client.tsx
// Interactive dashboard — category bar, mixed grid vault, nudge question.
// Mixed grid: first card full width (hero), rest in single column.
// Adaptive: shows all categories in bar, vault only shows saved ones.

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryBar } from '@/components/features/navigation/category-bar'
import { RecommendationCard } from '@/components/features/cards/recommendation-card'
import { EmptyState } from '@/components/features/vault/empty-state'
import { NudgeQuestionCard } from '@/components/features/vault/nudge-question'
import { getNudgeQuestion } from '@/constants/nudge-questions'
import type { Recommendation, Category } from '@/lib/types'

type DashboardClientProps = {
  recommendations: Recommendation[]
  userId: string
  nudgeAnsweredCount: number
}

export function DashboardClient({
  recommendations,
  nudgeAnsweredCount,
}: DashboardClientProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [localNudgeCount, setLocalNudgeCount] = useState(nudgeAnsweredCount)

  const currentNudge = getNudgeQuestion(localNudgeCount)

  const filteredRecs = useMemo(() => {
    if (!activeCategory) return recommendations
    return recommendations.filter(r => r.category === activeCategory)
  }, [recommendations, activeCategory])

  async function handleNudgeAnswer(questionId: string, value: string) {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          value,
          nudgeAnsweredCount: localNudgeCount + 1,
        }),
      })

      if (!response.ok) throw new Error('Failed to save preference')
      setLocalNudgeCount(prev => prev + 1)
    } catch (err) {
      console.error('[Dashboard] Failed to save nudge answer:', err)
      // Silent fail — nudge is never critical to the experience
    }
  }

  function handleCardClick(id: string) {
    router.push(`/rec/${id}`)
  }

  const hasAnyRecs = recommendations.length > 0
  const hasFilteredRecs = filteredRecs.length > 0

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* Header */}
      <header className="pt-14 px-5 pb-2">
        <h1 className="font-display text-display text-neutral-900 tracking-tight">
          Taareef
        </h1>
        <p className="font-sans text-meta text-neutral-400 mt-1">
          {recommendations.length === 0
            ? 'Your vault is ready'
            : `${recommendations.length} recommendation${recommendations.length === 1 ? '' : 's'}`
          }
        </p>
      </header>

      {/* Category bar — sticky, always shows all 10 */}
      <div className="sticky top-0 z-20 bg-neutral-50/90 backdrop-blur-md border-b border-surface-border">
        <CategoryBar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Main content */}
      <div className="pb-fab">

        {/* Nudge question — appears on every visit until all answered */}
        {hasAnyRecs && currentNudge && (
          <div className="pt-4">
            <NudgeQuestionCard
              question={currentNudge}
              onAnswer={handleNudgeAnswer}
            />
          </div>
        )}

        {/* Vault */}
        {!hasAnyRecs ? (
          <EmptyState />
        ) : !hasFilteredRecs ? (
          <EmptyState category={activeCategory ?? undefined} />
        ) : (
          <MixedGrid
            recommendations={filteredRecs}
            onCardClick={handleCardClick}
          />
        )}

      </div>
    </div>
  )
}

// ============================================================
// MIXED GRID
// First card — full width, isHero (taller image)
// Remaining — single column, standard size
// ============================================================

type MixedGridProps = {
  recommendations: Recommendation[]
  onCardClick: (id: string) => void
}

function MixedGrid({ recommendations, onCardClick }: MixedGridProps) {
  const [hero, ...rest] = recommendations

  return (
    <div className="px-4 pt-4 flex flex-col gap-3">

      {/* Hero card — full width */}
      {hero && (
        <RecommendationCard
          recommendation={hero}
          onClick={() => onCardClick(hero.id)}
          isHero
        />
      )}

      {/* Remaining cards */}
      {rest.map(rec => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onClick={() => onCardClick(rec.id)}
        />
      ))}

    </div>
  )
}
