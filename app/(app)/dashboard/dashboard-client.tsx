// app/(app)/dashboard/dashboard-client.tsx
// The vault home — Friday evening screen.
// Wong Kar-wai warmth throughout — inline styles for reliability.
// Adaptive: category bar always shows all 10, vault shows only saved.

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryBar } from '@/components/features/navigation/category-bar'
import { RecommendationCard } from '@/components/features/cards/recommendation-card'
import { EmptyState } from '@/components/features/vault/empty-state'
import { NudgeQuestionCard } from '@/components/features/vault/nudge-question'
import { getNudgeQuestion } from '@/constants/nudge-questions'
import type { Recommendation, Category } from '@/lib/types'

type Props = {
  recommendations:   Recommendation[]
  userId:            string
  nudgeAnsweredCount: number
}

export function DashboardClient({
  recommendations,
  nudgeAnsweredCount,
}: Props) {
  const router = useRouter()
  const [activeCategory, setActiveCategory]   = useState<Category | null>(null)
  const [localNudgeCount, setLocalNudgeCount] = useState(nudgeAnsweredCount)

  const currentNudge = getNudgeQuestion(localNudgeCount)

  const filteredRecs = useMemo(() => {
    if (!activeCategory) return recommendations
    return recommendations.filter(r => r.category === activeCategory)
  }, [recommendations, activeCategory])

  async function handleNudgeAnswer(questionId: string, value: string) {
    try {
      await fetch('/api/user/preferences', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ questionId, value, nudgeAnsweredCount: localNudgeCount + 1 }),
      })
      setLocalNudgeCount(prev => prev + 1)
    } catch (err) {
      console.error('[Dashboard] nudge answer failed:', err)
      // Silent fail — nudge is never critical
    }
  }

  const hasAnyRecs     = recommendations.length > 0
  const hasFiltered    = filteredRecs.length > 0

  return (
    // app-container enforces 480px max-width, centred
    <div className="app-container">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{ padding: '56px 20px 8px' }}>
        <h1 style={{
          fontFamily:    'var(--font-fraunces), Georgia, serif',
          fontSize:      '36px',
          fontWeight:    '700',
          letterSpacing: '-0.025em',
          lineHeight:    '1.1',
          color:         'var(--text-primary)',
          margin:        '0 0 4px',
        }}>
          Taareef
        </h1>
        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '13px',
          color:      'var(--text-tertiary)',
          margin:     0,
        }}>
          {recommendations.length === 0
            ? 'Your vault is ready'
            : `${recommendations.length} recommendation${recommendations.length === 1 ? '' : 's'}`
          }
        </p>
      </header>

      {/* ── CATEGORY BAR — sticky ──────────────────────────── */}
      <div style={{
        position:        'sticky',
        top:             0,
        zIndex:          20,
        backgroundColor: 'rgba(250,248,245,0.92)',
        backdropFilter:  'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom:    '0.5px solid rgba(30,28,26,0.08)',
      }}>
        <CategoryBar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <div className="pb-fab" style={{ paddingTop: '8px' }}>

        {/* Nudge question */}
        {hasAnyRecs && currentNudge && (
          <NudgeQuestionCard
            question={currentNudge}
            onAnswer={handleNudgeAnswer}
          />
        )}

        {/* Vault */}
        {!hasAnyRecs ? (
          <EmptyState />
        ) : !hasFiltered ? (
          <EmptyState category={activeCategory ?? undefined} />
        ) : (
          <MixedGrid
            recommendations={filteredRecs}
            onCardClick={id => router.push(`/rec/${id}`)}
          />
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MIXED GRID
// Hero card full width, remaining in column
// ─────────────────────────────────────────────────────────────

function MixedGrid({
  recommendations,
  onCardClick,
}: {
  recommendations: Recommendation[]
  onCardClick:     (id: string) => void
}) {
  const [hero, ...rest] = recommendations

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {hero && (
        <RecommendationCard
          recommendation={hero}
          onClick={() => onCardClick(hero.id)}
          isHero
        />
      )}
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
