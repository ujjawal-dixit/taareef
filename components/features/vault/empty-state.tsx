// components/features/vault/empty-state.tsx
// Warm empty states for every category and the home screen.
// Never a blank screen. Never an apology.
// Always an invitation.

import { getCategoryConfig } from '@/constants/categories'
import { Button } from '@/components/ui/button'
import type { Category } from '@/lib/types'

type EmptyStateProps = {
  category?: Category   // if null — shows home screen empty state
  onAdd?: () => void
}

export function EmptyState({ category, onAdd }: EmptyStateProps) {
  if (!category) {
    return <HomeEmptyState onAdd={onAdd} />
  }

  const config = getCategoryConfig(category)

  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">

      {/* Category icon — large, warm colour */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-4xl"
        style={{ backgroundColor: `${config.colourHex}15` }}
        aria-hidden="true"
      >
        {config.icon}
      </div>

      {/* Headline */}
      <h2 className="font-display text-page text-neutral-900 mb-3">
        {config.emptyState.headline}
      </h2>

      {/* Body */}
      <p className="font-sans text-body text-neutral-500 leading-relaxed mb-8 max-w-xs">
        {config.emptyState.body}
      </p>

      {/* CTA */}
      {onAdd && (
        <Button
          variant="primary"
          size="md"
          onClick={onAdd}
        >
          {config.emptyState.cta}
        </Button>
      )}

    </div>
  )
}

// ============================================================
// HOME EMPTY STATE — shown before any saves exist
// ============================================================

function HomeEmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">

      {/* Illustration placeholder — the warmth of an empty shelf */}
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 text-5xl"
        style={{ backgroundColor: 'hsl(35, 25%, 93%)' }}
        aria-hidden="true"
      >
        ✦
      </div>

      <h2 className="font-display text-page text-neutral-900 mb-3">
        Your vault is waiting
      </h2>

      <p className="font-sans text-body text-neutral-500 leading-relaxed mb-8 max-w-xs">
        Every recommendation someone gives you — restaurants, films, books, music — all in one place. Start with one.
      </p>

      {onAdd && (
        <Button
          variant="primary"
          size="md"
          onClick={onAdd}
        >
          Save your first recommendation
        </Button>
      )}

    </div>
  )
}
