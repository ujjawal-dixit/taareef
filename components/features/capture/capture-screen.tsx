'use client'

// components/features/capture/capture-screen.tsx
// Full-screen capture overlay.
// Three paths: Speak (V2), Screenshot (V2), Jot (V1 — functional).
// Title: Cormorant italic — same voice as wordmark and empty state.
// Form: clean, unhurried, every field purposeful.
// Save button: neon fill — the one moment neon is used as a fill.

import { useState, useCallback, useEffect, useRef } from 'react'
import type { CreateRecommendationInput, Category, SourceType } from '@/lib/types'
import { CATEGORIES } from '@/constants/categories'

type CaptureMethod = 'choose' | 'jot'

type Props = {
  isOpen:  boolean
  onClose: () => void
  onSaved: (input: CreateRecommendationInput) => Promise<void>
}

export function CaptureScreen({ isOpen, onClose, onSaved }: Props) {
  const [method,   setMethod]   = useState<CaptureMethod>('choose')
  const [isSaving, setIsSaving] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Lock body scroll when open, reset state on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      const t = setTimeout(() => {
        setMethod('choose')
        setError(null)
        setIsSaving(false)
      }, 320)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  async function handleSave(input: CreateRecommendationInput) {
    setIsSaving(true)
    setError(null)
    try {
      await onSaved(input)
      // onSaved calls onClose — no need to close here
    } catch {
      setError("Couldn't save — try again?")
      setIsSaving(false)
    }
  }

  return (
    /*
      position: fixed; inset: 0 — true full viewport.
      z-index: 400 — above everything.
      No max-width here — the overlay covers the full screen.
      The inner content is constrained to 430px and centred.
    */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save a recommendation"
      style={{
        position:      'fixed',
        inset:         0,
        background:    '#06100a',
        zIndex:        400,
        display:       'flex',
        flexDirection: 'column',
        overflowY:     'auto',
        opacity:       isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transform:     isOpen ? 'translateY(0)' : 'translateY(12px)',
        transition:    'opacity 240ms ease, transform 240ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Content constrained to 430px, centred */}
      <div style={{
        width:          '100%',
        maxWidth:       '430px',
        margin:         '0 auto',
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        paddingBottom:  '48px',
      }}>
        {method === 'choose' ? (
          <ChooseMethod
            onSelect={setMethod}
            onClose={onClose}
          />
        ) : (
          <JotForm
            onSave={handleSave}
            onBack={() => setMethod('choose')}
            isSaving={isSaving}
            error={error}
          />
        )}
      </div>
    </div>
  )
}

// ── CHOOSE METHOD ─────────────────────────────────────────────────

function ChooseMethod({
  onSelect,
  onClose,
}: {
  onSelect: (m: CaptureMethod) => void
  onClose:  () => void
}) {
  return (
    <>
      {/* Header */}
      <div style={{ padding: '52px 22px 20px', position: 'relative' }}>

        {/*
          Title: Cormorant italic.
          "save a recommendation" — lowercase, like the wordmark.
          This moment is intimate, not transactional.
        */}
        <h1 style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    400,
          fontStyle:     'italic',
          fontSize:      '30px',
          letterSpacing: '-0.01em',
          color:         'rgba(240,230,200,0.95)',
          lineHeight:    1.1,
          maxWidth:      'calc(100% - 52px)',
          margin:        0,
        }}>
          save a<br />recommendation
        </h1>

        <p style={{
          fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:      '12px',
          fontWeight:    400,
          color:         'rgba(240,230,200,0.35)',
          letterSpacing: '0.03em',
          marginTop:     '6px',
        }}>
          How did it arrive?
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position:               'absolute',
            top:                    '52px',
            right:                  '22px',
            width:                  '36px',
            height:                 '36px',
            borderRadius:           '50%',
            background:             'rgba(240,230,200,0.07)',
            border:                 '0.5px solid rgba(240,230,200,0.12)',
            display:                'flex',
            alignItems:             'center',
            justifyContent:         'center',
            cursor:                 'pointer',
            color:                  'rgba(240,230,200,0.55)',
            WebkitTapHighlightColor:'transparent',
            transition:             'background 160ms ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Options */}
      <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Speak — V2 */}
        <CaptureOption
          gradient="linear-gradient(148deg,#2e0206 0%,#5c0b10 44%,#880e16 100%)"
          shadow="0 12px 40px rgba(136,14,22,0.36)"
          icon={<MicIcon />}
          label="speak it"
          desc="Coming in V2"
          disabled
        />

        {/* Screenshot — V2 */}
        <CaptureOption
          gradient="linear-gradient(148deg,#02091a 0%,#0b1a4a 44%,#102068 100%)"
          shadow="0 12px 40px rgba(16,32,104,0.36)"
          icon={<CameraIcon />}
          label="share a screenshot"
          desc="Coming in V2"
          disabled
        />

        {/* Jot — V1, functional */}
        <CaptureOption
          gradient="linear-gradient(148deg,#010e06 0%,#053618 44%,#094e24 100%)"
          shadow="0 12px 40px rgba(9,78,36,0.36)"
          icon={<PenIcon />}
          label="jot it down"
          desc="Tell us what it is and who recommended it"
          onClick={() => onSelect('jot')}
        />

      </div>
    </>
  )
}

// ── CAPTURE OPTION ────────────────────────────────────────────────

function CaptureOption({
  gradient, shadow, icon, label, desc, onClick, disabled,
}: {
  gradient: string
  shadow:   string
  icon:     React.ReactNode
  label:    string
  desc:     string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={!disabled ? (e) => { if (e.key === 'Enter') onClick?.() } : undefined}
      aria-disabled={disabled}
      style={{
        borderRadius:            '18px',
        padding:                 '20px',
        display:                 'flex',
        alignItems:              'center',
        gap:                     '16px',
        cursor:                  disabled ? 'not-allowed' : 'pointer',
        background:              gradient,
        boxShadow:               disabled ? 'none' : shadow,
        border:                  '1px solid rgba(255,255,255,0.07)',
        opacity:                 disabled ? 0.55 : 1,
        transition:              'transform 160ms ease',
        WebkitTapHighlightColor: 'transparent',
        position:                'relative',
        overflow:                'hidden',
      }}
    >
      {/* Icon box */}
      <div style={{
        width:          '48px',
        height:         '48px',
        borderRadius:   '12px',
        background:     'rgba(255,255,255,0.09)',
        border:         '0.5px solid rgba(255,255,255,0.14)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/*
          Option labels: Cormorant italic — consistent voice.
          All three screens (wordmark, empty state, capture title,
          option labels) speak in the same register.
        */}
        <div style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    400,
          fontStyle:     'italic',
          fontSize:      '21px',
          color:         'rgba(240,230,200,0.96)',
          lineHeight:    1.1,
          marginBottom:  '3px',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '12px',
          fontWeight: 300,
          color:      'rgba(240,230,200,0.40)',
          lineHeight: 1.45,
        }}>
          {desc}
        </div>
      </div>

      {/* Arrow */}
      {!disabled && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="rgba(240,230,200,0.22)" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </div>
  )
}

// ── JOT FORM ──────────────────────────────────────────────────────
// The functional save form for V1.
// Three fields: what, what kind, who told you.
// Note is optional — never required at save time.
// Save button: neon fill, 52px height (Fitts's Law primary action).

function JotForm({
  onSave,
  onBack,
  isSaving,
  error,
}: {
  onSave:   (input: CreateRecommendationInput) => Promise<void>
  onBack:   () => void
  isSaving: boolean
  error:    string | null
}) {
  const [title,      setTitle]      = useState('')
  const [category,   setCategory]   = useState<Category | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [notes,      setNotes]      = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  // Auto-focus the title field
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 160)
    return () => clearTimeout(t)
  }, [])

  const canSave = title.trim().length > 0 && category !== null

  async function handleSave() {
    if (!canSave || isSaving) return
    await onSave({
      title:       title.trim(),
      category:    category!,
      source_type: 'friend' as SourceType,
      source_name: sourceName.trim() || 'Someone',
      notes:       notes.trim() || undefined,
    })
  }

  // Field + label shared styles
  const fieldStyle: React.CSSProperties = {
    width:           '100%',
    background:      'rgba(240,230,200,0.04)',
    border:          '1px solid rgba(240,230,200,0.11)',
    borderRadius:    '10px',
    padding:         '13px 14px',
    fontFamily:      'var(--font-dm-sans), system-ui, sans-serif',
    fontSize:        '15px',
    fontWeight:      400,
    color:           'rgba(240,230,200,0.95)',
    outline:         'none',
    transition:      'border-color 160ms ease',
    caretColor:      '#1fce94',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
    fontSize:      '10px',
    fontWeight:    600,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color:         'rgba(240,230,200,0.38)',
    display:       'block',
    marginBottom:  '7px',
  }

  return (
    <>
      {/* Header */}
      <div style={{ padding: '52px 22px 24px', position: 'relative' }}>

        {/* Back button */}
        <button
          onClick={onBack}
          aria-label="Back to capture options"
          style={{
            position:               'absolute',
            top:                    '52px',
            left:                   '22px',
            display:                'flex',
            alignItems:             'center',
            gap:                    '5px',
            color:                  'rgba(240,230,200,0.38)',
            fontFamily:             'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:               '12px',
            letterSpacing:          '0.03em',
            cursor:                 'pointer',
            WebkitTapHighlightColor:'transparent',
            transition:             'color 160ms ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          back
        </button>

        {/* Title — Cormorant italic, lowercase */}
        <h1 style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    400,
          fontStyle:     'italic',
          fontSize:      '30px',
          letterSpacing: '-0.01em',
          color:         'rgba(240,230,200,0.95)',
          lineHeight:    1.1,
          marginTop:     '28px',
          margin:        '28px 0 6px',
        }}>
          jot it down
        </h1>
        <p style={{
          fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:      '12px',
          fontWeight:    400,
          color:         'rgba(240,230,200,0.35)',
          letterSpacing: '0.02em',
        }}>
          What was recommended, and who told you?
        </p>
      </div>

      {/* Form fields */}
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* What is it */}
        <div>
          <label htmlFor="jot-title" style={labelStyle}>What is it?</label>
          <input
            id="jot-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && canSave) handleSave() }}
            placeholder="Restaurant name, film title, album..."
            style={{
              ...fieldStyle,
              // Placeholder colour
            }}
            aria-required="true"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* Category picker — 5×2 grid matching the vault grid */}
        <div>
          <label style={labelStyle}>What kind?</label>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap:                 '6px',
          }}>
            {CATEGORIES.map(cat => {
              const sel = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as Category)}
                  aria-pressed={sel}
                  aria-label={cat.label}
                  style={{
                    padding:                 '9px 4px',
                    borderRadius:            '8px',
                    border:                  `1px solid ${sel ? cat.colourHex : 'rgba(240,230,200,0.09)'}`,
                    background:              sel ? `${cat.colourHex}1a` : 'rgba(240,230,200,0.025)',
                    fontFamily:              'var(--font-rajdhani), system-ui, sans-serif',
                    fontSize:                '8px',
                    fontWeight:              700,
                    letterSpacing:           '0.06em',
                    textTransform:           'uppercase',
                    color:                   sel ? cat.colourHex : 'rgba(240,230,200,0.52)',
                    cursor:                  'pointer',
                    transition:              'all 160ms ease',
                    WebkitTapHighlightColor: 'transparent',
                    // Active: inset top bar in category colour
                    boxShadow:               sel ? `inset 0 2px 0 ${cat.colourHex}` : 'none',
                  }}
                >
                  {cat.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Who told you */}
        <div>
          <label htmlFor="jot-source" style={labelStyle}>
            Who told you about it?
          </label>
          <input
            id="jot-source"
            type="text"
            value={sourceName}
            onChange={e => setSourceName(e.target.value)}
            placeholder="Arjun, that newsletter, a friend..."
            style={fieldStyle}
            autoComplete="off"
            autoCorrect="off"
          />
        </div>

        {/* Note — always optional */}
        <div>
          <label htmlFor="jot-note" style={labelStyle}>
            One thing to remember
            <span style={{ opacity: 0.5, marginLeft: '6px', textTransform: 'none', fontWeight: 400, fontSize: '10px' }}>
              optional
            </span>
          </label>
          <textarea
            id="jot-note"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Watch it knowing nothing..."
            rows={2}
            maxLength={500}
            style={{
              ...fieldStyle,
              resize:     'none',
              lineHeight: 1.55,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p role="alert" style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:   '13px',
            color:      '#c8151e',
            textAlign:  'center',
          }}>
            {error}
          </p>
        )}

        {/*
          SAVE BUTTON
          Neon fill — the one moment in the UI where neon is used
          as a background. It earns this because it's the primary
          action moment. 52px height: Fitts's Law for primary actions.
          Dark text on neon — maximum contrast.
        */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || isSaving}
          style={{
            width:                   '100%',
            height:                  '52px',
            borderRadius:            '12px',
            border:                  'none',
            background:              canSave && !isSaving ? '#1fce94' : 'rgba(240,230,200,0.07)',
            color:                   canSave && !isSaving ? '#080f0a' : 'rgba(240,230,200,0.28)',
            fontFamily:              'var(--font-rajdhani), system-ui, sans-serif',
            fontSize:                '15px',
            fontWeight:              700,
            letterSpacing:           '0.08em',
            textTransform:           'uppercase',
            cursor:                  canSave && !isSaving ? 'pointer' : 'not-allowed',
            transition:              'background 200ms ease, color 200ms ease, box-shadow 200ms ease',
            WebkitTapHighlightColor: 'transparent',
            boxShadow:               canSave && !isSaving
              ? '0 4px 24px rgba(31,206,148,0.38)'
              : 'none',
          }}
          aria-busy={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save it'}
        </button>

      </div>
    </>
  )
}

// ── ICONS ─────────────────────────────────────────────────────────
// Minimal SVG line icons — architectural, not decorative.

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="rgba(240,230,200,0.88)" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="rgba(240,230,200,0.88)" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function PenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="rgba(240,230,200,0.88)" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  )
}
