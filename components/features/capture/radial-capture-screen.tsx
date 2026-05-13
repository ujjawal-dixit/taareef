// components/features/capture/radial-capture-screen.tsx
// Full viewport capture screen — covers everything, no bleed-through.
// Three equal options — speak, share, jot.
// Wong Kar-wai warmth: glowing icon backgrounds, warm cards, deep typography.

'use client'

import { useEffect, useCallback } from 'react'

type CaptureMethod = 'audio' | 'screenshot' | 'manual'

type Props = {
  isOpen:         boolean
  onClose:        () => void
  onMethodSelect: (method: CaptureMethod) => void
}

export function RadialCaptureScreen({ isOpen, onClose, onMethodSelect }: Props) {

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    // Full viewport — not max-width constrained here
    // The inner wrapper centres at 480px
    <div
      className="capture-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Save a recommendation"
      style={{ animation: 'fade-in 220ms ease-out' }}
    >
      <div className="capture-inner">

        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          padding:        '56px 24px 32px',
        }}>
          <div>
            <h1 style={{
              fontFamily:  'var(--font-fraunces), Georgia, serif',
              fontSize:    '26px',
              fontWeight:  '600',
              lineHeight:  '1.2',
              letterSpacing: '-0.01em',
              color:       'var(--text-primary)',
              margin:      0,
            }}>
              Save a recommendation
            </h1>
            <p style={{
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize:   '13px',
              color:      'var(--text-tertiary)',
              marginTop:  '6px',
            }}>
              How did it arrive?
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width:           '40px',
              height:          '40px',
              borderRadius:    '50%',
              backgroundColor: 'rgba(30,28,26,0.07)',
              border:          'none',
              cursor:          'pointer',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              color:           'var(--text-secondary)',
              flexShrink:      0,
              marginLeft:      '16px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Three capture options */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '12px',
          padding:       '0 16px',
          flex:          1,
        }}>
          <CaptureOption
            icon="🎙"
            label="Speak it"
            description="Tap and say what was recommended and who told you"
            iconBg="rgba(138,34,82,0.12)"     // deep rose tint
            iconBgBorder="rgba(138,34,82,0.18)"
            onClick={() => onMethodSelect('audio')}
            animDelay={0}
          />
          <CaptureOption
            icon="📸"
            label="Share a screenshot"
            description="Upload a screenshot and we'll read it for you"
            iconBg="rgba(45,74,138,0.10)"     // deep indigo tint
            iconBgBorder="rgba(45,74,138,0.16)"
            onClick={() => onMethodSelect('screenshot')}
            animDelay={60}
          />
          <CaptureOption
            icon="✏️"
            label="Jot it down"
            description="Tell us what it is and who recommended it"
            iconBg="rgba(26,107,74,0.10)"     // deep sage tint
            iconBgBorder="rgba(26,107,74,0.16)"
            onClick={() => onMethodSelect('manual')}
            animDelay={120}
          />
        </div>

        {/* Bottom breathing room */}
        <div style={{ height: '48px' }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CAPTURE OPTION
// ─────────────────────────────────────────────────────────────

type CaptureOptionProps = {
  icon:         string
  label:        string
  description:  string
  iconBg:       string
  iconBgBorder: string
  onClick:      () => void
  animDelay:    number
}

function CaptureOption({
  icon,
  label,
  description,
  iconBg,
  iconBgBorder,
  onClick,
  animDelay,
}: CaptureOptionProps) {
  return (
    <button
      onClick={onClick}
      className="capture-option"
      style={{
        animationDelay: `${animDelay}ms`,
        animation:      `screen-enter 320ms cubic-bezier(0.16, 1, 0.3, 1) ${animDelay}ms both`,
      }}
    >
      {/* Icon background — warm tinted circle */}
      <div
        aria-hidden="true"
        style={{
          width:           '56px',
          height:          '56px',
          borderRadius:    '14px',
          backgroundColor: iconBg,
          border:          `1px solid ${iconBgBorder}`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        '26px',
          flexShrink:      0,
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <p style={{
          fontFamily:  'var(--font-fraunces), Georgia, serif',
          fontSize:    '17px',
          fontWeight:  '500',
          color:       'var(--text-primary)',
          margin:      '0 0 3px',
          lineHeight:  '1.2',
        }}>
          {label}
        </p>
        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '13px',
          color:      'var(--text-tertiary)',
          margin:     0,
          lineHeight: '1.4',
        }}>
          {description}
        </p>
      </div>

      {/* Arrow */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: '#d0c5b8', flexShrink: 0 }}
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
