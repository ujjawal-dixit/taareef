'use client'

// components/features/feedback/feedback-card.tsx
// Session 9 redesign:
// - Header: "Help us make this better" in DM Sans 500
// - Opening line: "Ujjawal, you've saved 5 things — what's on your mind?"
//   (source name removed from opening line)
// - Background: deep teal #061612, distinct from #080f0a canvas
// - Border: 1px neon #1fce94 at 40% opacity
// - Four feedback options unchanged in copy, refined in spacing
// - SEND becomes "Tell them" → context-specific action copy

import { useState } from 'react'

type FeedbackMode = 'delight' | 'friction' | 'feature' | 'thought'

type Props = {
  userEmail: string
  userName:  string
  saveCount: number
  topSource: string | null
  onDismiss?: () => void
}

const MODES: { value: FeedbackMode; label: string; sub: string; icon: string }[] = [
  { value: 'delight',  label: 'Something delighted me',   sub: 'A moment, a detail, something that just worked',       icon: '✦' },
  { value: 'friction', label: 'Something frustrated me',   sub: 'Honest friction. We need to hear this.',               icon: '○' },
  { value: 'feature',  label: 'I want something new',       sub: 'A feature, a capability, an idea you keep wishing existed', icon: '→' },
  { value: 'thought',  label: 'I have a thought',           sub: 'Anything else. We read everything.',                  icon: '○' },
]

export function FeedbackCard({ userName, saveCount }: Props) {
  const [selected, setSelected] = useState<FeedbackMode | null>(null)
  const [text,     setText]     = useState('')
  const [sent,     setSent]     = useState(false)
  const [sending,  setSending]  = useState(false)

  async function handleSend() {
    if (!selected || !text.trim()) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode: selected, text: text.trim(), userName, saveCount }),
      })
      setSent(true)
    } catch {
      // Silent fail — feedback is not mission critical
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setSelected(null); setText(''); setSent(false)
  }

  const firstName = userName.split(' ')[0]

  return (
    <div style={{
      background:   '#061612',
      border:       '1px solid rgba(31,206,148,0.40)',
      borderRadius: '16px',
      padding:      '20px',
      boxShadow:    '0 0 32px rgba(31,206,148,0.06)',
    }}>

      {sent ? (
        // Sent state
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{
            fontFamily: 'var(--f-body)',
            fontSize:   '15px',
            fontWeight: 500,
            color:      '#1fce94',
            marginBottom:'8px',
          }}>
            Thank you, {firstName}.
          </div>
          <div style={{
            fontFamily:  'var(--f-body)',
            fontSize:    '12px',
            fontWeight:  300,
            color:       'rgba(255,255,255,0.40)',
            lineHeight:  1.6,
            marginBottom:'20px',
          }}>
            We read everything.
          </div>
          <button onClick={reset} style={{
            background:   'none',
            border:       '1px solid rgba(31,206,148,0.25)',
            borderRadius: '10px',
            padding:      '8px 20px',
            fontFamily:   'var(--f-ui)',
            fontSize:     '11px',
            fontWeight:   700,
            letterSpacing:'0.08em',
            textTransform:'uppercase',
            color:        'rgba(31,206,148,0.70)',
            cursor:       'pointer',
          }}>
            Send another
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            fontFamily:   'var(--f-body)',
            fontSize:     '11px',
            fontWeight:   700,
            letterSpacing:'0.12em',
            textTransform:'uppercase',
            color:        'rgba(31,206,148,0.60)',
            marginBottom: '10px',
          }}>
            Help us make this better
          </div>

          {/* Personal opening */}
          <div style={{
            fontFamily:   'var(--f-display)',
            fontStyle:    'italic',
            fontWeight:   400,
            fontSize:     '15px',
            color:        'rgba(255,255,255,0.80)',
            lineHeight:   1.5,
            marginBottom: '18px',
          }}>
            {firstName}, you&rsquo;ve saved {saveCount} thing{saveCount === 1 ? '' : 's'} — what&rsquo;s on your mind?
          </div>

          {/* Mode options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '16px' }}>
            {MODES.map(m => {
              const on = selected === m.value
              return (
                <button
                  key={m.value}
                  onClick={() => setSelected(on ? null : m.value)}
                  style={{
                    display:                 'flex',
                    alignItems:              'flex-start',
                    gap:                     '12px',
                    padding:                 '10px 12px',
                    background:              on ? 'rgba(31,206,148,0.08)' : 'transparent',
                    border:                  `1px solid ${on ? 'rgba(31,206,148,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius:            '10px',
                    cursor:                  'pointer',
                    transition:              'all 140ms ease',
                    textAlign:               'left',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{
                    fontFamily:  'var(--f-ui)',
                    fontSize:    '12px',
                    color:       on ? '#1fce94' : 'rgba(255,255,255,0.30)',
                    marginTop:   '1px',
                    flexShrink:  0,
                  }}>
                    {m.icon}
                  </span>
                  <div>
                    <div style={{
                      fontFamily:  'var(--f-body)',
                      fontSize:    '13px',
                      fontWeight:  500,
                      color:       on ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.62)',
                      marginBottom:'2px',
                      lineHeight:  1.3,
                    }}>
                      {m.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--f-body)',
                      fontSize:   '11px',
                      fontWeight: 300,
                      color:      'rgba(255,255,255,0.32)',
                      lineHeight: 1.4,
                    }}>
                      {m.sub}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Text area — appears when mode selected */}
          {selected && (
            <div style={{ marginBottom: '14px' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Say as much or as little as you'd like…"
                rows={3}
                maxLength={1000}
                autoFocus
                style={{
                  width:        '100%',
                  background:   'rgba(255,255,255,0.03)',
                  border:       '1px solid rgba(31,206,148,0.22)',
                  borderRadius: '10px',
                  padding:      '12px 14px',
                  fontFamily:   'var(--f-body)',
                  fontSize:     '13px',
                  fontWeight:   300,
                  color:        'rgba(255,255,255,0.80)',
                  resize:       'none',
                  outline:      'none',
                  caretColor:   '#1fce94',
                  lineHeight:   1.6,
                  boxSizing:    'border-box',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                style={{
                  marginTop:               '10px',
                  width:                   '100%',
                  height:                  '44px',
                  borderRadius:            '10px',
                  border:                  'none',
                  background:              text.trim() && !sending ? '#1fce94' : 'rgba(31,206,148,0.25)',
                  color:                   text.trim() && !sending ? '#061612' : 'rgba(31,206,148,0.50)',
                  fontFamily:              'var(--f-ui)',
                  fontSize:                '12px',
                  fontWeight:              700,
                  letterSpacing:           '0.08em',
                  textTransform:           'uppercase',
                  cursor:                  text.trim() && !sending ? 'pointer' : 'not-allowed',
                  transition:              'all 160ms ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
