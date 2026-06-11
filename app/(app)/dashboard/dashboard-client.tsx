'use client'

// app/(app)/dashboard/dashboard-client.tsx
// Screen 4 — The real home screen.
// On first run: tiles are ordered by the user's category preferences.
// One tooltip on [+] for 4 seconds, shown once ever.

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/constants/categories'
import type { Category } from '@/lib/types'

interface DashboardClientProps {
  counts: Record<string, number>
  preferredCategories: string[]   // ordered array from user_preferences — may be empty
}

// localStorage key — tooltip shown flag
const TOOLTIP_SHOWN_KEY = 'taareef_tooltip_shown'

export default function DashboardClient({ counts, preferredCategories }: DashboardClientProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show tooltip once ever, 500ms after mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const alreadyShown = localStorage.getItem(TOOLTIP_SHOWN_KEY)
    if (alreadyShown) return

    const delay = setTimeout(() => {
      setShowTooltip(true)
      localStorage.setItem(TOOLTIP_SHOWN_KEY, 'true')

      tooltipTimer.current = setTimeout(() => {
        setShowTooltip(false)
      }, 4000)
    }, 500)

    return () => {
      clearTimeout(delay)
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    }
  }, [])

  // Build ordered category list:
  // Preferred categories first (in preference order), then remaining categories
  const orderedCategories = (() => {
    if (preferredCategories.length === 0) return CATEGORIES

    const preferred = preferredCategories
      .map((id) => CATEGORIES.find((c) => c.id === id))
      .filter((c): c is typeof CATEGORIES[number] => !!c)

    const remaining = CATEGORIES.filter(
      (c) => !preferredCategories.includes(c.id)
    )

    return [...preferred, ...remaining]
  })()

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 80px',
      }}
    >
      {/* Header */}
      <div style={{ padding: '28px 20px 16px' }}>
        <h1
          style={{
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 28,
            color: '#F4F3EE',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Your vault
        </h1>
      </div>

      {/* 2×3 Category mosaic */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 10,
          padding: '0 12px',
          minHeight: 0,
        }}
      >
        {orderedCategories.slice(0, 6).map((cat) => {
          const count = counts[cat.id] ?? 0
          return (
            <CategoryTile
              key={cat.id}
              id={cat.id as Category}
              label={cat.label}
              vividHex={cat.vividHex}
              vividRgb={cat.vividRgb}
              count={count}
            />
          )
        })}
      </div>

      {/* First-run tooltip on [+] */}
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            bottom: 86,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a18',
            border: '0.5px solid rgba(31,206,148,0.30)',
            borderRadius: 10,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 200,
            animation: 'tooltipIn 0.2s ease',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ fontSize: 16 }}>＋</span>
          <span
            style={{
              fontFamily: 'var(--f-body)',
              fontSize: 13,
              color: 'rgba(244,243,238,0.75)',
            }}
          >
            Tap <strong style={{ color: '#1fce94' }}>+</strong> any time to save a recommendation
          </span>
          {/* Arrow pointing down to FAB */}
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(31,206,148,0.30)',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CategoryTile — one cell in the 2×3 mosaic
// ─────────────────────────────────────────────────────────────────────────────
interface CategoryTileProps {
  id: Category
  label: string
  vividHex: string
  vividRgb: string
  count: number
}

function CategoryTile({ id, label, vividHex, vividRgb, count }: CategoryTileProps) {
  return (
    <Link
      href={`/dashboard/${id}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <div
        style={{
          height: '100%',
          minHeight: 120,
          borderRadius: 16,
          background: `radial-gradient(ellipse at 30% 30%, rgba(${vividRgb},0.12) 0%, rgba(10,10,10,0.95) 70%)`,
          border: '0.5px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 16px 14px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.15s ease',
        }}
      >
        {/* Subtle corner accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 60,
            height: 60,
            background: `radial-gradient(circle at 100% 0%, rgba(${vividRgb},0.10) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Count */}
        <span
          style={{
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 32,
            color: count > 0 ? vividHex : 'rgba(255,255,255,0.08)',
            lineHeight: 1,
          }}
        >
          {count > 0 ? count : '—'}
        </span>

        {/* Label */}
        <span
          style={{
            fontFamily: 'var(--f-ui)',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: count > 0 ? 'rgba(244,243,238,0.75)' : 'rgba(244,243,238,0.25)',
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  )
}
