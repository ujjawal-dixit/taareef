'use client'

// app/(app)/dashboard/dashboard-client.tsx
// SHIPPED version. Every decision is intentional.
//
// TYPOGRAPHY RETHINK:
// Cormorant is the soul — wordmark, atmospheric text. But it has a problem:
// at small sizes on Android, Cormorant 300 italic becomes hairline-thin and
// illegible. The wordmark MUST be larger to compensate: 62px minimum.
// Plus Jakarta Sans 600-700 for tile titles — warm, legible, editorial.
// Rajdhani 700 for all UI labels — structural, never expressive.
// DM Sans 400-500 for metadata — neutral, subordinate.
//
// LIGHT SOURCES — WKW extended:
// WKW's films are lit from specific, identifiable sources.
// In the Mood for Love: a single lamp casting warm amber in a dark corridor.
// Chungking Express: neon bleeding through rain-wet glass.
// Fallen Angels: fluorescent blue from a screen in the dark.
// Each category has ONE dominant light source direction and ONE primary colour.
// Light does not come from "everywhere" — it comes from a specific place.
// This specificity is what separates atmosphere from decoration.
//
// ALL 8 CATEGORIES ALWAYS VISIBLE:
// Empty categories = ghost tiles with WKW light + category name + invitation copy.
// The user always knows what the vault can hold.

import { useState, useCallback }   from 'react'
import { useRouter }               from 'next/navigation'
import { AppShell }                from '@/components/features/navigation/app-shell'
import { useCreateRecommendation } from '@/hooks/use-recommendations'
import { useToast }                from '@/components/ui/toast'
import { CATEGORIES }              from '@/constants/categories'
import type { CategoryConfig }     from '@/constants/categories'
import type { Recommendation, CreateRecommendationInput } from '@/lib/types'

type TileData = {
  category:   CategoryConfig
  count:      number
  latest:     Recommendation | null
  hasReacted: boolean
}

type Props = {
  tiles:      TileData[]
  totalSaved: number
  userName:   string
  userEmail:  string
  userId:     string
}

// WKW light per category.
// Each has: primary (the light source — one direction, one colour) and
// secondary (the ambient fill — very dim, complements primary).
// Light sources are NOT centered — they come from a corner or edge.
const WKW_LIGHTS: Record<string, { primary: string; secondary: string; canvasColour: string }> = {
  film: {
    // Chungking Express: red neon from bottom-left, cool blue haze top-right
    primary:      'radial-gradient(ellipse 80% 60% at 0% 100%, rgba(200,21,30,0.55) 0%, transparent 65%)',
    secondary:    'radial-gradient(ellipse 60% 40% at 100% 0%, rgba(26,82,200,0.20) 0%, transparent 60%)',
    canvasColour: '#03080f',
  },
  book: {
    // Happy Together: amber lamp at top — like a reading light over a table
    primary:      'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(184,120,32,0.65) 0%, transparent 65%)',
    secondary:    'radial-gradient(ellipse 40% 30% at 80% 100%, rgba(184,120,32,0.12) 0%, transparent 60%)',
    canvasColour: '#0e0800',
  },
  tv: {
    // Fallen Angels: cold screen glow from bottom-right corner
    primary:      'radial-gradient(ellipse 70% 55% at 100% 100%, rgba(21,90,138,0.60) 0%, transparent 65%)',
    secondary:    'radial-gradient(ellipse 50% 30% at 0% 0%, rgba(21,90,138,0.14) 0%, transparent 60%)',
    canvasColour: '#00060e',
  },
  music: {
    // Days of Being Wild: magenta lamp top-right — a bare bulb in a smoky room
    primary:      'radial-gradient(ellipse 65% 50% at 100% 0%, rgba(154,21,114,0.62) 0%, transparent 65%)',
    secondary:    'radial-gradient(ellipse 45% 35% at 0% 100%, rgba(154,21,114,0.16) 0%, transparent 60%)',
    canvasColour: '#0a0008',
  },
  restaurant: {
    // In the Mood for Love: warm red from the right — the corridor light
    primary:      'radial-gradient(ellipse 65% 55% at 100% 50%, rgba(200,21,30,0.50) 0%, transparent 65%)',
    secondary:    'radial-gradient(ellipse 40% 30% at 0% 50%, rgba(200,21,30,0.10) 0%, transparent 55%)',
    canvasColour: '#0e0202',
  },
  bar: {
    // 2046: deep violet from bottom — underground, subterranean
    primary:      'radial-gradient(ellipse 70% 55% at 30% 100%, rgba(106,21,200,0.58) 0%, transparent 65%)',
    secondary:    'radial-gradient(ellipse 40% 30% at 80% 0%, rgba(106,21,200,0.14) 0%, transparent 55%)',
    canvasColour: '#05020e',
  },
  city: {
    // Ashes of Time: dawn light at the horizon — centre top, teal bleeding down
    primary:      'radial-gradient(ellipse 100% 45% at 50% 0%, rgba(31,206,148,0.42) 0%, transparent 60%)',
    secondary:    'radial-gradient(ellipse 50% 40% at 50% 100%, rgba(31,206,148,0.08) 0%, transparent 55%)',
    canvasColour: '#00100a',
  },
  activity: {
    // The Grandmaster: warm gold from top-left — like light through a rain-streaked window
    primary:      'radial-gradient(ellipse 65% 50% at 0% 0%, rgba(21,138,106,0.52) 0%, transparent 65%)',
    secondary:    'radial-gradient(ellipse 40% 30% at 100% 100%, rgba(21,138,106,0.14) 0%, transparent 55%)',
    canvasColour: '#000e08',
  },
}

// Invitation copy for empty tiles — specific to each category's feeling
const EMPTY_COPY: Record<string, string> = {
  film:       'A film someone swears by',
  book:       'A book that found the right moment',
  tv:         'A show someone said just start it',
  music:      'An album from a drive you remember',
  restaurant: 'A place someone said you have to try',
  bar:        'A bar that came up twice in one week',
  city:       'A city someone made sound unmissable',
  activity:   'Something worth doing once',
}

export function DashboardClient({ tiles, totalSaved, userName, userEmail, userId }: Props) {
  const router     = useRouter()
  const { toast }  = useToast()
  const { create } = useCreateRecommendation()
  const [extra, setExtra] = useState(0)

  const handleSave = useCallback(async (input: CreateRecommendationInput) => {
    setExtra(p => p + 1)
    await create(input, undefined,
      () => { toast('Saved ✦', 'success'); router.refresh() },
      (err) => { setExtra(p => p - 1); toast(err, 'error') }
    )
  }, [create, toast, router])

  // Build the full 8-tile grid — all categories always present
  const tileMap = new Map(tiles.map(t => [t.category.id, t]))
  const allTiles: TileData[] = CATEGORIES.map(cat => (
    tileMap.get(cat.id) ?? { category: cat, count: 0, latest: null, hasReacted: false }
  ))

  const count = totalSaved + extra

  return (
    <AppShell onSaveRecommendation={handleSave}>
      <div style={{ maxWidth:'430px', margin:'0 auto', minHeight:'100dvh', display:'flex', flexDirection:'column' }}>

        {/* ── WORDMARK ──────────────────────────────────────── */}
        {/*
          62px — commanding. You're entering a space, not reading a page title.
          The glow is three-layered: sharp (8px), mid (28px), far (60px).
          This mimics how neon actually glows on a wet surface.
        */}
        <header style={{ padding:'48px 20px 0', textAlign:'center', flexShrink:0 }}>
          <h1 aria-label="taareef" style={{
            fontFamily:  'var(--f-display)',
            fontWeight:  300, fontStyle: 'italic',
            fontSize:    '62px', letterSpacing: '-0.02em',
            lineHeight:  0.95, color: '#1fce94',
            textShadow:  [
              '0 0 8px rgba(31,206,148,0.90)',
              '0 0 28px rgba(31,206,148,0.55)',
              '0 0 60px rgba(31,206,148,0.22)',
            ].join(', '),
            margin: 0, userSelect: 'none',
          }}>
            taareef
          </h1>

          {/* Atmospheric subtitle — not a count */}
          <p style={{
            fontFamily:    'var(--f-body)',
            fontSize:      '11px', fontWeight: 300,
            fontStyle:     'italic',
            color:         'rgba(240,230,200,0.35)',
            letterSpacing: '0.08em',
            marginTop:     '8px',
          }}>
            {count === 0
              ? 'every recommendation you\'ll ever get'
              : count === 1
              ? 'one recommendation, remembered'
              : `${count} recommendations, remembered`}
          </p>

          {/* Hairline — neon, symmetric */}
          <div style={{
            height:     '0.5px', margin: '14px auto 0', maxWidth: '180px',
            background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.55) 30%, rgba(31,206,148,0.85) 50%, rgba(31,206,148,0.55) 70%, transparent)',
          }} aria-hidden="true" />
        </header>

        {/* ── 8-TILE MOSAIC ─────────────────────────────────── */}
        {/*
          All 8 categories always present.
          2 columns × 4 rows.
          Height: fills remaining viewport exactly.
          Available = 100dvh - header(~140px) - nav(64px) - padding(20px top, 14px bottom)
          = 100dvh - 238px, split into 4 rows with 3×10px gaps = 30px
          Each tile = (100dvh - 268px) / 4
          minHeight: 110px, maxHeight: 160px for safety on very small/large screens.
        */}
        <section
          aria-label="Your vault"
          style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows:    'repeat(4, 1fr)',
            gap:                 '10px',
            padding:             '20px 14px 14px',
            flex:                1,  // fills all remaining space
          }}
        >
          {allTiles.map((tile, i) => (
            <CategoryTile
              key={tile.category.id}
              tile={tile}
              index={i}
              onClick={() => router.push(`/dashboard/${tile.category.id}`)}
            />
          ))}
        </section>

      </div>
    </AppShell>
  )
}

// ── CATEGORY TILE ──────────────────────────────────────────────────

function CategoryTile({ tile, index, onClick }: {
  tile:    TileData
  index:   number
  onClick: () => void
}) {
  const { category: cat, count, latest } = tile
  const light    = WKW_LIGHTS[cat.id] ?? WKW_LIGHTS.film
  const isEmpty  = count === 0
  const hasImage = !!latest?.image_url
  const meta     = (latest?.metadata ?? {}) as Record<string, unknown>
  const signal   = latest ? getTileSignal(cat.id, latest, meta) : null

  return (
    <button
      onClick={onClick}
      aria-label={isEmpty
        ? `${cat.labelPlural} — tap to save your first`
        : `${cat.labelPlural}, ${count} saved`
      }
      style={{
        position:                'relative',
        borderRadius:            '16px',
        border:                  `1px solid ${isEmpty ? 'rgba(240,230,200,0.06)' : cat.colourHex + '30'}`,
        overflow:                'hidden',
        cursor:                  'pointer',
        display:                 'flex',
        flexDirection:           'column',
        justifyContent:          'flex-end',
        padding:                 '11px',
        background:              light.canvasColour,
        animation:               `tileEnter 360ms cubic-bezier(0.16,1,0.3,1) ${index * 35}ms both`,
        WebkitTapHighlightColor: 'transparent',
        textAlign:               'left',
        // Empty tiles: subtly dimmer
        opacity:                 isEmpty ? 0.72 : 1,
        transition:              'opacity 200ms ease, border-color 200ms ease',
      }}
    >
      {/* WKW light source — primary */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: light.primary,
        opacity:    isEmpty ? 0.55 : 0.90,
        transition: 'opacity 200ms ease',
      }} />

      {/* WKW light — secondary ambient */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: light.secondary,
        opacity:    isEmpty ? 0.40 : 0.80,
      }} />

      {/* Real image — blurred, overlaid on top of light */}
      {hasImage && (
        <img
          src={latest!.image_url!}
          alt="" aria-hidden="true" loading="lazy"
          style={{
            position:  'absolute', inset: 0,
            width:     '100%', height: '100%',
            objectFit: 'cover',
            opacity:   0.38,
            filter:    'blur(0.5px)',
          }}
        />
      )}

      {/* Vignette — ensures text always readable regardless of image */}
      <div aria-hidden="true" style={{
        position:   'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0.92) 100%)',
      }} />

      {/* Count badge — only when populated */}
      {!isEmpty && (
        <div style={{
          position:      'absolute', top: '9px', right: '9px',
          fontFamily:    'var(--f-ui)',
          fontSize:      '9px', fontWeight: 700, letterSpacing: '0.05em',
          color:         cat.colourHex,
          background:    `${cat.colourHex}20`,
          border:        `0.5px solid ${cat.colourHex}40`,
          borderRadius:  '20px', padding: '2px 7px',
          backdropFilter:'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex:        2,
        }}>
          {count}
        </div>
      )}

      {/* Content */}
      <div style={{ position:'relative', zIndex:1 }}>

        {/* Category label */}
        <div style={{
          fontFamily:    'var(--f-ui)',
          fontSize:      '8px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color:         isEmpty ? 'rgba(240,230,200,0.35)' : cat.colourHex,
          marginBottom:  '4px',
        }}>
          {cat.label}
        </div>

        {isEmpty ? (
          // Ghost tile — invitation copy
          <div style={{
            fontFamily:  'var(--f-body)',
            fontSize:    '10px', fontWeight: 300,
            fontStyle:   'italic',
            color:       'rgba(240,230,200,0.38)',
            lineHeight:  1.35,
          }}>
            {EMPTY_COPY[cat.id]}
          </div>
        ) : (
          // Populated tile — latest title + source + signal
          <>
            <div style={{
              fontFamily:          'var(--f-title)',
              fontSize:            '13px', fontWeight: 600,
              color:               'rgba(240,230,200,0.96)',
              lineHeight:          1.2, marginBottom: '3px',
              overflow:            'hidden',
              display:             '-webkit-box',
              WebkitLineClamp:     2,
              WebkitBoxOrient:     'vertical',
            }}>
              {latest!.title}
            </div>

            <div style={{
              fontFamily:   'var(--f-body)',
              fontSize:     '10px', fontWeight: 500,
              color:        '#c8151e',
              overflow:     'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              From {latest!.source_name}
            </div>

            {signal && (
              <div style={{
                fontFamily:   'var(--f-body)',
                fontSize:     '9px', fontWeight: 400,
                color:        'rgba(240,230,200,0.32)',
                marginTop:    '2px',
                overflow:     'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>
                {signal}
              </div>
            )}
          </>
        )}
      </div>
    </button>
  )
}

function getTileSignal(catId: string, rec: Recommendation, meta: Record<string, unknown>): string | null {
  switch (catId) {
    case 'film': case 'tv': {
      const p: string[] = []
      if (typeof meta.genre        === 'string') p.push(meta.genre)
      if (typeof meta.release_year === 'number') p.push(String(meta.release_year))
      return p.join(' · ') || null
    }
    case 'music': return typeof meta.artist === 'string' ? meta.artist : null
    case 'book':  return typeof meta.author === 'string' ? meta.author : null
    case 'restaurant': case 'bar':
      return rec.location?.city ?? (typeof meta.cuisine === 'string' ? meta.cuisine : null)
    case 'city':     return rec.location?.country ?? null
    case 'activity': return rec.location?.city ?? null
    default: return null
  }
}
