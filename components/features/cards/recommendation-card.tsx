'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCategoryBloom, CATEGORY_MAP } from '@/constants/categories'
import { hasValidImage } from '@/lib/utils/fallback'
import type { Recommendation, Category } from '@/lib/types'

type RecommendationCardProps = {
  recommendation: Recommendation
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { id, title, category, source_name, image_url, reaction, metadata } = recommendation
  const config = CATEGORY_MAP[category as Category]
  if (!config) return null

  const hasImage = hasValidImage(image_url)
  const meta = metadata as Record<string, unknown>

  const genre = Array.isArray(meta?.genres)
    ? (meta.genres as string[])[0]
    : typeof meta?.genres === 'string' ? meta.genres : null
  const year = meta?.release_year ?? meta?.year ?? null
  const runtime = meta?.runtime_minutes ? `${meta.runtime_minutes}min` : null
  const artist = meta?.artist ?? null

  const detailParts: string[] = []
  if (genre) detailParts.push(String(genre))
  if (year) detailParts.push(String(year))
  if (runtime) detailParts.push(runtime)
  if (artist) detailParts.push(String(artist))
  const detailLine = detailParts.slice(0, 3).join(' · ')

  return (
    <Link
      href={`/rec/${id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          width: '54px',
          minWidth: '54px',
          height: '68px',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: `inset 4px 0 0 ${config.vividColor}`,
        }}
      >
        {hasImage ? (
          <Image
            src={image_url!}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="54px"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: getCategoryBloom(category as Category),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: config.vividColor,
                opacity: 0.7,
              }}
            />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--f-title)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(242,230,205,0.95)',
            marginBottom: '3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'var(--f-body)',
            fontSize: '12px',
            fontWeight: 500,
            color: '#d41020',
            marginBottom: '3px',
          }}
        >
          From {source_name}
        </div>
        {detailLine && (
          <div
            style={{
              fontFamily: 'var(--f-body)',
              fontSize: '11px',
              fontWeight: 300,
              color: 'rgba(242,230,205,0.35)',
            }}
          >
            {detailLine}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {reaction && (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: reaction === 'loved' ? '#f43f5e'
                : reaction === 'good' ? '#10b981'
                : reaction === 'okay' ? '#f59e0b'
                : 'rgba(242,230,205,0.3)',
            }}
          />
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="rgba(242,230,205,0.2)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </Link>
  )
}

type MosaicTileProps = {
  category: Category
  count: number
  topTitle?: string
  topSource?: string
  topImageUrl?: string | null
  onClick?: () => void
}

export function MosaicTile({ category, count, topTitle, topSource, onClick }: MosaicTileProps) {
  const config = CATEGORY_MAP[category]
  if (!config) return null

  const isEmpty = count === 0

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '20px',
        height: '140px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        background: getCategoryBloom(category),
        boxShadow: `inset 5px 0 0 ${config.vividColor}`,
        transition: 'transform 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.015)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {count > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#1fce94',
            color: '#080f0a',
            fontFamily: 'var(--f-ui)',
            fontWeight: 700,
            fontSize: '11px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {count > 99 ? '99+' : count}
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--f-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: '22px',
          color: 'rgba(242,230,205,0.95)',
          lineHeight: 1.1,
        }}
      >
        {config.label}
      </div>

      <div>
        {isEmpty ? (
          <div
            style={{
              fontFamily: 'var(--f-body)',
              fontSize: '10px',
              fontWeight: 300,
              color: 'rgba(242,230,205,0.30)',
              lineHeight: 1.4,
            }}
          >
            {config.emptyBody.split(' ').slice(0, 8).join(' ')}…
          </div>
        ) : topTitle ? (
          <>
            <div
              style={{
                fontFamily: 'var(--f-title)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(242,230,205,0.85)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '2px',
              }}
            >
              {topTitle}
            </div>
            {topSource && (
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '10px', color: '#d41020', fontWeight: 500 }}>
                From {topSource}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
