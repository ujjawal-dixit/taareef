// components/ui/category-placeholder.tsx
// Shown when no image exists for a recommendation.
// Never a broken image. Always intentional — warm colour, category icon.
// This is the V1 visual for all cards without enriched images.

import { getCategoryConfig } from '@/constants/categories'
import type { Category } from '@/lib/types'

type CategoryPlaceholderProps = {
  category: Category
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

const sizeStyles = {
  sm:   'w-12 h-12 text-xl rounded-lg',
  md:   'w-20 h-20 text-3xl rounded-xl',
  lg:   'w-full h-full text-5xl rounded-xl',
  full: 'w-full h-full text-6xl rounded-none',
}

export function CategoryPlaceholder({
  category,
  size = 'lg',
  className = '',
}: CategoryPlaceholderProps) {
  const config = getCategoryConfig(category)

  return (
    <div
      className={[
        'flex items-center justify-center',
        'select-none',
        sizeStyles[size],
        className,
      ].join(' ')}
      style={{ backgroundColor: `${config.colourHex}20` }}  // 12% opacity background
      aria-hidden="true"
    >
      <span
        style={{ filter: 'saturate(0.8) brightness(0.9)' }}
        role="img"
        aria-label={config.label}
      >
        {config.icon}
      </span>
    </div>
  )
}
