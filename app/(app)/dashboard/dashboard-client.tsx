'use client'

// app/(app)/dashboard/dashboard-client.tsx

import { useRouter }       from 'next/navigation'
import { AppShell }        from '@/components/features/navigation/app-shell'
import { useToast }        from '@/components/ui/toast'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { useCallback }     from 'react'
import { CATEGORIES, getCategoryBloom } from '@/constants/categories'
import type { CategoryConfig } from '@/constants/categories'
import type { Recommendation, CreateRecommendationInput } from '@/lib/types'

type TileData = {
  category:   CategoryConfig
  count:      number
  latest:     Recommendation
  hasReacted: boolean
}

type DashboardClientProps = {
  tiles:      TileData[]
  totalSaved: number
  userName:   string
  userEmail:  string
  userId:     string
}

export function DashboardClient({
  tiles,
  totalSaved,
  userName,
}: DashboardClientProps) {
  const router    = useRouter()
  const { toast } = useToast()
  const { create } = useCreateRecommendation()

  const handleSave = useCallback(async (input: CreateRecommendationInput) => {
    await create(
      input,
      undefined,
      () => { toast('Saved ✦', 'success'); router.refresh() },
      (err) => toast(err, 'error'),
    )
  }, [create, toast, router])

  // Build a map of filled tiles for quick lookup
  const filledMap: Record<string, TileData> = {}
  tiles.forEach(t => { filledMap[t.category.id] = t })

  return (
    <AppShell onSaveRecommendation={handleSave}>
      <div style={{ maxWidth: '430px', margin: '0 auto', paddingBottom: '24px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', padding: '44px 0 8px' }}>
          <div style={{
            fontFamily:  'var(--f-display)',
            fontStyle:   'italic',
            fontWeight:  300,
            fontSize:    '54px',
            color:       '#1fce94',
            lineHeight:  1,
            textShadow:  '0 0 40px rgba(31,206,148,0.45), 0 0 100px rgba(31,206,148,0.18)',
          }}>
            taareef
          </div>
          <div style={{
            fontFamily: 'var(--f-body)',
            fontSize:   '11px',
            fontWeight: 300,
            color:      'rgba(240,230,200,0.35)',
            letterSpacing: '0.05em',
            marginTop:  '6px',
          }}>
            {totalSaved === 0
              ? 'your vault is waiting'
              : `${totalSaved} recommendation${totalSaved === 1 ? '' : 's'}, remembered`}
          </div>
        </div>

        {/* Mosaic grid — all 8 categories always visible */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 '9px',
          padding:             '16px 16px 0',
        }}>
          {CATEGORIES.map(cat => {
            const filled = filledMap[cat.id]
            return (
              <MosaicTile
                key={cat.id}
                cat={cat}
                filled={filled}
                onClick={() => router.push(`/dashboard/${cat.id}`)}
              />
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}

// ── MOSAIC TILE ───────────────────────────────────────────────

function MosaicTile({
  cat,
  filled,
  onClick,
}: {
  cat:     CategoryConfig
  filled?: TileData
  onClick: () => void
}) {
  const bloom = getCategoryBloom(cat.id)
  const count = filled?.count ?? 0

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      style={{
        borderRadius: '20px',
        height:       '140px',
        padding:      '14px',
        display:      'flex',
        flexDirection:'column',
        justifyContent: 'space-between',
        overflow:     'hidden',
        position:     'relative',
        cursor:       'pointer',
        background:   bloom,
        // 5px folk spine — left edge in category vivid color
        boxShadow:    `inset 5px 0 0 ${cat.vividColor}`,
        transition:   'transform 150ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.015)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {/* Count badge — neon green, top right */}
      {count > 0 && (
        <div style={{
          position:     'absolute',
          top:          '12px',
          right:        '12px',
          background:   '#1fce94',
          color:        '#080f0a',
          fontFamily:   'var(--f-ui)',
          fontWeight:   700,
          fontSize:     '11px',
          width:        '22px',
          height:       '22px',
          borderRadius: '50%',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
        }}>
          {count > 99 ? '99+' : count}
        </div>
      )}

      {/* Category label — Cormorant italic */}
      <div style={{
        fontFamily:  'var(--f-display)',
        fontStyle:   'italic',
        fontWeight:  400,
        fontSize:    '22px',
        color:       'rgba(242,230,205,0.95)',
        lineHeight:  1.1,
      }}>
        {cat.label}
      </div>

      {/* Bottom — latest item or invitation */}
      <div>
        {count === 0 ? (
          <div style={{
            fontFamily: 'var(--f-body)',
            fontSize:   '10px',
            fontWeight: 300,
            color:      'rgba(242,230,205,0.28)',
            lineHeight: 1.4,
          }}>
            {cat.emptyBody.split(' ').slice(0, 8).join(' ')}…
          </div>
        ) : filled ? (
          <>
            <div style={{
              fontFamily:   'var(--f-title)',
              fontSize:     '12px',
              fontWeight:   600,
              color:        'rgba(242,230,205,0.85)',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '2px',
            }}>
              {filled.latest.title}
            </div>
            <div style={{
              fontFamily: 'var(--f-body)',
              fontSize:   '10px',
              fontWeight: 500,
              color:      '#d41020',
            }}>
              From {filled.latest.source_name}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
