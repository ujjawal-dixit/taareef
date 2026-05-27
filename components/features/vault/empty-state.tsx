'use client'

// components/features/vault/empty-state.tsx
// Empty state for category list — uses category config from constants.
// getCategoryBloom removed; uses getCardGradient instead.

import { getCardGradient, CATEGORIES } from '@/constants/categories'
import type { Category } from '@/lib/types'

type EmptyStateProps = {
  category: Category
  onSave?: () => void
}

export function EmptyState({ category, onSave }: EmptyStateProps) {
  const config = CATEGORIES.find((c) => c.id === category)
  if (!config) return null

  const gradient = getCardGradient(category)

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 32px', textAlign: 'center', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: gradient, opacity: 0.12,
        borderRadius: '16px', pointerEvents: 'none',
      }} />

      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: `0 0 40px ${config.vividColor}30`,
        position: 'relative', zIndex: 1,
      }}>
        <CategoryIcon category={category} color={config.vividColor} />
      </div>

      <h2 style={{
        fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
        fontSize: '26px', color: 'rgba(242,230,205,0.95)',
        lineHeight: 1.2, marginBottom: '12px', position: 'relative', zIndex: 1,
      }}>
        {config.emptyHeadline}
      </h2>

      <p style={{
        fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 300,
        color: 'rgba(242,230,205,0.50)', lineHeight: 1.7,
        maxWidth: '260px', marginBottom: '32px',
        position: 'relative', zIndex: 1,
      }}>
        {config.emptyBody}
      </p>

      {onSave && (
        <button onClick={onSave} style={{
          fontFamily: 'var(--f-ui)', fontSize: '11px', fontWeight: 700,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          color: config.vividColor, background: 'transparent',
          border: `1px solid ${config.vividColor}55`,
          borderRadius: '24px', padding: '10px 24px',
          cursor: 'pointer', position: 'relative', zIndex: 1,
        }}>
          {config.emptyCta}
        </button>
      )}
    </div>
  )
}

function CategoryIcon({ category, color }: { category: Category; color: string }) {
  const p = { width: '36' as const, height: '36' as const, viewBox: '0 0 100 100', fill: 'none' as const }

  switch (category) {
    case 'watch':
      return (
        <svg {...p}>
          <rect x="8" y="10" width="84" height="52" rx="4" stroke="white" strokeWidth="5" opacity="0.7"/>
          <path d="M32 88 L50 62 L68 88 Z" stroke="white" strokeWidth="4.5" strokeLinejoin="round" fill="none" opacity="0.7"/>
          <line x1="50" y1="62" x2="50" y2="88" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
        </svg>
      )
    case 'listen':
      return (
        <svg {...p}>
          <circle cx="42" cy="72" r="22" stroke="white" strokeWidth="5" fill="none" opacity="0.7"/>
          <circle cx="42" cy="72" r="8" stroke="white" strokeWidth="3" fill="none" opacity="0.5"/>
          <line x1="56" y1="55" x2="78" y2="8" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
          <circle cx="78" cy="8" r="5.5" fill={color}/>
        </svg>
      )
    case 'read':
      return (
        <svg {...p}>
          <rect x="18" y="14" width="64" height="74" rx="3" stroke="white" strokeWidth="5" fill="none" opacity="0.7"/>
          <line x1="30" y1="14" x2="30" y2="88" stroke="white" strokeWidth="4.5" strokeLinecap="round" opacity="0.7"/>
          <path d="M56 14 L56 4 L64 10 L72 4 L72 14" stroke={color} strokeWidth="4" strokeLinejoin="round" fill="none"/>
        </svg>
      )
    case 'dine':
      return (
        <svg {...p}>
          <path d="M22 14 Q18 48 38 62 Q44 66 50 66 Q56 66 62 62 Q82 48 78 14" stroke="white" strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.7"/>
          <line x1="22" y1="14" x2="78" y2="14" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
          <line x1="50" y1="66" x2="50" y2="86" stroke="white" strokeWidth="4.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="28" y1="86" x2="72" y2="86" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
          <circle cx="50" cy="40" r="5" fill={color}/>
        </svg>
      )
    case 'do':
      return (
        <svg {...p}>
          <path d="M38 88 L68 24 L98 88" stroke="white" strokeWidth="4.5" strokeLinejoin="round" fill="none" opacity="0.6"/>
          <path d="M68 24 L58 44 L78 44 Z" fill={color}/>
          <path d="M2 88 L36 10 L70 88 Z" stroke="white" strokeWidth="5.5" strokeLinejoin="round" fill="none" opacity="0.7"/>
          <path d="M36 10 L24 34 L48 34 Z" fill={color}/>
          <line x1="2" y1="88" x2="98" y2="88" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
        </svg>
      )
    case 'visit':
      return (
        <svg {...p}>
          <line x1="22" y1="92" x2="22" y2="52" stroke="white" strokeWidth="5.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="78" y1="92" x2="78" y2="52" stroke="white" strokeWidth="5.5" strokeLinecap="round" opacity="0.7"/>
          <path d="M22 52 C22 30 34 10 50 8 C66 10 78 30 78 52" stroke="white" strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.7"/>
          <circle cx="50" cy="8" r="5" fill={color}/>
          <line x1="8" y1="92" x2="92" y2="92" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
        </svg>
      )
    default:
      return null
  }
}
