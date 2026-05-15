'use client'

// components/features/feedback/feedback-card.tsx
// Personal feedback for first 15-20 users.
// 2x2 matrix: (suggestion | critique) x (new feature | existing feature)
// Sends directly to founder's email via /api/feedback.
// Appears as a card in the vault — not a modal, not a popup.
// Dismissible. Never appears again after submission or dismissal.

import { useState } from 'react'

type FeedbackType = 'new-feature' | 'existing-critique'
type FeedbackTone = 'feeling'     | 'specific'

type Props = {
  userEmail:    string
  userName:     string
  saveCount:    number
  topSource:    string | null
  onDismiss:    () => void
}

export function FeedbackCard({ userEmail, userName, saveCount, topSource, onDismiss }: Props) {
  const [type,      setType]      = useState<FeedbackType | null>(null)
  const [tone,      setTone]      = useState<FeedbackTone | null>(null)
  const [message,   setMessage]   = useState('')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  const canSend = type !== null && tone !== null && message.trim().length > 10

  async function handleSend() {
    if (!canSend || sending) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userEmail, userName, saveCount, topSource,
          type, tone, message: message.trim(),
        }),
      })
      setSent(true)
    } catch {
      setSending(false)
    }
  }

  // After sending — warm thank you, then dismisses
  if (sent) {
    return (
      <div style={{
        margin:       '0 0 10px',
        padding:      '20px',
        borderRadius: '18px',
        border:       '1px solid rgba(31,206,148,0.25)',
        background:   'rgba(31,206,148,0.05)',
        textAlign:    'center',
      }}>
        <div style={{
          fontFamily:   'var(--font-cormorant), Georgia, serif',
          fontStyle:    'italic',
          fontSize:     '20px',
          color:        'rgba(240,230,200,0.92)',
          marginBottom: '6px',
        }}>
          Thank you, {userName.split(' ')[0]}.
        </div>
        <div style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '12px',
          color:      'rgba(240,230,200,0.38)',
          lineHeight: 1.5,
        }}>
          We'll read this tonight.
        </div>
        <button onClick={onDismiss} style={{
          marginTop:  '16px',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '11px', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color:      'rgba(240,230,200,0.30)',
          background: 'none', border: 'none', cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}>
          close
        </button>
      </div>
    )
  }

  const context = topSource
    ? `You've saved ${saveCount} things${topSource ? `, mostly from ${topSource}` : ''}.`
    : `You've saved ${saveCount} recommendation${saveCount === 1 ? '' : 's'}.`

  return (
    <div style={{
      margin:       '0 0 10px',
      padding:      '20px',
      borderRadius: '18px',
      border:       '1px solid rgba(31,206,148,0.18)',
      background:   'rgba(31,206,148,0.04)',
      position:     'relative',
    }}>

      {/* Dismiss */}
      <button onClick={onDismiss} aria-label="Dismiss" style={{
        position: 'absolute', top: '14px', right: '16px',
        color: 'rgba(240,230,200,0.25)', background: 'none', border: 'none',
        cursor: 'pointer', padding: '4px',
        WebkitTapHighlightColor: 'transparent',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Context */}
      <p style={{
        fontFamily:   'var(--font-cormorant), Georgia, serif',
        fontStyle:    'italic', fontWeight: 400,
        fontSize:     '17px',
        color:        'rgba(240,230,200,0.85)',
        lineHeight:   1.4,
        marginBottom: '16px',
        paddingRight: '20px',
      }}>
        {context} What's one thing you'd change?
      </p>

      {/* Step 1 — type: new feature or existing */}
      <div style={{ marginBottom: '12px' }}>
        <p style={LABEL_STYLE}>I want to —</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {([
            { v: 'new-feature',      l: 'suggest a new feature' },
            { v: 'existing-critique',l: 'give feedback on something existing' },
          ] as { v: FeedbackType; l: string }[]).map(o => (
            <button
              key={o.v}
              onClick={() => setType(o.v)}
              style={{
                flex: 1, padding: '9px 8px',
                borderRadius:  '8px',
                border:        `1px solid ${type === o.v ? 'rgba(31,206,148,0.45)' : 'rgba(240,230,200,0.10)'}`,
                background:    type === o.v ? 'rgba(31,206,148,0.10)' : 'rgba(240,230,200,0.025)',
                fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
                fontSize:      '11px', fontWeight: 500,
                color:         type === o.v ? '#1fce94' : 'rgba(240,230,200,0.52)',
                cursor:        'pointer', lineHeight: 1.35,
                textAlign:     'center',
                transition:    'all 160ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — tone: feeling or specific */}
      <div style={{ marginBottom: '14px' }}>
        <p style={LABEL_STYLE}>My feedback is —</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {([
            { v: 'feeling',  l: 'a feeling or vibe' },
            { v: 'specific', l: 'a specific thing'  },
          ] as { v: FeedbackTone; l: string }[]).map(o => (
            <button
              key={o.v}
              onClick={() => setTone(o.v)}
              style={{
                flex: 1, padding: '9px 8px',
                borderRadius:  '8px',
                border:        `1px solid ${tone === o.v ? 'rgba(31,206,148,0.45)' : 'rgba(240,230,200,0.10)'}`,
                background:    tone === o.v ? 'rgba(31,206,148,0.10)' : 'rgba(240,230,200,0.025)',
                fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
                fontSize:      '11px', fontWeight: 500,
                color:         tone === o.v ? '#1fce94' : 'rgba(240,230,200,0.52)',
                cursor:        'pointer', lineHeight: 1.35,
                textAlign:     'center',
                transition:    'all 160ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* Free text */}
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder={
          type === 'new-feature'       && tone === 'feeling'  ? "I wish taareef felt more like..." :
          type === 'new-feature'       && tone === 'specific' ? "It would be great if taareef could..." :
          type === 'existing-critique' && tone === 'feeling'  ? "This part feels off to me..." :
          type === 'existing-critique' && tone === 'specific' ? "When I do X, it doesn't work because..." :
          "Tell us anything..."
        }
        maxLength={400}
        rows={3}
        style={{
          width:        '100%',
          background:   'rgba(240,230,200,0.04)',
          border:       '1px solid rgba(240,230,200,0.10)',
          borderRadius: '10px', padding: '11px 13px',
          fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:     '13px', color: 'rgba(240,230,200,0.90)',
          outline:      'none', resize: 'none', lineHeight: 1.55,
          caretColor:   '#1fce94',
          marginBottom: '12px',
        }}
      />

      <button
        onClick={handleSend}
        disabled={!canSend || sending}
        style={{
          width:         '100%', height: '46px',
          borderRadius:  '10px', border: 'none',
          background:    canSend && !sending ? '#1fce94' : 'rgba(240,230,200,0.07)',
          color:         canSend && !sending ? '#080f0a' : 'rgba(240,230,200,0.25)',
          fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:      '13px', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          cursor:        canSend && !sending ? 'pointer' : 'not-allowed',
          transition:    'all 180ms ease',
          boxShadow:     canSend && !sending ? '0 4px 20px rgba(31,206,148,0.30)' : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {sending ? 'Sending...' : 'Send'}
      </button>
    </div>
  )
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
  fontSize:      '10px', fontWeight: 600,
  letterSpacing: '0.10em', textTransform: 'uppercase',
  color:         'rgba(240,230,200,0.30)',
  marginBottom:  '7px',
}
