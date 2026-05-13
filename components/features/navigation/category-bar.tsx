// components/features/navigation/category-bar.tsx
// Airbnb category bar — always shows all 10 categories.
// One tap switches the entire vault.
// Active: filled with jewel-toned category colour.
// Inactive: subtle tint of the category colour — the bar feels alive.

'use client'

import { forwardRef, useRef, useEffect } from 'react'
import { CATEGORIES } from '@/constants/categories'
import type { Category } from '@/lib/types'

type CategoryBarProps = {
  activeCategory: Category | null
  onCategoryChange: (category: Category | null) => void
}

export function CategoryBar({
  activeCategory,
  onCategoryChange,
}: CategoryBarProps) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const activeRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      block:    'nearest',
      inline:   'center',
    })
  }, [activeCategory])

  return (
    <nav aria-label="Browse by category">
      <div
        ref={scrollRef}
        style={{
          display:         'flex',
          gap:             '8px',
          overflowX:       'auto',
          padding:         '10px 16px',
          scrollbarWidth:  'none',
          msOverflowStyle: 'none',
        }}
        role="list"
      >
        {/* All chip */}
        <NavChip
          label="All"
          icon="✦"
          isActive={activeCategory === null}
          activeColour="#c44a28"
          inactiveTint="rgba(196,74,40,0.08)"
          inactiveColor="#8a4a1a"
          onClick={() => onCategoryChange(null)}
          aria-label="Show all recommendations"
          aria-pressed={activeCategory === null}
        />

        {/* 10 category chips */}
        {CATEGORIES.map(cat => (
          <NavChip
            key={cat.id}
            ref={activeCategory === cat.id ? activeRef : undefined}
            label={cat.label}
            icon={cat.icon}
            isActive={activeCategory === cat.id}
            activeColour={cat.colourHex}
            // Each inactive chip has a subtle tint of its own colour
            // This makes the bar feel alive — not just grey pills
            inactiveTint={`${cat.colourHex}14`}
            inactiveColor={cat.colourHex}
            onClick={() => onCategoryChange(cat.id)}
            aria-label={`Show ${cat.labelPlural}`}
            aria-pressed={activeCategory === cat.id}
          />
        ))}
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────
// NAV CHIP
// ─────────────────────────────────────────────────────────────

type NavChipProps = {
  label:         string
  icon:          string
  isActive:      boolean
  activeColour:  string
  inactiveTint:  string
  inactiveColor: string
  onClick:       () => void
  'aria-label'?: string
  'aria-pressed'?: boolean
}

const NavChip = forwardRef<HTMLButtonElement, NavChipProps>(
  function NavChip(
    { label, icon, isActive, activeColour, inactiveTint, inactiveColor, onClick, ...aria },
    ref
  ) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        role="listitem"
        style={{
          display:               'inline-flex',
          alignItems:            'center',
          gap:                   '5px',
          padding:               '8px 14px',
          borderRadius:          '9999px',
          border:                'none',
          fontSize:              '13px',
          fontWeight:            '600',
          whiteSpace:            'nowrap',
          flexShrink:            0,
          cursor:                'pointer',
          fontFamily:            'var(--font-dm-sans), system-ui, sans-serif',
          transition:            'all 180ms ease',
          WebkitTapHighlightColor: 'transparent',
          // Active: filled jewel tone + white text + shadow
          // Inactive: subtle category tint + dark tinted text
          backgroundColor: isActive ? activeColour : inactiveTint,
          color:           isActive ? '#ffffff'     : inactiveColor,
          boxShadow:       isActive
            ? '0 2px 8px rgba(0,0,0,0.22)'
            : '0 1px 2px rgba(30,28,26,0.05)',
        }}
        {...aria}
      >
        <span aria-hidden="true" style={{ fontSize: '14px', lineHeight: 1 }}>
          {icon}
        </span>
        <span>{label}</span>
      </button>
    )
  }
)

NavChip.displayName = 'NavChip'
