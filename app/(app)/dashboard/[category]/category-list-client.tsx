'use client'

// app/(app)/dashboard/[category]/category-list-client.tsx
// Subcategory filter pills + compact card rows.
// Optimistic saves — card appears instantly.

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/features/navigation/app-shell'
import { useToast } from '@/components/ui/toast'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { RecommendationCard } from '@/components/features/cards/recommendation-card'
import type { Recommendation, CreateRecommendationInput } from '@/lib/types'
import type { CategoryConfig } from '@/constants/categories'

type Props = {
  recommendations: Recommendation[]
  categoryConfig: CategoryConfig
}

export function CategoryListClient({ recommendations: serverRecs, categoryConfig: cfg }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { create } = useCreateRecommendation()
  const [recs, setRecs] = useState<Recommendation[]>(serverRecs)
  const [activeNudge, setActiveNudge] = useState<string>('All')

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
    if (input.category === cfg.id) setRecs(prev => [temp, ...prev])
    await create(input, undefined,
      (real) => { setRecs(prev => prev.map(r => r.id === tempId ? real : r)); toast('Saved ✦', 'success') },
      (err)  => { setRecs(prev => prev.filter(r => r.id !== tempId)); toast(err, 'error') }
    )
  }, [create, toast, cfg.id])

  const nudges = ['All', ...cfg.nudges]

  return (
    <AppShell onSaveRecommendation={handleSave}>
      <div style={{ maxWidth: '430px', margin: '0 auto', paddingBottom: '88px' }}>

        {/* Header */}
        <header style={{ padding: '52px 20px 0' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              color: '#1fce94', fontFamily: 'var(--f-body)',
              fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em',
              textShadow: '0 0 10px rgba(31,206,148,0.40)',
              minHeight: '44px', marginBottom: '4px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            vault
          </button>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h1 style={{
              fontFamily: 'var(--f-display)', fontWeight: 400, fontStyle: 'italic',
              fontSize: '36px', color: 'rgba(255,255,255,0.95)', margin: 0,
              textShadow: `0 0 20px rgba(${cfg.vividRgb},0.30)`,
            }}>
              {cfg.label}
            </h1>
            <span style={{ fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.28)' }}>
              {recs.length}
            </span>
          </div>
          <div style={{ height: '0.5px', marginTop: '10px', background: `linear-gradient(to right,rgba(${cfg.vividRgb},0.50),transparent)` }} />
        </header>

        {/* Subcategory nudge pills */}
        <div style={{ display: 'flex', gap: '6px', padding: '14px 20px 0', flexWrap: 'wrap' }}>
          {nudges.map(n => {
            const on = activeNudge === n
            return (
              <button
                key={n}
                onClick={() => setActiveNudge(n)}
                style={{
                  fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: on ? 'rgba(255,255,255,0.90)' : `rgba(${cfg.vividRgb},0.70)`,
                  background: on ? `rgba(${cfg.vividRgb},0.20)` : `rgba(${cfg.vividRgb},0.08)`,
                  border: `0.5px solid rgba(${cfg.vividRgb},${on ? '0.55' : '0.22'})`,
                  borderRadius: '20px', padding: '5px 12px',
                  cursor: 'pointer', transition: 'all 140ms ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {n}
              </button>
            )
          })}
        </div>

        {/* Empty state */}
        {recs.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '64px 32px',
            fontFamily: 'var(--f-display)', fontStyle: 'italic',
            fontSize: '22px', color: 'rgba(255,255,255,0.30)',
          }}>
            {cfg.emptyHeadline}
          </div>
        )}

        {/* List */}
        <div style={{ padding: '16px 20px 0' }}>
          {recs.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} variant="compact" />
          ))}
        </div>

      </div>
    </AppShell>
  )
}
