'use client'

// components/features/navigation/category-bar.tsx
// Bigger icons: 18px SVG in 22px wrapper (was 15px in 18px).
// No section label — the grid is self-explanatory.
// Active: inset top bar + jewel tone name + dot.
// Inactive: 62% opacity, visible and readable.

import { useCallback } from 'react'
import { CATEGORIES }  from '@/constants/categories'
import type { Category } from '@/lib/types'

type Props = {
  activeCategory:   Category | null
  onCategoryChange: (cat: Category | null) => void
}

function CategoryIcon({ id }: { id: string }) {
  switch (id) {
    case 'restaurant': return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 2.2 1.8 4 4 4v9M17 2v20M12 2v4c0 1.1-.9 2-2 2H8"/></svg>
    case 'film':       return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5"/></svg>
    case 'music':      return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V8l10-2v10"/></svg>
    case 'bar':        return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8M12 11v11M3 3h18l-7 9.5V18"/></svg>
    case 'book':       return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    case 'tv':         return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 2l4 5 4-5"/></svg>
    case 'city':       return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V12h6v9"/></svg>
    case 'podcast':    return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
    case 'activity':   return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="M10 22l2-8 2 8M12 14l-4-6h8l-4 6"/></svg>
    case 'person':     return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    default:           return null
  }
}

export function CategoryBar({ activeCategory, onCategoryChange }: Props) {
  const handleTap = useCallback((id: string) => {
    onCategoryChange(activeCategory === id ? null : id as Category)
  }, [activeCategory, onCategoryChange])

  return (
    <nav aria-label="Browse by category" style={{ padding: '12px 12px 8px' }}>
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
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
                padding:        '11px 2px 8px',
                borderRadius:   '10px',
                border:         `1px solid ${on ? cat.colourHex : 'rgba(240,230,200,0.09)'}`,
                background:     on ? `${cat.colourHex}18` : 'rgba(240,230,200,0.025)',
                cursor:         'pointer',
                minHeight:      '56px',
                position:       'relative',
                // Active: inset top bar in category colour
                boxShadow:      on ? `inset 0 2px 0 ${cat.colourHex}` : 'none',
                transition:     'all 180ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Icon — 18px in 22px wrapper */}
              <div style={{
                width:          '22px',
                height:         '22px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          on ? cat.colourHex : 'rgba(240,230,200,0.62)',
              }}>
                <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg
                    viewBox="0 0 24 24"
                    style={{ width: '18px', height: '18px', stroke: on ? cat.colourHex : 'rgba(240,230,200,0.62)', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}
                  >
                    {/* Inline paths per category */}
                    {cat.id === 'restaurant' && <><path d="M3 2v7c0 2.2 1.8 4 4 4v9M17 2v20M12 2v4c0 1.1-.9 2-2 2H8"/></>}
                    {cat.id === 'film'       && <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5"/></>}
                    {cat.id === 'music'      && <><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V8l10-2v10"/></>}
                    {cat.id === 'bar'        && <><path d="M8 22h8M12 11v11M3 3h18l-7 9.5V18"/></>}
                    {cat.id === 'book'       && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>}
                    {cat.id === 'tv'         && <><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 2l4 5 4-5"/></>}
                    {cat.id === 'city'       && <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V12h6v9"/></>}
                    {cat.id === 'podcast'    && <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}
                    {cat.id === 'activity'   && <><circle cx="12" cy="5" r="2"/><path d="M10 22l2-8 2 8M12 14l-4-6h8l-4 6"/></>}
                    {cat.id === 'person'     && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                  </svg>
                </div>
              </div>

              {/* Label */}
              <span style={{
                fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
                fontSize:      '8px',
                fontWeight:    700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color:         on ? 'rgba(240,230,200,0.95)' : 'rgba(240,230,200,0.55)',
                textAlign:     'center',
                lineHeight:    1,
                transition:    'color 180ms ease',
              }}>
                {cat.shortLabel}
              </span>

              {/* Active dot */}
              {on && (
                <div style={{
                  width:        '3px',
                  height:       '3px',
                  borderRadius: '50%',
                  background:   cat.colourHex,
                  boxShadow:    `0 0 5px ${cat.colourHex}`,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
