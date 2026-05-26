'use client'

import { getCategoryBloom, CATEGORIES } from '@/constants/categories'
import type { Category } from '@/lib/types'

type EmptyStateProps = {
  category: Category
  onSave?: () => void
}

export function EmptyState({ category, onSave }: EmptyStateProps) {
  const config = CATEGORIES.find((c) => c.id === category)
  if (!config) return null

  const bloom = getCategoryBloom(category)

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bloom,
          opacity: 0.12,
          borderRadius: '16px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: bloom,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: `0 0 40px ${config.vividColor}30`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <CategoryIcon category={category} color={config.vividColor} />
      </div>

      <h2
        style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: '26px',
          color: 'rgba(242, 230, 205, 0.95)',
          lineHeight: 1.2,
          marginBottom: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {config.emptyHeadline}
      </h2>

      <p
        style={{
          fontFamily: 'var(--f-body)',
          fontSize: '14px',
          fontWeight: 300,
          color: 'rgba(242, 230, 205, 0.50)',
          lineHeight: 1.7,
          maxWidth: '260px',
          marginBottom: '32px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {config.emptyBody}
      </p>

      {onSave && (
        <button
          onClick={onSave}
          style={{
            fontFamily: 'var(--f-ui)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: config.vividColor,
            background: 'transparent',
            border: `1px solid ${config.vividColor}55`,
            borderRadius: '24px',
            padding: '10px 24px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {config.emptyCta}
        </button>
      )}
    </div>
  )
}

function CategoryIcon({ category, color }: { category: Category; color: string }) {
  const p = {
    width: '36' as const,
    height: '36' as const,
    viewBox: '0 0 100 100',
    fill: 'none' as const,
    xmlns: 'http://www.w3.org/2000/svg',
  }

  switch (category) {
    case 'watch':
      return (
        <svg {...p}>
          <rect x="22" y="8" width="56" height="84" rx="5" stroke="white" strokeWidth="3" opacity="0.7"/>
          <line x1="22" y1="64" x2="78" y2="64" stroke={color} strokeWidth="2.5" strokeDasharray="5,4"/>
          <circle cx="50" cy="26" r="7" stroke="white" strokeWidth="2.5" opacity="0.7"/>
        </svg>
      )
    case 'listen':
      return (
        <svg {...p}>
          <rect x="8" y="26" width="84" height="48" rx="6" stroke="white" strokeWidth="3" opacity="0.7"/>
          <rect x="20" y="36" width="60" height="24" rx="4" stroke="white" strokeWidth="2.5" opacity="0.5"/>
          <circle cx="38" cy="48" r="8" stroke="white" strokeWidth="2.5" opacity="0.7"/>
          <circle cx="38" cy="48" r="3.5" fill={color}/>
          <circle cx="62" cy="48" r="8" stroke="white" strokeWidth="2.5" opacity="0.7"/>
          <circle cx="62" cy="48" r="3.5" fill={color}/>
        </svg>
      )
    case 'read':
      return (
        <svg {...p}>
          <rect x="22" y="16" width="56" height="72" rx="3" stroke="white" strokeWidth="3" opacity="0.7"/>
          <line x1="32" y1="16" x2="32" y2="88" stroke="white" strokeWidth="3" opacity="0.5"/>
          <path d="M56,16 L56,6 L62,12 L68,6 L68,16" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
        </svg>
      )
    case 'eat':
      return (
        <svg {...p}>
          <rect x="16" y="14" width="68" height="72" rx="5" stroke="white" strokeWidth="3" opacity="0.7"/>
          <line x1="16" y1="44" x2="84" y2="44" stroke="white" strokeWidth="2.5" opacity="0.5"/>
          <rect x="16" y="72" width="68" height="14" rx="3" stroke="white" strokeWidth="2.5" opacity="0.5"/>
          <circle cx="38" cy="77" r="2.5" fill={color}/>
          <circle cx="50" cy="77" r="2.5" fill={color}/>
          <circle cx="62" cy="77" r="2.5" fill={color}/>
        </svg>
      )
    case 'drink':
      return (
        <svg {...p}>
          <path d="M14,18 Q16,60 50,64 Q84,60 86,18" stroke="white" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round"/>
          <line x1="14" y1="18" x2="86" y2="18" stroke="white" strokeWidth="2.5" opacity="0.7" strokeLinecap="round"/>
          <line x1="50" y1="64" x2="50" y2="84" stroke="white" strokeWidth="3" opacity="0.7" strokeLinecap="round"/>
          <line x1="30" y1="84" x2="70" y2="84" stroke="white" strokeWidth="3" opacity="0.7" strokeLinecap="round"/>
          <circle cx="50" cy="40" r="5" fill={color}/>
        </svg>
      )
    case 'go':
      return (
        <svg {...p}>
          <rect x="8" y="22" width="84" height="56" rx="5" stroke="white" strokeWidth="3" opacity="0.7"/>
          <line x1="48" y1="22" x2="48" y2="78" stroke="white" strokeWidth="2" opacity="0.4"/>
          <rect x="64" y="28" width="20" height="22" rx="2" fill={color} opacity="0.8"/>
          <line x1="15" y1="35" x2="42" y2="35" stroke="white" strokeWidth="2" opacity="0.5"/>
          <line x1="15" y1="45" x2="42" y2="45" stroke="white" strokeWidth="2" opacity="0.4"/>
        </svg>
      )
    case 'do':
      return (
        <svg {...p}>
          <rect x="8" y="36" width="68" height="28" rx="14" stroke="white" strokeWidth="3" opacity="0.7"/>
          <path d="M76,42 L90,42 L90,58 L76,58" stroke="white" strokeWidth="2.5" strokeLinejoin="round" opacity="0.7"/>
          <circle cx="28" cy="50" r="3" fill={color}/>
          <circle cx="44" cy="50" r="3" fill={color}/>
          <circle cx="60" cy="50" r="3" fill={color}/>
        </svg>
      )
    case 'see':
      return (
        <svg {...p}>
          <rect x="8" y="20" width="84" height="60" rx="5" stroke="white" strokeWidth="3" opacity="0.7"/>
          <line x1="30" y1="20" x2="30" y2="80" stroke="white" strokeWidth="2" opacity="0.5" strokeDasharray="5,4"/>
          <circle cx="19" cy="50" r="8" stroke={color} strokeWidth="2.5"/>
          <line x1="38" y1="34" x2="82" y2="34" stroke="white" strokeWidth="2.5" opacity="0.6"/>
          <line x1="38" y1="46" x2="74" y2="46" stroke="white" strokeWidth="2" opacity="0.4"/>
        </svg>
      )
    default:
      return null
  }
}
