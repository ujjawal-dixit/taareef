'use client'

// app/(app)/rec/[id]/rec-detail-client.tsx
// Card detail view — interactive.
// Shows all fields. Mark experienced. Set reaction. Notes.
// "Tell [source]?" only on loved/good — never okay/skip.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUpdateRecommendation } from '@/hooks/use-recommendations'
import { useToast }                from '@/components/ui/toast'
import type { Recommendation, Reaction } from '@/lib/types'
import type { CategoryConfig }          from '@/constants/categories'

type Props = {
  recommendation: Recommendation
  categoryConfig: CategoryConfig
}

const REACTION_OPTIONS: { value: Reaction; label: string; emoji: string }[] = [
  { value: 'loved', label: 'Loved it', emoji: '😍' },
  { value: 'good',  label: 'Good',     emoji: '👍' },
  { value: 'okay',  label: 'Okay',     emoji: '😐' },
  { value: 'skip',  label: 'Skip it',  emoji: '👎' },
]

export function RecDetailClient({ recommendation: initialRec, categoryConfig }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const { update, isLoading } = useUpdateRecommendation()

  const [rec, setRec] = useState(initialRec)

  const isExperienced = rec.status !== 'saved'
  const col = categoryConfig.colourHex

  async function handleMarkExperienced() {
    const result = await update(rec.id, { status: 'experienced' })
    if (result) {
      setRec(result)
      toast(`Marked as ${categoryConfig.verb} ✦`, 'success')
    }
  }

  async function handleReaction(reaction: Reaction) {
    const result = await update(rec.id, { reaction })
    if (result) {
      setRec(result)
      // "Tell source?" prompt — only loved/good
      if (reaction === 'loved' || reaction === 'good') {
        toast(`Tell ${rec.source_name}?`, 'info')
      }
    }
  }

  async function handleNotesUpdate(notes: string) {
    const result = await update(rec.id, { notes })
    if (result) setRec(result)
  }

  return (
    <div
      style={{
        maxWidth: '430px',
        margin:   '0 auto',
        minHeight:'100dvh',
        background:'var(--bg0)',
        paddingBottom: '40px',
      }}
    >
      {/* Back button */}
      <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '6px',
            color:      'var(--t3)',
            fontFamily: 'var(--f-body)',
            fontSize:   '12px',
            letterSpacing: '0.04em',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
      </div>

      {/* Card image */}
      <div
        style={{
          margin:   '20px 16px 0',
          height:   '220px',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          background: `linear-gradient(148deg, ${col}18 0%, ${col}06 100%)`,
          border: `1px solid ${col}20`,
        }}
      >
        {rec.image_url && (
          <img
            src={rec.image_url}
            alt={rec.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Category badge */}
        <div
          style={{
            position:   'absolute', top: '12px', left: '14px',
            background: categoryConfig.badgeBg,
            border:     `0.5px solid ${categoryConfig.badgeBorder}`,
            borderRadius: '6px',
            padding:    '3px 9px',
            fontFamily: 'var(--f-title)',
            fontSize:   '9px', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'rgba(240,230,200,0.95)',
          }}
        >
          {categoryConfig.label}
        </div>

        {/* Status badge */}
        {isExperienced && (
          <div
            style={{
              position:   'absolute', top: '12px', right: '14px',
              background: 'rgba(31,206,148,0.15)',
              border:     '0.5px solid rgba(31,206,148,0.30)',
              borderRadius: '6px',
              padding:    '3px 9px',
              fontFamily: 'var(--f-title)',
              fontSize:   '9px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--neon)',
            }}
          >
            {categoryConfig.verb}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 0' }}>

        {/* Title + source */}
        <h1 style={{
          fontFamily:    'var(--f-title)',
          fontSize:      '28px', fontWeight: 700,
          letterSpacing: '0.03em', color: 'var(--t1)',
          lineHeight:    1.1, marginBottom: '6px',
        }}>
          {rec.title}
        </h1>

        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize:   '14px', fontWeight: 500,
          color:      'var(--signal)',
          marginBottom: '20px',
        }}>
          From {rec.source_name}
        </p>

        <div
          style={{
            height: '0.5px',
            background: 'linear-gradient(to right, rgba(240,230,200,0.12), transparent)',
            marginBottom: '20px',
          }}
        />

        {/* Mark experienced button — only if saved */}
        {!isExperienced && (
          <button
            onClick={handleMarkExperienced}
            disabled={isLoading}
            style={{
              width:         '100%',
              padding:       '14px',
              borderRadius:  '12px',
              border:        `1px solid ${col}35`,
              background:    `${col}12`,
              color:         col,
              fontFamily:    'var(--f-title)',
              fontSize:      '15px', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor:        isLoading ? 'not-allowed' : 'pointer',
              opacity:       isLoading ? 0.6 : 1,
              marginBottom:  '20px',
              WebkitTapHighlightColor: 'transparent',
              transition:    'background 160ms ease',
            }}
          >
            {isLoading ? 'Updating...' : `I ${categoryConfig.verb} this`}
          </button>
        )}

        {/* Reaction grid — only after experiencing */}
        {isExperienced && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontFamily:    'var(--f-body)',
              fontSize:      '11px', fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color:         'var(--t3)', marginBottom: '12px',
            }}>
              How was it?
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}>
              {REACTION_OPTIONS.map(opt => {
                const isSelected = rec.reaction === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleReaction(opt.value)}
                    disabled={isLoading}
                    aria-pressed={isSelected}
                    aria-label={opt.label}
                    style={{
                      display:        'flex',
                      flexDirection:  'column',
                      alignItems:     'center',
                      gap:            '4px',
                      padding:        '10px 4px',
                      borderRadius:   '10px',
                      border:         isSelected ? '1px solid rgba(31,206,148,0.40)' : '1px solid rgba(240,230,200,0.10)',
                      background:     isSelected ? 'rgba(31,206,148,0.10)' : 'rgba(240,230,200,0.03)',
                      cursor:         'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition:     'all 160ms ease',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                    <span style={{
                      fontFamily:    'var(--f-title)',
                      fontSize:      '8px', fontWeight: 700,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      color:         isSelected ? 'var(--neon)' : 'var(--t3)',
                    }}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tell source — only on loved/good */}
            {(rec.reaction === 'loved' || rec.reaction === 'good') && (
              <div
                style={{
                  marginTop:    '16px',
                  padding:      '14px 16px',
                  borderRadius: '10px',
                  background:   'rgba(31,206,148,0.06)',
                  border:       '1px solid rgba(31,206,148,0.16)',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{
                    fontFamily:    'var(--f-body)',
                    fontSize:      '13px', fontWeight: 500,
                    color:         'var(--t1)', marginBottom: '2px',
                  }}>
                    Tell {rec.source_name}?
                  </p>
                  <p style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: 'var(--t3)' }}>
                    Let them know their recommendation landed.
                  </p>
                </div>
                <button
                  style={{
                    background:    'var(--neon)',
                    color:         '#080f0a',
                    fontFamily:    'var(--f-title)',
                    fontSize:      '11px', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding:       '8px 14px',
                    borderRadius:  '8px',
                    border:        'none',
                    cursor:        'pointer',
                    flexShrink:    0,
                    marginLeft:    '12px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={() => {
                    const msg = rec.reaction === 'loved'
                      ? `Finally ${categoryConfig.verb} ${rec.title} — you were so right. Thank you ❤️`
                      : `${categoryConfig.verb.charAt(0).toUpperCase() + categoryConfig.verb.slice(1)} ${rec.title} — it was great! Thanks for the rec`
                    // Native share sheet
                    if (navigator.share) {
                      navigator.share({ text: msg }).catch(() => {})
                    } else {
                      navigator.clipboard.writeText(msg)
                        .then(() => alert('Message copied!'))
                        .catch(() => {})
                    }
                  }}
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <p style={{
            fontFamily:    'var(--f-body)',
            fontSize:      '11px', fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color:         'var(--t3)', marginBottom: '10px',
          }}>
            Your note
          </p>
          <textarea
            defaultValue={rec.notes ?? ''}
            placeholder="One thing to remember..."
            rows={3}
            onBlur={e => {
              const val = e.target.value.trim()
              if (val !== (rec.notes ?? '')) handleNotesUpdate(val)
            }}
            style={{
              width:        '100%',
              background:   'rgba(240,230,200,0.04)',
              border:       '1px solid rgba(240,230,200,0.11)',
              borderRadius: '10px',
              padding:      '12px 14px',
              fontFamily:   'var(--f-body)',
              fontSize:     '14px',
              color:        'var(--t1)',
              outline:      'none',
              resize:       'none',
              lineHeight:   1.6,
            }}
          />
        </div>

        {/* Metadata */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: 'var(--t3)' }}>
              Saved {new Date(rec.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
            <p style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: 'var(--t3)' }}>
              {rec.source_type}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
