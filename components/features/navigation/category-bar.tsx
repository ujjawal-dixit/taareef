// components/features/navigation/category-bar.tsx
// The primary navigation — Airbnb category bar pattern.
// Always shows all 10 categories. One tap switches the entire vault.
// Horizontal scroll, no wrapping. Active category highlighted.
// "use client" — interactive, needs browser APIs for scroll position.

'use client'

import { useRef, useEffect } from 'react'
import { CATEGORIES, getCategoryConfig } from '@/constants/categories'
import type { Category } from '@/lib/types'

type CategoryBarProps = {
  activeCategory: Category | null   // null = showing all categories (home)
  onCategoryChange: (category: Category | null) => void
  className?: string
}

export function CategoryBar({
  activeCategory,
  onCategoryChange,
  className = '',
}: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Scroll active category into view when it changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeCategory])

  return (
    <nav
      aria-label="Browse by category"
      className={[
        'w-full',
        className,
      ].join(' ')}
    >
      <div
        ref={scrollRef}
        className={[
          'flex gap-2 overflow-x-auto',
          'px-4 py-3',
          // Hide scrollbar — navigation feel, not list feel
          'scrollbar-none',
          '[&::-webkit-scrollbar]:hidden',
          '[-ms-overflow-style:none]',
          '[scrollbar-width:none]',
        ].join(' ')}
        role="list"
      >
        {/* "All" chip — shows home screen */}
        <CategoryChip
          label="All"
          icon="✦"
          isActive={activeCategory === null}
          colourHex="hsl(35, 4%, 10%)"
          onClick={() => onCategoryChange(null)}
          aria-label="Show all recommendations"
        />

        {/* All 10 categories */}
        {CATEGORIES.map(config => (
          <CategoryChip
            key={config.id}
            ref={activeCategory === config.id ? activeRef : undefined}
            label={config.label}
            icon={config.icon}
            isActive={activeCategory === config.id}
            colourHex={config.colourHex}
            onClick={() => onCategoryChange(config.id)}
            aria-label={`Show ${config.labelPlural}`}
            aria-pressed={activeCategory === config.id}
          />
        ))}
      </div>
    </nav>
  )
}

// ============================================================
// CATEGORY CHIP
// ============================================================

import { forwardRef } from 'react'

type CategoryChipProps = {
  label: string
  icon: string
  isActive: boolean
  colourHex: string
  onClick: () => void
  'aria-label'?: string
  'aria-pressed'?: boolean
}

const CategoryChip = forwardRef<HTMLButtonElement, CategoryChipProps>(
  function CategoryChip(
    { label, icon, isActive, colourHex, onClick, ...ariaProps },
    ref
  ) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        role="listitem"
        className={[
          'flex-shrink-0 flex items-center gap-1.5',
          'px-3.5 py-2 rounded-full',
          'font-sans text-chip font-600',
          'transition-all duration-200',
          'no-tap-highlight select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'animate-chip-select',
          isActive
            ? 'text-white shadow-md'
            : 'text-neutral-600 bg-neutral-100 hover:bg-neutral-200',
        ].join(' ')}
        style={isActive ? {
          backgroundColor: colourHex,
          // Focus ring matches category colour
        } : undefined}
        {...ariaProps}
      >
        <span aria-hidden="true" className="text-sm leading-none">
          {icon}
        </span>
        <span>{label}</span>
      </button>
    )
  }
)

CategoryChip.displayName = 'CategoryChip'
