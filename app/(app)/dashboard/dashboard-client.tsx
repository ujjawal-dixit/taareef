'use client'

// app/(app)/dashboard/dashboard-client.tsx
// Every design decision here is intentional and documented.
// Wordmark: Cormorant Garamond 300 italic, centred, 38px, neon glow.
// Header: centred composition — wordmark, subtitle, symmetric hairline.
// Category grid: sticky, 5×2, icon + label, each jewel tone.
// Vault: mixed grid, hero card taller, subsequent cards standard.

import { useState, useMemo, useCallback } from 'react'
import { useRouter }          from 'next/navigation'
import { CategoryBar }        from '@/components/features/navigation/category-bar'
import { RecommendationCard } from '@/components/features/cards/recommendation-card'
import { EmptyState }         from '@/components/features/vault/empty-state'
import { AppShell }           from '@/components/features/navigation/app-shell'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { useToast }           from '@/components/ui/toast'
import type { Recommendation, Category, CreateRecommendationInput } from '@/lib/types'

type Props = {
  recommendations:    Recommendation[]
  userId:             string
  nudgeAnsweredCount: number
}

export function DashboardClient({ recommendations: serverRecs }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const { create } = useCreateRecommendation()

  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [localRecs,      setLocalRecs]      = useState<Recommendation[]>(serverRecs)

  const filtered = useMemo(() => {
    if (!activeCategory) return localRecs
    return localRecs.filter(r => r.category === activeCategory)
  }, [localRecs, activeCategory])

  const handleSave = useCallback(async (input: CreateRecommendationInput) => {
    const tempId = `temp-${Date.now()}`
    const tempRec: Recommendation = {
      id:         tempId,
      user_id:    '',
      status:     'saved',
      reaction:   null,
      priority:   input.priority  ?? 'medium',
      metadata:   input.metadata  ?? {},
      url:        input.url       ?? null,
      image_url:  input.image_url ?? null,
      notes:      input.notes     ?? null,
      location:   input.location  ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...input,
    }

    // Optimistic: card appears instantly
    setLocalRecs(prev => [tempRec, ...prev])

    await create(
      input,
      undefined,
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

  const count   = localRecs.length
  const hasRecs = count > 0
  const hasFilt = filtered.length > 0

  return (
    <AppShell onSaveRecommendation={handleSave}>

      {/* ════════════════════════════════════════════════
          HEADER
          Centred composition. Wordmark is a film title
          card — intimate, memorable, neon.
          Not a dashboard. Not a masthead. A lantern.
      ════════════════════════════════════════════════ */}
      <header style={{
        padding:   '56px 20px 0',
        textAlign: 'center',
      }}>

        {/*
          THE WORDMARK
          Cormorant Garamond 300 italic — the display font.
          38px: present without dominating. A whisper, not a shout.
          Centred: composition over convention.
          Neon #1fce94 with layered text-shadow:
            - 20px: the immediate glow (the hot spot)
            - 48px: the ambient spread (the halo)
            - 80px: the atmospheric bleed (barely perceptible,
                    but removes the hard edge in dark)
          This is how WKW's neon signs work — they don't
          end at the letter, they bleed into the night.
        */}
        <h1
          aria-label="taareef"
          style={{
            fontFamily:    'var(--font-cormorant), Georgia, serif',
            fontWeight:    300,
            fontStyle:     'italic',
            fontSize:      '42px',
            letterSpacing: '-0.01em',
            lineHeight:    1,
            color:         '#1fce94',
            textShadow: [
              '0 0 20px rgba(31,206,148,0.65)',
              '0 0 48px rgba(31,206,148,0.28)',
              '0 0 88px rgba(31,206,148,0.10)',
            ].join(', '),
            margin: 0,
          }}
        >
          taareef
        </h1>

        {/*
          SUBTITLE
          Context, not decoration.
          Shows count when vault has saves — personal, not generic.
          52% opacity: present but clearly subordinate.
        */}
        <p style={{
          fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:      '11.5px',
          fontWeight:    400,
          color:         'rgba(240,230,200,0.52)',
          letterSpacing: '0.05em',
          marginTop:     '7px',
        }}>
          {count === 0
            ? 'your vault is ready'
            : `${count} recommendation${count === 1 ? '' : 's'}`}
        </p>

        {/*
          HAIRLINE
          Symmetric — grows from centre outward.
          If the wordmark is centred, the hairline echoes it.
          Neon at peak (50%), fading to nothing at edges.
          Max-width: 160px — proportional to the wordmark width.
        */}
        <div style={{
          height:    '0.5px',
          margin:    '16px auto 0',
          maxWidth:  '160px',
          background: 'linear-gradient(to right, transparent 0%, rgba(31,206,148,0.18) 20%, rgba(31,206,148,0.55) 50%, rgba(31,206,148,0.18) 80%, transparent 100%)',
        }} aria-hidden="true" />

      </header>

      {/* ════════════════════════════════════════════════
          CATEGORY GRID — sticky
          5×2 grid. All 10 visible. No scroll.
          Becomes the navigation anchor as you browse.
          Backdrop blur + dark bg so cards scroll beneath
          it without creating visual noise.
      ════════════════════════════════════════════════ */}
      <div style={{
        position:             'sticky',
        top:                  0,
        zIndex:               20,
        background:           'rgba(8,15,10,0.96)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:         '0.5px solid rgba(240,230,200,0.06)',
        marginTop:            '20px',
      }}>
        <CategoryBar
          activeCategory={activeCategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat)
            // Scroll vault to top on category change
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>

      {/* ════════════════════════════════════════════════
          VAULT
          Mixed grid: hero card taller (draws the eye),
          subsequent cards standard height.
          14px horizontal padding: cards breathe.
      ════════════════════════════════════════════════ */}
      <section
        aria-label="Saved recommendations"
        style={{ padding: '14px 14px 0' }}
      >
        {!hasRecs ? (
          <EmptyState />
        ) : !hasFilt ? (
          <EmptyState category={activeCategory ?? undefined} />
        ) : (
          <VaultGrid
            recommendations={filtered}
            onCardClick={id => {
              if (!id.startsWith('temp-')) router.push(`/rec/${id}`)
            }}
          />
        )}
      </section>

    </AppShell>
  )
}

// ── VAULT GRID ────────────────────────────────────────────────────

function VaultGrid({
  recommendations,
  onCardClick,
}: {
  recommendations: Recommendation[]
  onCardClick:     (id: string) => void
}) {
  const [hero, ...rest] = recommendations

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {hero && (
        <RecommendationCard
          recommendation={hero}
          isHero
          onClick={() => onCardClick(hero.id)}
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
