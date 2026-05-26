import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RecommendationCard } from '@/components/features/cards/recommendation-card'
import { EmptyState } from '@/components/features/vault/empty-state'
import { CATEGORY_MAP, getCategoryBloom } from '@/constants/categories'
import { isValidCategory } from '@/lib/types'
import type { Recommendation, Category } from '@/lib/types'

type PageProps = {
  params: { category: string }
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = params

  if (!isValidCategory(category)) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', category)
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })

  const items = (recommendations ?? []) as Recommendation[]
  const config = CATEGORY_MAP[category as Category]
  const hero = items[0] ?? null
  const rest = items.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: '#080f0a' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'var(--f-ui)',
            fontSize: '12px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#1fce94',
            textDecoration: 'none',
          }}
        >
          ← vault
        </Link>
      </div>

      <div style={{ padding: '10px 20px 0' }}>
        <h1
          style={{
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '38px',
            color: 'rgba(242,230,205,0.95)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
          }}
        >
          {config.label}
          <span
            style={{
              fontFamily: 'var(--f-body)',
              fontSize: '14px',
              fontWeight: 300,
              color: 'rgba(242,230,205,0.35)',
              fontStyle: 'normal',
            }}
          >
            {items.length}
          </span>
        </h1>
      </div>

      {items.length === 0 && (
        <div style={{ padding: '0 16px' }}>
          <EmptyState category={category as Category} />
        </div>
      )}

      {hero && (
        <Link
          href={`/rec/${hero.id}`}
          style={{
            display: 'block',
            margin: '14px 16px 0',
            borderRadius: '22px',
            height: '220px',
            overflow: 'hidden',
            position: 'relative',
            textDecoration: 'none',
            background: getCategoryBloom(category as Category),
            boxShadow: `inset 5px 0 0 ${config.vividColor}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '14px 18px 16px',
              background: 'linear-gradient(to top, rgba(8,15,10,0.96) 0%, rgba(8,15,10,0.6) 60%, transparent 100%)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--f-title)',
                fontSize: '17px',
                fontWeight: 700,
                color: 'rgba(242,230,205,0.95)',
                marginBottom: '5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {hero.title}
            </div>
            <div style={{ fontFamily: 'var(--f-body)', fontSize: '12px', fontWeight: 500, color: '#d41020' }}>
              From {hero.source_name}
            </div>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div style={{ padding: '12px 16px 100px' }}>
          {rest.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}

      <div style={{ height: '100px' }} />
    </div>
  )
}
