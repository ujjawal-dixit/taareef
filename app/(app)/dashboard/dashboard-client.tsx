'use client'

// app/(app)/dashboard/dashboard-client.tsx
// Adds FeedbackCard to the vault — appears after 3+ saves for beta users.
// Dismissal stored in localStorage so it never reappears.

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter }          from 'next/navigation'
import { CategoryBar }        from '@/components/features/navigation/category-bar'
import { RecommendationCard } from '@/components/features/cards/recommendation-card'
import { EmptyState }         from '@/components/features/vault/empty-state'
import { AppShell }           from '@/components/features/navigation/app-shell'
import { FeedbackCard }       from '@/components/features/feedback/feedback-card'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { useToast }           from '@/components/ui/toast'
import type { Recommendation, Category, CreateRecommendationInput } from '@/lib/types'

type Props = {
  recommendations:    Recommendation[]
  userId:             string
  nudgeAnsweredCount: number
  userEmail:          string
  userName:           string
}

export function DashboardClient({ recommendations: serverRecs, userEmail, userName }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const { create } = useCreateRecommendation()

  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [localRecs,      setLocalRecs]      = useState<Recommendation[]>(serverRecs)
  const [showFeedback,   setShowFeedback]   = useState(false)

  // Show feedback card after 3 saves, once per user, for beta
  useEffect(() => {
    const dismissed = localStorage.getItem('taareef_feedback_dismissed')
    if (!dismissed && localRecs.length >= 3) {
      setShowFeedback(true)
    }
  }, [localRecs.length])

  function dismissFeedback() {
    localStorage.setItem('taareef_feedback_dismissed', 'true')
    setShowFeedback(false)
  }

  const filtered = useMemo(() => {
    if (!activeCategory) return localRecs
    return localRecs.filter(r => r.category === activeCategory)
  }, [localRecs, activeCategory])

  const handleSave = useCallback(async (input: CreateRecommendationInput) => {
    const tempId = `temp-${Date.now()}`
    const tempRec: Recommendation = {
      id: tempId, user_id: '', status: 'saved', reaction: null,
      priority: input.priority ?? 'medium', metadata: input.metadata ?? {},
      url: input.url ?? null, image_url: input.image_url ?? null,
      notes: input.notes ?? null, location: input.location ?? null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      ...input,
    }
    setLocalRecs(prev => [tempRec, ...prev])
    await create(input, undefined,
      (real) => {
        setLocalRecs(prev => prev.map(r => r.id === tempId ? real : r))
        toast('Saved ✦', 'success')
      },
      (err) => {
        setLocalRecs(prev => prev.filter(r => r.id !== tempId))
        toast(err, 'error')
      }
    )
  }, [create, toast])

  // Top source name for feedback card context
  const topSource = useMemo(() => {
    const counts: Record<string, number> = {}
    localRecs.forEach(r => { counts[r.source_name] = (counts[r.source_name] ?? 0) + 1 })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? null
  }, [localRecs])

  const count   = localRecs.length
  const hasRecs = count > 0
  const hasFilt = filtered.length > 0

  return (
    <AppShell onSaveRecommendation={handleSave}>

      {/* Header */}
      <header style={{ padding: '56px 20px 0', textAlign: 'center' }}>
        <h1 aria-label="taareef" style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    300, fontStyle: 'italic',
          fontSize:      '42px', letterSpacing: '-0.01em',
          lineHeight:    1, color: '#1fce94',
          textShadow:    '0 0 20px rgba(31,206,148,0.60), 0 0 48px rgba(31,206,148,0.25), 0 0 88px rgba(31,206,148,0.10)',
          margin:        0,
        }}>
          taareef
        </h1>
        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '11.5px', fontWeight: 400,
          color:      'rgba(240,230,200,0.50)',
          letterSpacing: '0.05em', marginTop: '7px',
        }}>
          {count === 0 ? 'your vault is ready' : `${count} recommendation${count === 1 ? '' : 's'}`}
        </p>
        {/* Symmetric hairline */}
        <div style={{
          height: '0.5px', margin: '16px auto 0', maxWidth: '160px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.18) 20%, rgba(31,206,148,0.55) 50%, rgba(31,206,148,0.18) 80%, transparent)',
        }} aria-hidden="true" />
      </header>

      {/* Sticky category grid */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(8,15,10,0.96)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(240,230,200,0.06)',
        marginTop: '20px',
      }}>
        <CategoryBar
          activeCategory={activeCategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>

      {/* Vault */}
      <section aria-label="Saved recommendations" style={{ padding: '14px 14px 0' }}>

        {/* Feedback card — appears at top of vault after 3 saves */}
        {showFeedback && !activeCategory && (
          <FeedbackCard
            userEmail={userEmail}
            userName={userName}
            saveCount={count}
            topSource={topSource}
            onDismiss={dismissFeedback}
          />
        )}

        {!hasRecs ? (
          <EmptyState />
        ) : !hasFilt ? (
          <EmptyState category={activeCategory ?? undefined} />
        ) : (
          <VaultGrid
            recommendations={filtered}
            onCardClick={id => { if (!id.startsWith('temp-')) router.push(`/rec/${id}`) }}
          />
        )}
      </section>

    </AppShell>
  )
}

function VaultGrid({ recommendations, onCardClick }: {
  recommendations: Recommendation[]
  onCardClick:     (id: string) => void
}) {
  const [hero, ...rest] = recommendations
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {hero && <RecommendationCard recommendation={hero} isHero onClick={() => onCardClick(hero.id)} />}
      {rest.map(rec => (
        <RecommendationCard key={rec.id} recommendation={rec} onClick={() => onCardClick(rec.id)} />
      ))}
    </div>
  )
}
