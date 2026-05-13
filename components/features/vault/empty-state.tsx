// components/features/vault/empty-state.tsx
// Warm empty states — an invitation, never an apology.
// Vertically centred in the available viewport space.
// Wong Kar-wai warmth: rich icon backgrounds, editorial typography.

import { getCategoryConfig } from '@/constants/categories'
import type { Category } from '@/lib/types'

type EmptyStateProps = {
  category?: Category
  onAdd?:    () => void
}

export function EmptyState({ category, onAdd }: EmptyStateProps) {
  if (!category) return <HomeEmptyState onAdd={onAdd} />

  const config = getCategoryConfig(category)

  return (
    <div className="empty-state">

      {/* Icon */}
      <div
        aria-hidden="true"
        style={{
          width:           '80px',
          height:          '80px',
          borderRadius:    '22px',
          backgroundColor: `${config.colourHex}14`,
          border:          `1px solid ${config.colourHex}22`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        '36px',
          marginBottom:    '28px',
        }}
      >
        {config.icon}
      </div>

      {/* Headline */}
      <h2 style={{
        fontFamily:    'var(--font-fraunces), Georgia, serif',
        fontSize:      '22px',
        fontWeight:    '600',
        color:         'var(--text-primary)',
        margin:        '0 0 12px',
        letterSpacing: '-0.01em',
        lineHeight:    '1.2',
      }}>
        {config.emptyState.headline}
      </h2>

      {/* Body */}
      <p style={{
        fontFamily:  'var(--font-dm-sans), system-ui, sans-serif',
        fontSize:    '15px',
        color:       'var(--text-secondary)',
        lineHeight:  '1.6',
        margin:      '0 0 36px',
        maxWidth:    '260px',
      }}>
        {config.emptyState.body}
      </p>

      {/* CTA */}
      {onAdd && (
        <button
          onClick={onAdd}
          style={{
            backgroundColor: 'var(--primary)',
            color:           'white',
            fontFamily:      'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:        '15px',
            fontWeight:      '600',
            padding:         '13px 24px',
            borderRadius:    '12px',
            border:          'none',
            cursor:          'pointer',
            boxShadow:       '0 4px 12px rgba(196,74,40,0.35)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {config.emptyState.cta}
        </button>
      )}
    </div>
  )
}

function HomeEmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="empty-state">

      {/* Icon */}
      <div
        aria-hidden="true"
        style={{
          width:           '80px',
          height:          '80px',
          borderRadius:    '22px',
          backgroundColor: 'rgba(196,74,40,0.08)',
          border:          '1px solid rgba(196,74,40,0.14)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        '36px',
          marginBottom:    '28px',
        }}
      >
        ✦
      </div>

      <h2 style={{
        fontFamily:    'var(--font-fraunces), Georgia, serif',
        fontSize:      '22px',
        fontWeight:    '600',
        color:         'var(--text-primary)',
        margin:        '0 0 12px',
        letterSpacing: '-0.01em',
        lineHeight:    '1.2',
      }}>
        Your vault is waiting
      </h2>

      <p style={{
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        fontSize:   '15px',
        color:      'var(--text-secondary)',
        lineHeight: '1.65',
        margin:     '0 0 36px',
        maxWidth:   '260px',
      }}>
        Every recommendation someone gives you — restaurants, films, books, music — all in one place. Start with one.
      </p>

      {onAdd && (
        <button
          onClick={onAdd}
          style={{
            backgroundColor: 'var(--primary)',
            color:           'white',
            fontFamily:      'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:        '15px',
            fontWeight:      '600',
            padding:         '13px 24px',
            borderRadius:    '12px',
            border:          'none',
            cursor:          'pointer',
            boxShadow:       '0 4px 12px rgba(196,74,40,0.35)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Save your first recommendation
        </button>
      )}
    </div>
  )
}
