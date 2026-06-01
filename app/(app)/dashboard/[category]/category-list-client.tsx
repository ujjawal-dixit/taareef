'use client'

// app/(app)/dashboard/[category]/category-list-client.tsx
// Session 9 redesign:
// - Count on far right of header, opposite category name — shows even at 0
// - Subcategory pills: 11px, 28px height, filled on selection
// - Count updates when filter is active
// - Empty state: warm copy + + button (no invitation card)
// - Watch/Listen → poster grid (2 col)
// - Read/Dine/Do/Visit → compact list rows
// - Full-width neon pill back nav consistent

import { useState, useCallback } from 'react'
import { useRouter }             from 'next/navigation'
import Link                      from 'next/link'
import { AppShell }              from '@/components/features/navigation/app-shell'
import { useToast }              from '@/components/ui/toast'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { RecommendationCard }    from '@/components/features/cards/recommendation-card'
import type { Recommendation, CreateRecommendationInput } from '@/lib/types'
import type { CategoryConfig }   from '@/constants/categories'

type Props = {
  recommendations: Recommendation[]
  categoryConfig:  CategoryConfig
}

// Categories that show poster grid
const GRID_CATEGORIES = new Set(['watch', 'listen'])

export function CategoryListClient({ recommendations: serverRecs, categoryConfig: cfg }: Props) {
  const router     = useRouter()
  const { toast }  = useToast()
  const { create } = useCreateRecommendation()
  const [recs,        setRecs]        = useState<Recommendation[]>(serverRecs)
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

  // Filter by active nudge (subcategory)
  const filtered = activeNudge === 'All'
    ? recs
    : recs.filter(r => {
        const meta = r.metadata as Record<string, unknown>
        const sub  = typeof meta.subtype === 'string' ? meta.subtype : ''
        return sub.toLowerCase() === activeNudge.toLowerCase()
      })

  const showGrid = GRID_CATEGORIES.has(cfg.id)

  return (
    <AppShell onSaveRecommendation={handleSave}>
      <div style={{ maxWidth: '430px', margin: '0 auto', paddingBottom: '100px' }}>

        {/* Back nav — full-width neon pill */}
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

        {/* Category header — name left, count right */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{
            display:        'flex',
            alignItems:     'baseline',
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
            {/* Count far right — always shown including 0 */}
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
          </div>
          <div style={{
            height:     '0.5px',
            marginTop:  '10px',
            background: `linear-gradient(to right, rgba(${cfg.vividRgb},0.55), transparent)`,
          }} />
        </div>

        {/* Subcategory filter pills — always shown */}
        <div style={{ display: 'flex', gap: '6px', padding: '14px 20px 0', flexWrap: 'nowrap', overflowX: 'auto' }}>
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
        </div>

        {/* Empty state */}
        {recs.length === 0 && (
          <div style={{
            padding:       '64px 32px',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '20px',
          }}>
            <p style={{
              fontFamily: 'var(--f-body)',
              fontSize:   '14px',
              fontWeight: 400,
              color:      'rgba(255,255,255,0.38)',
              textAlign:  'center',
              lineHeight: 1.6,
              margin:     0,
            }}>
              Recommendations are scattered everywhere.
              <br />
              Save them all in one place.
            </p>
          </div>
        )}

        {/* Content — grid for Watch/Listen, rows for others */}
        {filtered.length > 0 && showGrid ? (
          <div style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1fr',
            gap:                 '10px',
            padding:             '16px 14px 0',
          }}>
            {filtered.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                variant="grid"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ padding: '12px 16px 0' }}>
            {filtered.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                variant="compact"
              />
            ))}
          </div>
        ) : recs.length > 0 && filtered.length === 0 ? (
          // Filtered to 0 — no results for subcategory
          <div style={{
            padding:   '40px 32px',
            textAlign: 'center',
            fontFamily:'var(--f-body)',
            fontSize:  '13px',
            color:     'rgba(255,255,255,0.28)',
          }}>
            Nothing tagged as {activeNudge.toLowerCase()} yet.
          </div>
        ) : null}

      </div>
    </AppShell>
  )
}
