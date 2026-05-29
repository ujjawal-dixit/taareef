'use client'

// app/(app)/dashboard/[category]/category-list-client.tsx
// Back nav: full-width neon pill — consistent with profile page.
// Subcategory filter pills. Compact rows at 56px height.
// Optimistic saves.

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
      (real) => {
        setRecs(prev => prev.map(r => r.id === tempId ? real : r))
        toast('Saved ✦', 'success')
      },
      (err) => {
        setRecs(prev => prev.filter(r => r.id !== tempId))
        toast(err, 'error')
      }
    )
  }, [create, toast, cfg.id])

  const nudges = ['All', ...cfg.nudges]

  return (
    <AppShell onSaveRecommendation={handleSave}>
      <div style={{ maxWidth: '430px', margin: '0 auto', paddingBottom: '100px' }}>

        {/* Back nav — full-width neon pill */}
        <div style={{ padding: '48px 16px 0' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '50px',
              borderRadius: '14px',
              border: '1px solid rgba(31,206,148,0.38)',
              background: 'rgba(31,206,148,0.06)',
              fontFamily: 'var(--f-ui)',
              fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#1fce94',
              textDecoration: 'none',
              textShadow: '0 0 12px rgba(31,206,148,0.45)',
              boxShadow: '0 0 24px rgba(31,206,148,0.08)',
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

        {/* Category header */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h1 style={{
              fontFamily: 'var(--f-display)', fontWeight: 400, fontStyle: 'italic',
              fontSize: '36px', color: 'rgba(255,255,255,0.95)', margin: 0,
              textShadow: `0 0 24px rgba(${cfg.vividRgb},0.28)`,
            }}>
              {cfg.label}
            </h1>
            <span style={{
              fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 300,
              color: 'rgba(255,255,255,0.28)',
            }}>
              {recs.length}
            </span>
          </div>
          <div style={{
            height: '0.5px', marginTop: '10px',
            background: `linear-gradient(to right, rgba(${cfg.vividRgb},0.55), transparent)`,
          }} />
        </div>

        {/* Subcategory filter pills */}
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
                  color: on ? 'rgba(255,255,255,0.92)' : `rgba(${cfg.vividRgb},0.72)`,
                  background: on ? `rgba(${cfg.vividRgb},0.22)` : `rgba(${cfg.vividRgb},0.08)`,
                  border: `0.5px solid rgba(${cfg.vividRgb},${on ? '0.58' : '0.24'})`,
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
            fontSize: '22px', color: 'rgba(255,255,255,0.28)',
          }}>
            {cfg.emptyHeadline}
          </div>
        )}

        {/* Compact list */}
        <div style={{ padding: '12px 20px 0' }}>
          {recs.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} variant="compact" />
          ))}
        </div>

      </div>
    </AppShell>
  )
}
