'use client'

//app/(app)/dashboard/[category]/category-list-client.tsx

import { useState, useCallback } from 'react'
import { useRouter }             from 'next/navigation'
import { useToast }              from '@/components/ui/toast'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { AppShell }              from '@/components/features/navigation/app-shell'
import type { Recommendation, CreateRecommendationInput } from '@/lib/types'
import type { CategoryConfig }   from '@/constants/categories'

type Props = {
  recommendations: Recommendation[]
  categoryConfig:  CategoryConfig
}

export function CategoryListClient({ recommendations: serverRecs, categoryConfig: cfg }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const { create } = useCreateRecommendation()
  const [recs, setRecs] = useState<Recommendation[]>(serverRecs)

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

  return (
    <AppShell onSaveRecommendation={handleSave}>
      <div style={{ maxWidth:'430px', margin:'0 auto', paddingBottom:'24px' }}>

        <header style={{ padding:'52px 18px 0' }}>
          <button
            onClick={() => router.push('/dashboard')}
            aria-label="Back to vault"
            style={{
              display:'flex', alignItems:'center', gap:'5px',
              color:'#1fce94', fontFamily:'var(--f-body)',
              fontSize:'12px', fontWeight:500, letterSpacing:'0.04em',
              textShadow:'0 0 10px rgba(31,206,148,0.40)',
              minHeight:'44px', marginBottom:'4px',
              WebkitTapHighlightColor:'transparent',
              background:'none', border:'none', cursor:'pointer', padding:0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            vault
          </button>

          <div style={{ display:'flex', alignItems:'baseline', gap:'10px' }}>
            <h1 style={{
              fontFamily:  'var(--f-display)',
              fontWeight:  400, fontStyle: 'italic',
              fontSize:    '28px', letterSpacing: '-0.01em',
              color:       'rgba(240,230,200,0.95)', margin: 0,
            }}>
              {cfg.label}
            </h1>
            <span style={{
              fontFamily: 'var(--f-body)',
              fontSize:   '12px', color: 'rgba(240,230,200,0.30)',
            }}>
              {recs.length}
            </span>
          </div>

          <div style={{
            height:'0.5px', marginTop:'14px',
            background:`linear-gradient(to right, ${cfg.vividColor}45, transparent)`,
          }} aria-hidden="true" />
        </header>

        <div style={{ padding:'12px 14px 0', display:'flex', flexDirection:'column', gap:'8px' }}>
          {recs.length === 0 && (
            <div style={{
              textAlign:'center', padding:'60px 24px',
              fontFamily:'var(--f-display)', fontStyle:'italic',
              fontSize:'22px', color:'rgba(240,230,200,0.35)',
            }}>
              {cfg.emptyHeadline}
            </div>
          )}
          {recs.map(rec => (
            <CompactCard
              key={rec.id}
              rec={rec}
              cfg={cfg}
              onClick={() => { if (!rec.id.startsWith('temp-')) router.push(`/rec/${rec.id}`) }}
            />
          ))}
        </div>

      </div>
    </AppShell>
  )
}

function CompactCard({ rec, cfg, onClick }: {
  rec:     Recommendation
  cfg:     CategoryConfig
  onClick: () => void
}) {
  const meta   = (rec.metadata ?? {}) as Record<string, unknown>
  const isTemp = rec.id.startsWith('temp-')
  const signal = getCompactSignal(cfg.id, rec, meta)

  return (
    <button
      onClick={onClick}
      aria-label={`${rec.title}, from ${rec.source_name}`}
      style={{
        display:                 'flex',
        alignItems:              'center',
        gap:                     '12px',
        padding:                 '12px 14px',
        borderRadius:            '14px',
        border:                  `1px solid ${cfg.vividColor}18`,
        background:              '#0d1910',
        cursor:                  'pointer',
        opacity:                 isTemp ? 0.75 : 1,
        animation:               isTemp ? 'shimmer 1.8s ease-in-out infinite' : 'cardEnter 280ms ease-out',
        WebkitTapHighlightColor: 'transparent',
        textAlign:               'left',
        width:                   '100%',
        transition:              'border-color 160ms ease',
      }}
    >
      <div style={{
        width:        '60px', height: '60px',
        borderRadius: '10px', flexShrink: 0,
        overflow:     'hidden', position: 'relative',
        background:   `linear-gradient(148deg, ${cfg.vividColor}25 0%, ${cfg.vividColor}08 100%)`,
      }}>
        {rec.image_url && (
          <img src={rec.image_url} alt="" aria-hidden="true"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
          />
        )}
        {!rec.image_url && (
          <div style={{
            position:'absolute', inset:0,
            background: `radial-gradient(ellipse at 30% 30%, ${cfg.vividColor}40 0%, transparent 70%)`,
          }} />
        )}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:  'var(--f-title)',
          fontSize:    '14px', fontWeight: 600,
          color:       'rgba(240,230,200,0.95)',
          lineHeight:  1.2, marginBottom: '3px',
          overflow:    'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {rec.title}
        </div>

        <div style={{
          fontFamily: 'var(--f-body)',
          fontSize:   '11px', fontWeight: 500,
          color:      '#c8151e', marginBottom: '2px',
        }}>
          From {rec.source_name}
        </div>

        {signal && (
          <div style={{
            fontFamily: 'var(--f-body)',
            fontSize:   '10px', color: 'rgba(240,230,200,0.35)',
          }}>
            {signal}
          </div>
        )}
      </div>

      {rec.reaction && (
        <div style={{ fontSize:'16px', flexShrink:0 }}>
          {REACTION_SYMBOL[rec.reaction]}
        </div>
      )}

      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="rgba(240,230,200,0.20)" strokeWidth="2" strokeLinecap="round"
        style={{ flexShrink:0 }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  )
}

const REACTION_SYMBOL: Record<string, string> = {
  loved: '♥', good: '✓', okay: '–', skip: '✕',
}

function getCompactSignal(
  catId: string,
  rec:   Recommendation,
  meta:  Record<string, unknown>
): string | null {
  switch (catId) {
    case 'watch': {
      const p: string[] = []
      if (typeof meta.genre        === 'string') p.push(meta.genre)
      if (Array.isArray(meta.genres) && meta.genres.length > 0) p.push(String(meta.genres[0]))
      if (typeof meta.release_year === 'number') p.push(String(meta.release_year))
      if (typeof meta.runtime_minutes === 'number') p.push(`${meta.runtime_minutes}min`)
      return p.slice(0, 3).join(' · ') || null
    }
    case 'listen': {
      const p: string[] = []
      if (typeof meta.artist === 'string') p.push(meta.artist)
      if (typeof meta.album  === 'string') p.push(meta.album)
      return p.join(' — ') || null
    }
    case 'read': {
      const p: string[] = []
      if (typeof meta.author === 'string') p.push(meta.author)
      if (typeof meta.year   === 'number') p.push(String(meta.year))
      return p.join(' · ') || null
    }
    case 'eat':
    case 'drink':
      return [
        rec.location?.city ?? null,
        typeof meta.cuisine === 'string' ? meta.cuisine : null,
        typeof meta.type    === 'string' ? meta.type    : null,
      ].filter(Boolean).join(' · ') || null
    case 'go':
      return rec.location?.country ?? rec.location?.city ?? null
    case 'do':
      return rec.location?.city ?? null
    case 'see':
      return rec.location?.city ?? null
    default:
      return null
  }
}
