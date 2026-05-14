'use client'

// components/features/navigation/category-bar.tsx
// 5×2 grid of category tiles. All 10 visible, no scroll.
// Active tile glows in its jewel tone. Inactive at 62% opacity — readable.
// Fitts's Law: minimum 52px height per tile, 7px gap.
// Miller's Law: 10 tiles chunked as 5+5 in two rows.

import { useCallback } from 'react'
import { CATEGORIES, type CategoryId } from '@/constants/categories'
import type { Category } from '@/lib/types'

type CategoryBarProps = {
  activeCategory: Category | null
  onCategoryChange: (category: Category | null) => void
}

// SVG icons as React components for type safety
function CategoryIcon({ id }: { id: CategoryId }) {
  switch (id) {
    case 'restaurant':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M3 2v7c0 2.2 1.8 4 4 4v9M17 2v20M12 2v4c0 1.1-.9 2-2 2H8"/>
        </svg>
      )
    case 'film':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5"/>
        </svg>
      )
    case 'music':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <circle cx="8" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
          <path d="M11 18V8l10-2v10"/>
        </svg>
      )
    case 'bar':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M8 22h8M12 11v11M3 3h18l-7 9.5V18"/>
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      )
    case 'tv':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <rect x="2" y="7" width="20" height="13" rx="2"/>
          <path d="M8 2l4 5 4-5"/>
        </svg>
      )
    case 'city':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V12h6v9"/>
        </svg>
      )
    case 'podcast':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )
    case 'activity':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <circle cx="12" cy="5" r="2"/>
          <path d="M10 22l2-8 2 8M12 14l-4-6h8l-4 6"/>
        </svg>
      )
    case 'person':
      return (
        <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
  }
}

export function CategoryBar({ activeCategory, onCategoryChange }: CategoryBarProps) {

  const handleTileClick = useCallback((id: CategoryId) => {
    // Toggle: tap active category to deselect (show all)
    onCategoryChange(activeCategory === id ? null : id as Category)
  }, [activeCategory, onCategoryChange])

  return (
    <nav aria-label="Browse by category" style={{ padding: '14px 14px 6px' }}>
      <span className="section-label" style={{ marginBottom: '10px' }}>
        Your world
      </span>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '7px',
        }}
        role="list"
      >
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              role="listitem"
              className={`cat-tile${isActive ? ' active' : ''}`}
              style={{ '--tc': cat.colourHex } as React.CSSProperties}
              onClick={() => handleTileClick(cat.id)}
              aria-pressed={isActive}
              aria-label={`${cat.labelPlural}${isActive ? ', selected' : ''}`}
            >
              {/* Top light bar rendered via ::before in CSS when .active */}

              {/* Icon */}
              <div
                className="tile-icon"
                aria-hidden="true"
                style={isActive ? { color: cat.colourHex } : undefined}
              >
                <CategoryIcon id={cat.id} />
              </div>

              {/* Label */}
              <span className="tile-name">
                {cat.shortLabel}
              </span>

              {/* Active dot */}
              <div
                className="tile-dot"
                aria-hidden="true"
                style={{
                  background: cat.colourHex,
                  boxShadow: `0 0 5px ${cat.colourHex}`,
                }}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
