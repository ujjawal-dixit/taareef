'use client'

// components/features/navigation/category-bar.tsx
// 6 categories. Updated to match new category system.

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
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 '6px',
      }}>
        {CATEGORIES.map(cat => {
          const on = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => handleTap(cat.id)}
              aria-pressed={on}
              aria-label={on ? `${cat.label}, selected` : cat.label}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            '5px',
                padding:        '12px 2px 9px',
                borderRadius:   '10px',
                border:         `1px solid ${on ? cat.vividColor : 'rgba(240,230,200,0.09)'}`,
                background:     on ? `${cat.vividColor}18` : 'rgba(240,230,200,0.025)',
                cursor:         'pointer',
                minHeight:      '58px',
                position:       'relative',
                boxShadow:      on ? `inset 0 2px 0 ${cat.vividColor}` : 'none',
                transition:     'all 180ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: '22px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" style={{
                  width: '18px', height: '18px',
                  stroke: on ? cat.vividColor : 'rgba(240,230,200,0.62)',
                  fill: 'none', strokeWidth: 1.5,
                  strokeLinecap: 'round', strokeLinejoin: 'round',
                  transition: 'stroke 180ms ease',
                }}>
                  {cat.id === 'watch'  && <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M17 9h5"/></>}
                  {cat.id === 'listen' && <><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V8l10-2v10"/></>}
                  {cat.id === 'read'   && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>}
                  {cat.id === 'dine'   && <><path d="M8 22h8M12 11v11M3 3h18l-7 9.5V18"/></>}
                  {cat.id === 'do'     && <><path d="M8 3l4 8 5-5 5 15M4.14 15.08A10 10 0 1 0 15.08 4.14"/></>}
                  {cat.id === 'visit'  && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
                </svg>
              </div>
              <span style={{
                fontFamily: 'var(--f-ui)', fontSize: '8px', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: on ? 'rgba(240,230,200,0.95)' : 'rgba(240,230,200,0.55)',
                textAlign: 'center', lineHeight: 1, transition: 'color 180ms ease',
              }}>
                {cat.label}
              </span>
              {on && (
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: cat.vividColor, boxShadow: `0 0 5px ${cat.vividColor}` }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
