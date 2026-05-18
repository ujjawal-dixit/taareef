'use client'

// components/features/navigation/category-bar.tsx
// 8 categories. Inline SVG icons, 18px in 22px wrapper.
// Active: inset top bar + jewel tone + dot. Inactive: 62% opacity.
// No podcast or person — removed from CategoryId.

import { useCallback } from 'react'
import { CATEGORIES }  from '@/constants/categories'
import type { Category } from '@/lib/types'

type Props = {
  activeCategory:   Category | null
  onCategoryChange: (cat: Category | null) => void
}

export function CategoryBar({ activeCategory, onCategoryChange }: Props) {
  const handleTap = useCallback((id: string) => {
    onCategoryChange(activeCategory === id ? null : id as Category)
  }, [activeCategory, onCategoryChange])

  return (
    <nav aria-label="Browse by category" style={{ padding: '12px 12px 8px' }}>
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap:                 '6px',
      }}>
        {CATEGORIES.map(cat => {
          const on = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => handleTap(cat.id)}
              aria-pressed={on}
              aria-label={on ? `${cat.labelPlural}, selected` : cat.labelPlural}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            '5px',
                padding:        '12px 2px 9px',
                borderRadius:   '10px',
                border:         `1px solid ${on ? cat.colourHex : 'rgba(240,230,200,0.09)'}`,
                background:     on ? `${cat.colourHex}18` : 'rgba(240,230,200,0.025)',
                cursor:         'pointer',
                minHeight:      '58px',
                position:       'relative',
                boxShadow:      on ? `inset 0 2px 0 ${cat.colourHex}` : 'none',
                transition:     'all 180ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Icon — 18px SVG in 22px wrapper */}
              <div style={{
                width: '22px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg
                  viewBox="0 0 24 24"
                  style={{
                    width: '18px', height: '18px',
                    stroke: on ? cat.colourHex : 'rgba(240,230,200,0.62)',
                    fill: 'none', strokeWidth: 1.5,
                    strokeLinecap: 'round', strokeLinejoin: 'round',
                    transition: 'stroke 180ms ease',
                  }}
                >
                  {cat.id === 'film'       && <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5"/></>}
                  {cat.id === 'book'       && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>}
                  {cat.id === 'tv'         && <><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 2l4 5 4-5"/></>}
                  {cat.id === 'music'      && <><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V8l10-2v10"/></>}
                  {cat.id === 'restaurant' && <><path d="M3 2v7c0 2.2 1.8 4 4 4v9M17 2v20M12 2v4c0 1.1-.9 2-2 2H8"/></>}
                  {cat.id === 'bar'        && <><path d="M8 22h8M12 11v11M3 3h18l-7 9.5V18"/></>}
                  {cat.id === 'city'       && <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V12h6v9"/></>}
                  {cat.id === 'activity'   && <><circle cx="12" cy="5" r="2"/><path d="M10 22l2-8 2 8M12 14l-4-6h8l-4 6"/></>}
                </svg>
              </div>

              {/* Label */}
              <span style={{
                fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
                fontSize:      '8px', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color:         on ? 'rgba(240,230,200,0.95)' : 'rgba(240,230,200,0.55)',
                textAlign:     'center', lineHeight: 1,
                transition:    'color 180ms ease',
              }}>
                {cat.shortLabel}
              </span>

              {/* Active dot */}
              {on && (
                <div style={{
                  width: '3px', height: '3px', borderRadius: '50%',
                  background: cat.colourHex,
                  boxShadow: `0 0 5px ${cat.colourHex}`,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
