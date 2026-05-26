'use client'

import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/constants/categories'
import { MosaicTile } from '@/components/features/cards/recommendation-card'
import type { Recommendation, Category } from '@/lib/types'

type DashboardClientProps = {
  recommendations: Recommendation[]
}

export function DashboardClient({ recommendations }: DashboardClientProps) {
  const router = useRouter()

  const categoryData = CATEGORIES.map((cat) => {
    const items = recommendations.filter((r) => r.category === cat.id)
    const top = items[0] ?? null
    return {
      id: cat.id as Category,
      count: items.length,
      topTitle: top?.title ?? undefined,
      topSource: top?.source_name ?? undefined,
      topImageUrl: top?.image_url ?? null,
    }
  })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '9px',
        padding: '0 16px 24px',
      }}
    >
      {categoryData.map((cat) => (
        <MosaicTile
          key={cat.id}
          category={cat.id}
          count={cat.count}
          topTitle={cat.topTitle}
          topSource={cat.topSource}
          topImageUrl={cat.topImageUrl}
          onClick={() => router.push(`/dashboard/${cat.id}`)}
        />
      ))}
    </div>
  )
}
