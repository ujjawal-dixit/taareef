// components/ui/card-skeleton.tsx
// Warm loading skeletons for recommendation cards.
// Matches the exact proportions of the real cards — no layout shift on load.
// Two variants: poster (visual categories) and split (physical place categories).

type CardSkeletonVariant = 'poster' | 'split'

type CardSkeletonProps = {
  variant?: CardSkeletonVariant
  className?: string
}

export function CardSkeleton({
  variant = 'poster',
  className = '',
}: CardSkeletonProps) {
  if (variant === 'split') {
    return <SplitCardSkeleton className={className} />
  }
  return <PosterCardSkeleton className={className} />
}

// ============================================================
// POSTER CARD SKELETON
// Visual categories: Film, TV, Music, Book, Person, Podcast, City
// Image top 38%, content below
// ============================================================

function PosterCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      aria-label="Loading recommendation"
      className={[
        'card-base overflow-hidden',
        className,
      ].join(' ')}
    >
      {/* Image placeholder */}
      <div className="skeleton w-full" style={{ paddingTop: '38%' }} />

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Category chip */}
        <div className="skeleton h-5 w-16 rounded-full" />

        {/* Title */}
        <div className="flex flex-col gap-2">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-5 w-1/2 rounded" />
        </div>

        {/* Source — always terracotta position */}
        <div className="skeleton h-4 w-24 rounded" />

        {/* Signal */}
        <div className="skeleton h-4 w-32 rounded" />
      </div>
    </div>
  )
}

// ============================================================
// SPLIT CARD SKELETON
// Physical place categories: Restaurant, Bar, Activity
// Text leads, no image in list view
// ============================================================

function SplitCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      aria-label="Loading recommendation"
      className={[
        'card-base overflow-hidden',
        className,
      ].join(' ')}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Category chip */}
        <div className="skeleton h-5 w-20 rounded-full" />

        {/* Title */}
        <div className="flex flex-col gap-2">
          <div className="skeleton h-5 w-4/5 rounded" />
        </div>

        {/* Source */}
        <div className="skeleton h-4 w-28 rounded" />

        {/* Two signals */}
        <div className="flex gap-2">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CARD SKELETON LIST
// Renders multiple skeletons for initial page load
// ============================================================

type CardSkeletonListProps = {
  count?: number
  variant?: CardSkeletonVariant
  className?: string
}

export function CardSkeletonList({
  count = 3,
  variant = 'poster',
  className = '',
}: CardSkeletonListProps) {
  return (
    <div
      className={['flex flex-col gap-3', className].join(' ')}
      aria-label="Loading recommendations"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} variant={variant} />
      ))}
    </div>
  )
}
