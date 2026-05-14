// components/features/vault/empty-state.tsx
// Warm empty states for all 10 categories plus the home state.
// Every empty state is an invitation, never an apology.
// Neon gem icon when no category — category colour when filtered.

import { getCategoryConfig, type CategoryId } from '@/constants/categories'
import type { Category } from '@/lib/types'

type EmptyStateProps = {
  category?: Category
  onAdd?:    () => void
}

export function EmptyState({ category, onAdd }: EmptyStateProps) {
  if (!category) return <HomeEmpty onAdd={onAdd} />

  const config = getCategoryConfig(category as CategoryId)

  return (
    <div className="empty-state">
      {/* Category gem — glows in category colour */}
      <div
        className="empty-gem"
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle at 44% 36%, ${config.colourHex}20 0%, ${config.colourHex}04 100%)`,
          border:     `1px solid ${config.colourHex}25`,
          boxShadow:  `0 0 40px ${config.colourHex}0d`,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          stroke={config.colourHex}
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '26px', height: '26px', opacity: 0.75 }}
        >
          <path d="M6 3h12l4 6-10 13L2 9z"/>
          <path d="M2 9h20M12 3l4 6M12 3l-4 6"/>
        </svg>
      </div>

      <h2 className="empty-title">{config.emptyState.headline}</h2>
      <p  className="empty-body">{config.emptyState.body}</p>

      {onAdd && (
        <button
          onClick={onAdd}
          style={{
            background:   config.colourHex,
            color:        '#080f0a',
            fontFamily:   'var(--f-title)',
            fontSize:     '14px',
            fontWeight:   700,
            letterSpacing:'0.06em',
            textTransform:'uppercase',
            padding:      '12px 22px',
            borderRadius: '10px',
            border:       'none',
            cursor:       'pointer',
            boxShadow:    `0 4px 16px ${config.colourHex}40`,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {config.emptyState.cta}
        </button>
      )}
    </div>
  )
}

function HomeEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="empty-state">
      {/* Neon gem — matches brand and FAB */}
      <div className="empty-gem" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '26px', height: '26px' }}
        >
          <path d="M6 3h12l4 6-10 13L2 9z"/>
          <path d="M2 9h20M12 3l4 6M12 3l-4 6"/>
        </svg>
      </div>

      <h2 className="empty-title">Your vault is waiting</h2>
      <p className="empty-body">
        Every recommendation someone gives you — restaurants, films, music, books — one place, with who told you, always.
      </p>

      {/* Invitation — hairlines + neon text. WKW never shouts. */}
      {onAdd && (
        <button
          onClick={onAdd}
          className="invite"
          style={{ background: 'none', border: 'none' }}
          aria-label="Save your first recommendation"
        >
          <div className="invite-line" aria-hidden="true" />
          <span className="invite-text">Save your first one</span>
          <div className="invite-line" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
