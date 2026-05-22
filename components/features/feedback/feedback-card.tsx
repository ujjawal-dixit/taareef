'use client'

// components/features/feedback/feedback-card.tsx
// Lives on the profile page — always visible, never interrupts.
// Four emotional modes. Resets after submission.
// Sends to founder email via Resend.

import { useState } from 'react'

type FeedbackMode = 'delighted' | 'frustrated' | 'want-something' | 'thought'

const MODES: {
  value:       FeedbackMode
  symbol:      string
  label:       string
  sublabel:    string
  placeholder: string
  colour:      string
  textColour:  string
}[] = [
  {
    value:      'delighted',
    symbol:     '✦',
    label:      'Something delighted me',
    sublabel:   'A moment, a detail, something that just worked',
    placeholder:"When I saved my first recommendation and saw 'From Ahmed' in red... that was it. That is the product.",
    colour:     '#1fce94',
    textColour: '#080f0a',
  },
  {
    value:      'frustrated',
    symbol:     '◌',
    label:      'Something frustrated me',
    sublabel:   'Honest friction. We need to hear this.',
    placeholder:"Every time I try to do X, I have to Y first and it breaks the feeling...",
    colour:     '#c8151e',
    textColour: '#fff',
  },
  {
    value:      'want-something',
    symbol:     '→',
    label:      'I want something new',
    sublabel:   'A feature, a capability, an idea you keep wishing existed',
    placeholder:"I keep wishing I could forward a WhatsApp message directly to taareef and have it save...",
    colour:     '#b87820',
    textColour: '#fff',
  },
  {
    value:      'thought',
    symbol:     '◦',
    label:      'I have a thought',
    sublabel:   'Anything else. We read everything.',
    placeholder:"Not sure where this fits but...",
    colour:     'rgba(240,230,200,0.55)',
    textColour: '#080f0a',
  },
]

type Props = {
  userEmail: string
  userName:  string
  saveCount: number
  topSource: string | null
  onDismiss: () => void
}

export function FeedbackCard({ userEmail, userName, saveCount, topSource }: Props) {
  const [mode,    setMode]    = useState<FeedbackMode | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  const selected = MODES.find(m => m.value === mode)
  const canSend  = mode !== null && message.trim().length > 8

  async function handleSend() {
    if (!canSend || sending) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userEmail, userName, saveCount, topSource,
          mode, modeLabel: selected?.label,
          message: message.trim(),
        }),
      })
      setSent(true)
    } catch {
      setSending(false)
    }
  }

  function reset() {
    setMode(null)
    setMessage('')
    setSent(false)
    setSending(false)
  }

  const firstName = userName.split(' ')[0]
  const opening   = topSource && saveCount >= 5
    ? `${firstName}, you've saved ${saveCount} things — mostly from ${topSource}. What's on your mind?`
    : `${firstName}, you've saved ${saveCount} thing${saveCount === 1 ? '' : 's'}. What's on your mind?`

  // Thank you state — with a reset option
  if (sent) {
    return (
      <div style={{
        padding:      '28px 20px',
        borderRadius: '18px',
        border:       '1px solid rgba(31,206,148,0.20)',
        background:   'rgba(31,206,148,0.04)',
        textAlign:    'center',
      }}>
        <div style={{ fontSize: '22px', marginBottom: '14px', opacity: 0.85 }}>✦</div>
        <p style={{
          fontFamily:   'var(--f-display)',
          fontStyle:    'italic', fontWeight: 400, fontSize: '21px',
          color:        'rgba(240,230,200,0.92)',
          lineHeight:   1.3, marginBottom: '8px',
        }}>
          Thank you, {firstName}.
        </p>
        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize:   '13px', color: 'rgba(240,230,200,0.38)',
          lineHeight: 1.6, marginBottom: '20px',
        }}>
          We'll read this tonight.
        </p>
        <button onClick={reset} style={{
          fontFamily:    'var(--f-body)',
          fontSize:      '11px', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color:         'rgba(240,230,200,0.30)',
          background:    'none', border: 'none', cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}>
          share something else
        </button>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: '18px',
      border:       '1px solid rgba(31,206,148,0.12)',
      background:   'rgba(31,206,148,0.025)',
      overflow:     'hidden',
    }}>

      {/* Section label */}
      <div style={{
        padding:       '16px 20px 0',
        fontFamily:    'var(--f-body)',
        fontSize:      '9px', fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color:         'rgba(240,230,200,0.28)',
      }}>
        Share with the team
      </div>

      {/* Opening — personal */}
      <p style={{
        fontFamily:   'var(--f-display)',
        fontStyle:    'italic', fontWeight: 400, fontSize: '17px',
        color:        'rgba(240,230,200,0.82)',
        lineHeight:   1.45, margin: '10px 20px 16px',
      }}>
        {opening}
      </p>

      {/* Four mode buttons */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        {MODES.map(m => {
          const sel = mode === m.value
          return (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setMessage('') }}
              style={{
                display:               'flex',
                alignItems:            'flex-start',
                gap:                   '11px',
                padding:               '11px 14px',
                borderRadius:          '10px',
                border:                `1px solid ${sel ? m.colour + '40' : 'rgba(240,230,200,0.07)'}`,
                background:            sel ? m.colour + '0e' : 'rgba(240,230,200,0.02)',
                cursor:                'pointer',
                textAlign:             'left',
                width:                 '100%',
                transition:            'all 180ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{
                fontSize:   '14px', lineHeight: 1,
                color:      sel ? m.colour : 'rgba(240,230,200,0.25)',
                flexShrink: 0, marginTop: '1px',
                transition: 'color 180ms ease',
                fontFamily: 'serif',
              }}>
                {m.symbol}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize:   '13px', fontWeight: sel ? 600 : 400,
                  color:      sel ? 'rgba(240,230,200,0.95)' : 'rgba(240,230,200,0.55)',
                  marginBottom: '1px', transition: 'all 180ms ease',
                }}>
                  {m.label}
                </div>
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize:   '11px', fontWeight: 300,
                  color:      'rgba(240,230,200,0.30)', lineHeight: 1.35,
                }}>
                  {m.sublabel}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Text area — slides in after mode selection */}
      {mode && (
        <div style={{ padding: '0 16px 20px' }}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={selected?.placeholder}
            maxLength={500}
            rows={4}
            autoFocus
            style={{
              width:        '100%',
              background:   'rgba(240,230,200,0.04)',
              border:       `1px solid ${(selected?.colour ?? 'rgba(240,230,200,0.10)') + '28'}`,
              borderRadius: '10px', padding: '12px 14px',
              fontFamily:   'var(--f-body)',
              fontSize:     '13px', color: 'rgba(240,230,200,0.90)',
              outline:      'none', resize: 'none', lineHeight: 1.65,
              caretColor:   '#1fce94', marginBottom: '10px',
              fontStyle:    'italic',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--f-body)',
              fontSize:   '11px', color: 'rgba(240,230,200,0.20)',
            }}>
              {message.length}/500
            </span>
            <button
              onClick={handleSend}
              disabled={!canSend || sending}
              style={{
                height:                  '40px',
                padding:                 '0 22px',
                borderRadius:            '9px', border: 'none',
                background:              canSend && !sending
                  ? (selected?.colour ?? '#1fce94')
                  : 'rgba(240,230,200,0.07)',
                color:                   canSend && !sending
                  ? (selected?.textColour ?? '#080f0a')
                  : 'rgba(240,230,200,0.22)',
                fontFamily:              'var(--f-ui)',
                fontSize:                '12px', fontWeight: 700,
                letterSpacing:           '0.08em', textTransform: 'uppercase',
                cursor:                  canSend && !sending ? 'pointer' : 'not-allowed',
                transition:              'all 180ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
