'use client'

// app/(app)/rec/[id]/rec-detail-client.tsx
// Back button: neon green "← vault" — destination is home, home gets the neon.
// Full detail. Mark experienced. Reaction. Tell source. Notes.

import { useState, useRef }          from 'react'
import { useRouter }                  from 'next/navigation'
import { useUpdateRecommendation }    from '@/hooks/use-recommendations'
import { useToast }                   from '@/components/ui/toast'
import type { Recommendation, Reaction } from '@/lib/types'
import type { CategoryConfig }           from '@/constants/categories'

type Props = {
  recommendation: Recommendation
  categoryConfig: CategoryConfig
}

const REACTIONS: { value: Reaction; emoji: string; label: string }[] = [
  { value: 'loved', emoji: '😍', label: 'Loved it' },
  { value: 'good',  emoji: '👍', label: 'Good'      },
  { value: 'okay',  emoji: '😐', label: 'Okay'      },
  { value: 'skip',  emoji: '👎', label: 'Skip it'   },
]

export function RecDetailClient({ recommendation: init, categoryConfig: cfg }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const { update, isLoading } = useUpdateRecommendation()
  const [rec,        setRec]        = useState(init)
  const [notesDirty, setNotesDirty] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const col      = cfg.colourHex
  const isExperienced = rec.status !== 'saved'

  async function markExperienced() {
    const r = await update(rec.id, { status: 'experienced' })
    if (r) { setRec(r); toast(`Marked as ${cfg.verb} ✦`, 'success') }
  }

  async function setReaction(reaction: Reaction) {
    const r = await update(rec.id, { reaction })
    if (r) {
      setRec(r)
      if (reaction === 'loved' || reaction === 'good') {
        toast(`Tell ${rec.source_name}?`, 'info')
      }
    }
  }

  async function saveNotes() {
    if (!notesDirty) return
    const val = notesRef.current?.value.trim() ?? ''
    const r   = await update(rec.id, { notes: val })
    if (r) { setRec(r); setNotesDirty(false) }
  }

  function shareWithSource() {
    const msg = rec.reaction === 'loved'
      ? `Finally ${cfg.verb} ${rec.title} — you were so right. Thank you ❤️`
      : `${cfg.verb.charAt(0).toUpperCase() + cfg.verb.slice(1)} ${rec.title} — it was great! Thanks for the rec`
    if (navigator.share) {
      navigator.share({ text: msg }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(msg)
        .then(() => toast('Message copied!', 'success'))
    }
  }

  return (
    <div style={{
      maxWidth:      '430px',
      margin:        '0 auto',
      minHeight:     '100dvh',
      background:    '#080f0a',
      paddingBottom: '48px',
    }}>

      {/* ── BACK BUTTON ─────────────────────────────────────────
          Destination: vault (home). Colour: neon.
          Larger touch target: 44px height minimum.
          "← vault" — specific, not generic "back".
          The arrow is part of the label, not decoration.
      ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '52px 20px 0' }}>
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Back to vault"
          style={{
            display:                 'flex',
            alignItems:              'center',
            gap:                     '6px',
            color:                   '#1fce94',
            fontFamily:              'var(--font-rajdhani), system-ui, sans-serif',
            fontSize:                '13px',
            fontWeight:              700,
            letterSpacing:           '0.06em',
            textTransform:           'uppercase',
            minHeight:               '44px',
            WebkitTapHighlightColor: 'transparent',
            textShadow:              '0 0 12px rgba(31,206,148,0.40)',
            transition:              'opacity 160ms ease',
          }}
        >
          <svg
            width="16" height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          vault
        </button>
      </div>

      {/* ── IMAGE ZONE ──────────────────────────────────────── */}
      <div style={{
        margin:       '16px 16px 0',
        height:       '200px',
        borderRadius: '18px',
        overflow:     'hidden',
        position:     'relative',
        background:   `linear-gradient(148deg, ${col}20 0%, ${col}06 100%)`,
        border:       `1px solid ${col}22`,
      }}>
        {rec.image_url && (
          <img
            src={rec.image_url}
            alt={rec.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Category badge */}
        <div style={{
          position:             'absolute', top: '12px', left: '14px',
          background:           cfg.badgeBg,
          border:               `0.5px solid ${cfg.badgeBorder}`,
          borderRadius:         '6px', padding: '3px 10px',
          fontFamily:           'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:             '9px', fontWeight: 700,
          letterSpacing:        '0.08em', textTransform: 'uppercase',
          color:                'rgba(240,230,200,0.95)',
          backdropFilter:       'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>
          {cfg.label}
        </div>

        {/* Experienced badge */}
        {isExperienced && (
          <div style={{
            position:   'absolute', top: '12px', right: '14px',
            background: 'rgba(31,206,148,0.12)',
            border:     '0.5px solid rgba(31,206,148,0.30)',
            borderRadius: '6px', padding: '3px 10px',
            fontFamily:   'var(--font-rajdhani), system-ui, sans-serif',
            fontSize:     '9px', fontWeight: 700,
            letterSpacing:'0.08em', textTransform: 'uppercase',
            color:        '#1fce94',
          }}>
            {cfg.verb}
          </div>
        )}
      </div>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 0' }}>

        <h1 style={{
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '26px', fontWeight: 700,
          letterSpacing: '0.02em',
          color:         'rgba(240,230,200,0.95)',
          lineHeight:    1.1, marginBottom: '6px',
        }}>
          {rec.title}
        </h1>

        <p style={{
          fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:     '13px', fontWeight: 600,
          color:        '#c8151e', marginBottom: '20px',
        }}>
          From {rec.source_name}
        </p>

        <div style={{ height: '0.5px', background: 'rgba(240,230,200,0.07)', marginBottom: '20px' }} />

        {/* Mark experienced */}
        {!isExperienced && (
          <button
            onClick={markExperienced}
            disabled={isLoading}
            style={{
              width:         '100%', height: '50px',
              borderRadius:  '12px',
              border:        `1px solid ${col}35`,
              background:    `${col}10`,
              color:         col,
              fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
              fontSize:      '14px', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor:        isLoading ? 'not-allowed' : 'pointer',
              opacity:       isLoading ? 0.6 : 1,
              marginBottom:  '20px',
              WebkitTapHighlightColor: 'transparent',
              transition:    'background 160ms ease',
            }}
          >
            {isLoading ? 'Updating...' : `I ${cfg.verb} this`}
          </button>
        )}

        {/* Reaction grid */}
        {isExperienced && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
              fontSize:      '10px', fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color:         'rgba(240,230,200,0.35)', marginBottom: '12px',
            }}>
              How was it?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {REACTIONS.map(r => {
                const sel = rec.reaction === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => setReaction(r.value)}
                    disabled={isLoading}
                    aria-pressed={sel}
                    style={{
                      display:       'flex', flexDirection: 'column',
                      alignItems:    'center', gap: '4px',
                      padding:       '10px 4px', borderRadius: '10px',
                      border:        `1px solid ${sel ? 'rgba(31,206,148,0.40)' : 'rgba(240,230,200,0.09)'}`,
                      background:    sel ? 'rgba(31,206,148,0.08)' : 'rgba(240,230,200,0.025)',
                      cursor:        'pointer', transition: 'all 160ms ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{r.emoji}</span>
                    <span style={{
                      fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
                      fontSize:      '8px', fontWeight: 700,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      color:         sel ? '#1fce94' : 'rgba(240,230,200,0.35)',
                    }}>
                      {r.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tell source — loved or good only */}
            {(rec.reaction === 'loved' || rec.reaction === 'good') && (
              <div style={{
                marginTop:    '16px', padding: '14px 16px',
                borderRadius: '12px',
                background:   'rgba(31,206,148,0.05)',
                border:       '1px solid rgba(31,206,148,0.14)',
                display:      'flex', alignItems: 'center',
                justifyContent:'space-between', gap: '12px',
              }}>
                <div>
                  <p style={{
                    fontFamily:   'var(--font-cormorant), Georgia, serif',
                    fontStyle:    'italic', fontSize: '16px', fontWeight: 400,
                    color:        'rgba(240,230,200,0.90)', marginBottom: '2px',
                  }}>
                    Tell {rec.source_name}?
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                    fontSize:   '11px', color: 'rgba(240,230,200,0.35)',
                  }}>
                    Let them know their rec landed.
                  </p>
                </div>
                <button
                  onClick={shareWithSource}
                  style={{
                    background:    '#1fce94', color: '#080f0a',
                    fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
                    fontSize:      '11px', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding:       '8px 14px', borderRadius: '8px', border: 'none',
                    cursor:        'pointer', flexShrink: 0,
                    WebkitTapHighlightColor: 'transparent',
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
            fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:      '10px', fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color:         'rgba(240,230,200,0.35)', marginBottom: '10px',
          }}>
            Your note
          </p>
          <textarea
            ref={notesRef}
            defaultValue={rec.notes ?? ''}
            placeholder="One thing to remember..."
            rows={3}
            onChange={() => setNotesDirty(true)}
            onBlur={saveNotes}
            style={{
              width:        '100%',
              background:   'rgba(240,230,200,0.04)',
              border:       '1px solid rgba(240,230,200,0.10)',
              borderRadius: '10px', padding: '12px 14px',
              fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
              fontSize:     '14px', color: 'rgba(240,230,200,0.92)',
              outline:      'none', resize: 'none', lineHeight: 1.6,
              caretColor:   '#1fce94',
            }}
          />
        </div>

        {/* Metadata */}
        <div style={{
          marginTop:  '24px', display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '11px', color: 'rgba(240,230,200,0.25)',
        }}>
          <span>
            Saved {new Date(rec.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
          <span style={{ textTransform: 'capitalize' }}>{rec.source_type}</span>
        </div>

      </div>
    </div>
  )
}
