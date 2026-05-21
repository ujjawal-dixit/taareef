'use client'

// app/(app)/dashboard/dashboard-client.tsx
// Direction B: Category mosaic homepage.
//
// The vault is not a feed. It is a map of taste.
// 8 category tiles, 2 columns, 4 rows — the entire vault visible at once.
// Each tile: blurred latest image OR WKW light, category name, count, latest title.
// Tapping a tile navigates to /dashboard/[category] — the category list view.
//
// The user sees the shape of everything they've saved before seeing any card.
// That is what "user as the base" means.

import { useState, useCallback }     from 'react'
import { useRouter }                 from 'next/navigation'
import { AppShell }                  from '@/components/features/navigation/app-shell'
import { useCreateRecommendation }   from '@/hooks/use-recommendations'
import { useToast }                  from '@/components/ui/toast'
import type { CategoryConfig }       from '@/constants/categories'
import type { Recommendation, CreateRecommendationInput } from '@/lib/types'

type TileData = {
  category:   CategoryConfig
  count:      number
  latest:     Recommendation
  hasReacted: boolean
}

type Props = {
  tiles:      TileData[]
  totalSaved: number
  userName:   string
  userEmail:  string
  userId:     string
}

// WKW atmospheric light per category — shown when no image exists
const TILE_LIGHTS: Record<string, string> = {
  film:       'radial-gradient(ellipse at 20% 80%, rgba(200,21,30,0.50) 0%, rgba(26,82,200,0.18) 60%, transparent 100%)',
  book:       'radial-gradient(ellipse at 80% 20%, rgba(184,120,32,0.55) 0%, rgba(184,120,32,0.10) 60%, transparent 100%)',
  tv:         'radial-gradient(ellipse at 15% 85%, rgba(21,90,138,0.55) 0%, rgba(21,90,138,0.12) 60%, transparent 100%)',
  music:      'radial-gradient(ellipse at 85% 15%, rgba(154,21,114,0.55) 0%, rgba(154,21,114,0.12) 60%, transparent 100%)',
  restaurant: 'radial-gradient(ellipse at 50% 50%, rgba(200,21,30,0.40) 0%, transparent 70%)',
  bar:        'radial-gradient(ellipse at 30% 70%, rgba(106,21,200,0.50) 0%, rgba(106,21,200,0.10) 60%, transparent 100%)',
  city:       'radial-gradient(ellipse at 50% 20%, rgba(31,206,148,0.40) 0%, transparent 65%)',
  activity:   'radial-gradient(ellipse at 70% 70%, rgba(21,138,106,0.45) 0%, transparent 65%)',
}

export function DashboardClient({ tiles, totalSaved, userName, userEmail, userId }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const { create } = useCreateRecommendation()

  // Optimistically add a new tile count when user saves something
  const [localExtra, setLocalExtra] = useState(0)

  const handleSave = useCallback(async (input: CreateRecommendationInput) => {
    setLocalExtra(prev => prev + 1)
    await create(input, undefined,
      () => { toast('Saved ✦', 'success') },
      (err) => { setLocalExtra(prev => prev - 1); toast(err, 'error') }
    )
    // Refresh to show updated tile
    router.refresh()
  }, [create, toast, router])

  const count = totalSaved + localExtra

  // Tile height: fill available vertical space with 4 rows + gaps
  // Available = 100dvh - wordmark(~130px) - nav(64px) - padding(24px top, 14px bottom)
  // = 100dvh - 232px divided into 4 rows with 10px gaps (3 gaps = 30px)
  // Each tile = (100dvh - 262px) / 4
  const tileHeight = 'calc((100dvh - 262px) / 4)'

  return (
    <AppShell onSaveRecommendation={handleSave}>

      {/* ── WORDMARK ──────────────────────────────────────── */}
      <header style={{ padding: '52px 20px 0', textAlign: 'center' }}>
        <h1 aria-label="taareef" style={{
          fontFamily:  'var(--f-display)',
          fontWeight:  300, fontStyle: 'italic',
          fontSize:    '42px', letterSpacing: '-0.01em',
          lineHeight:  1, color: '#1fce94',
          textShadow:  '0 0 20px rgba(31,206,148,0.65), 0 0 48px rgba(31,206,148,0.28)',
          margin:      0,
        }}>
          taareef
        </h1>
        <p style={{
          fontFamily:    'var(--f-body)',
          fontSize:      '11px', fontWeight: 400,
          color:         'rgba(240,230,200,0.45)',
          letterSpacing: '0.05em', marginTop: '6px',
        }}>
          {count === 0 ? 'your vault is ready' : `${count} saved`}
        </p>
        <div style={{
          height:     '0.5px', margin: '14px auto 0', maxWidth: '140px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.45) 50%, transparent)',
        }} aria-hidden="true" />
      </header>

      {/* ── MOSAIC GRID ───────────────────────────────────── */}
      {/*
        2 columns, 4 rows.
        Every populated category gets a tile.
        Empty categories are shown as ghost tiles — dimmer, no image.
        The grid always shows all 8 so the user sees the full shape of their vault.
      */}
      <section
        aria-label="Your vault"
        style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 '10px',
          padding:             '20px 14px 0',
        }}
      >
        {tiles.length === 0 ? (
          // Empty vault — full-width invitation
          <div style={{
            gridColumn:     '1 / -1',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            minHeight:      '320px',
            gap:            '16px',
          }}>
            <p style={{
              fontFamily:  'var(--f-display)',
              fontStyle:   'italic', fontWeight: 300,
              fontSize:    '22px',
              color:       'rgba(240,230,200,0.55)',
              textAlign:   'center', lineHeight: 1.4,
            }}>
              Your vault is waiting.
            </p>
            <p style={{
              fontFamily: 'var(--f-body)',
              fontSize:   '12px', fontWeight: 300,
              color:      'rgba(240,230,200,0.35)',
              textAlign:  'center', lineHeight: 1.7,
              maxWidth:   '200px',
            }}>
              Tap + to save your first recommendation.
            </p>
          </div>
        ) : (
          tiles.map((tile, i) => (
            <CategoryTile
              key={tile.category.id}
              tile={tile}
              tileHeight={tileHeight}
              index={i}
              onClick={() => router.push(`/dashboard/${tile.category.id}`)}
            />
          ))
        )}
      </section>

    </AppShell>
  )
}

// ── CATEGORY TILE ──────────────────────────────────────────────────

function CategoryTile({ tile, tileHeight, index, onClick }: {
  tile:       TileData
  tileHeight: string
  index:      number
  onClick:    () => void
}) {
  const { category: cat, count, latest } = tile
  const light    = TILE_LIGHTS[cat.id] ?? TILE_LIGHTS.film
  const hasImage = !!latest.image_url
  const meta     = (latest.metadata ?? {}) as Record<string, unknown>

  // Signal line — the one piece of metadata that earns its place on the tile
  const signal = getTileSignal(cat.id, latest, meta)

  return (
    <button
      onClick={onClick}
      aria-label={`${cat.labelPlural}, ${count} saved`}
      style={{
        height:                  tileHeight,
        minHeight:               '120px',
        maxHeight:               '180px',
        borderRadius:            '16px',
        border:                  `1px solid ${cat.colourHex}28`,
        overflow:                'hidden',
        position:                'relative',
        cursor:                  'pointer',
        display:                 'flex',
        flexDirection:           'column',
        justifyContent:          'flex-end',
        padding:                 '12px',
        background:              '#0d1910',
        animation:               `tileEnter 320ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms both`,
        WebkitTapHighlightColor: 'transparent',
        transition:              'transform 160ms ease, border-color 160ms ease',
        textAlign:               'left',
      }}
    >
      {/* Background: blurred image or WKW light */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: light,
        opacity:    hasImage ? 0.6 : 1,
      }} />

      {hasImage && (
        <img
          src={latest.image_url!}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{
            position:  'absolute', inset: 0,
            width:     '100%', height: '100%',
            objectFit: 'cover',
            opacity:   0.45,
            filter:    'blur(1px)',
          }}
        />
      )}

      {/* Dark vignette — content always readable */}
      <div aria-hidden="true" style={{
        position:   'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,15,10,0.10) 0%, rgba(8,15,10,0.82) 60%, rgba(8,15,10,0.96) 100%)',
      }} />

      {/* Count badge — top right */}
      <div style={{
        position:      'absolute', top: '10px', right: '10px',
        fontFamily:    'var(--f-ui)',
        fontSize:      '10px', fontWeight: 700,
        letterSpacing: '0.06em',
        color:         cat.colourHex,
        background:    `${cat.colourHex}18`,
        border:        `0.5px solid ${cat.colourHex}35`,
        borderRadius:  '20px', padding: '2px 8px',
        backdropFilter:'blur(8px)',
      }}>
        {count}
      </div>

      {/* Content — sits at the bottom of the tile */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Category name */}
        <div style={{
          fontFamily:    'var(--f-ui)',
          fontSize:      '9px', fontWeight: 700,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          color:         cat.colourHex,
          marginBottom:  '4px',
        }}>
          {cat.label}
        </div>

        {/* Latest title — Plus Jakarta Sans */}
        <div style={{
          fontFamily:   'var(--f-title)',
          fontSize:     '14px', fontWeight: 600,
          color:        'rgba(240,230,200,0.95)',
          lineHeight:   1.2,
          marginBottom: '3px',
          overflow:     'hidden',
          display:      '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {latest.title}
        </div>

        {/* Source — always present */}
        <div style={{
          fontFamily: 'var(--f-body)',
          fontSize:   '10px', fontWeight: 500,
          color:      '#c8151e',
          overflow:   'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}>
          From {latest.source_name}
        </div>

        {/* Signal — dim, subordinate */}
        {signal && (
          <div style={{
            fontFamily:  'var(--f-body)',
            fontSize:    '10px', fontWeight: 400,
            color:       'rgba(240,230,200,0.35)',
            marginTop:   '2px',
            overflow:    'hidden',
            whiteSpace:  'nowrap',
            textOverflow:'ellipsis',
          }}>
            {signal}
          </div>
        )}
      </div>
    </button>
  )
}

// One signal line per category — the most relevant single piece of metadata
function getTileSignal(
  catId: string,
  rec:   Recommendation,
  meta:  Record<string, unknown>
): string | null {
  switch (catId) {
    case 'film':
    case 'tv': {
      const parts: string[] = []
      if (typeof meta.genre        === 'string') parts.push(meta.genre)
      if (typeof meta.release_year === 'number') parts.push(String(meta.release_year))
      return parts.join(' · ') || null
    }
    case 'music':
      return typeof meta.artist === 'string' ? meta.artist : null
    case 'book':
      return typeof meta.author === 'string' ? meta.author : null
    case 'restaurant':
    case 'bar':
      return rec.location?.city ?? (typeof meta.neighbourhood === 'string' ? meta.neighbourhood : null)
    case 'city':
      return rec.location?.country ?? null
    case 'activity':
      return rec.location?.city ?? null
    default:
      return null
  }
}
