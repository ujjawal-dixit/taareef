'use client'

// components/features/capture/capture-screen.tsx
// Full-screen capture overlay. Three methods: speak, screenshot, jot.
// Jot is the functional one in V1 — opens a form.
// Peak-End Rule: the save moment is engineered for delight.

import { useState, useCallback, useEffect, useRef } from 'react'
import type { CreateRecommendationInput, Category, SourceType } from '@/lib/types'
import { CATEGORIES, getCategoryConfig } from '@/constants/categories'

type CaptureMethod = 'choose' | 'jot'

type CaptureScreenProps = {
  isOpen:   boolean
  onClose:  () => void
  onSaved:  (input: CreateRecommendationInput) => Promise<void>
}

export function CaptureScreen({ isOpen, onClose, onSaved }: CaptureScreenProps) {
  const [method,    setMethod]    = useState<CaptureMethod>('choose')
  const [isSaving,  setIsSaving]  = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      // Reset to choose on close
      setTimeout(() => setMethod('choose'), 300)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleJotSave(input: CreateRecommendationInput) {
    setIsSaving(true)
    setSaveError(null)
    try {
      await onSaved(input)
      onClose()
    } catch {
      setSaveError("Couldn't save — try again?")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      id="capture-screen"
      className={`capture-screen${isOpen ? ' open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Save a recommendation"
    >
      <div className="capture-inner">
        {method === 'choose' ? (
          <ChooseMethod
            onMethodSelect={setMethod}
            onClose={onClose}
          />
        ) : (
          <JotItDown
            onSave={handleJotSave}
            onBack={() => setMethod('choose')}
            isSaving={isSaving}
            error={saveError}
          />
        )}
      </div>
    </div>
  )
}

// ── CHOOSE METHOD SCREEN ──────────────────────────────────────────

type ChooseMethodProps = {
  onMethodSelect: (method: CaptureMethod) => void
  onClose:        () => void
}

function ChooseMethod({ onMethodSelect, onClose }: ChooseMethodProps) {
  return (
    <>
      {/* Header */}
      <div style={{ padding: '52px 22px 20px', position: 'relative' }}>
        <h1 className="capture-title">
          Save a<br />Recommendation
        </h1>
        <p style={{
          fontFamily: 'var(--f-body)', fontSize: '12px',
          color: 'var(--t3)', letterSpacing: '0.03em', marginTop: '6px',
        }}>
          How did it arrive?
        </p>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '52px', right: '22px',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(240,230,200,0.07)',
            border: '0.5px solid rgba(240,230,200,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--t2)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 16px 24px' }}>

        {/* Speak — V2, not yet functional */}
        <div
          className="cap-opt opt-speak"
          role="button"
          tabIndex={0}
          aria-label="Speak it — coming soon"
          style={{ opacity: 0.6, cursor: 'not-allowed' }}
        >
          <div className="cap-opt-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="cap-opt-label">Speak it</div>
            <div className="cap-opt-desc">Coming in V2</div>
          </div>
          <div style={{ color: 'rgba(240,230,200,0.20)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        {/* Screenshot — V2, not yet functional */}
        <div
          className="cap-opt opt-photo"
          role="button"
          tabIndex={0}
          aria-label="Share a screenshot — coming soon"
          style={{ opacity: 0.6, cursor: 'not-allowed' }}
        >
          <div className="cap-opt-icon">
            <svg viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="cap-opt-label">Screenshot</div>
            <div className="cap-opt-desc">Coming in V2</div>
          </div>
          <div style={{ color: 'rgba(240,230,200,0.20)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        {/* Jot it down — FUNCTIONAL in V1 */}
        <div
          className="cap-opt opt-jot"
          role="button"
          tabIndex={0}
          onClick={() => onMethodSelect('jot')}
          onKeyDown={e => { if (e.key === 'Enter') onMethodSelect('jot') }}
          aria-label="Jot it down"
        >
          <div className="cap-opt-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="cap-opt-label">Jot it down</div>
            <div className="cap-opt-desc">Tell us what it is and who recommended it</div>
          </div>
          <div style={{ color: 'rgba(240,230,200,0.20)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

      </div>
    </>
  )
}

// ── JOT IT DOWN — FUNCTIONAL FORM ────────────────────────────────

type JotProps = {
  onSave:    (input: CreateRecommendationInput) => Promise<void>
  onBack:    () => void
  isSaving:  boolean
  error:     string | null
}

function JotItDown({ onSave, onBack, isSaving, error }: JotProps) {
  const [title,      setTitle]      = useState('')
  const [category,   setCategory]   = useState<Category | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('friend')
  const [notes,      setNotes]      = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 150)
  }, [])

  const canSave = title.trim().length > 0 && category !== null

  async function handleSave() {
    if (!canSave || isSaving) return
    await onSave({
      title:       title.trim(),
      category:    category!,
      source_type: sourceType,
      source_name: sourceName.trim() || 'Someone',
      notes:       notes.trim() || undefined,
    })
  }

  const fieldStyle = {
    width: '100%',
    background: 'rgba(240,230,200,0.04)',
    border: '1px solid rgba(240,230,200,0.12)',
    borderRadius: '10px',
    padding: '12px 14px',
    fontFamily: 'var(--f-body)',
    fontSize: '15px',
    color: 'var(--t1)',
    outline: 'none',
    transition: 'border-color 160ms ease',
  } as const

  const labelStyle = {
    fontFamily: 'var(--f-body)',
    fontSize: '11px',
    fontWeight: '500' as const,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: 'var(--t3)',
    display: 'block' as const,
    marginBottom: '6px',
  }

  return (
    <>
      {/* Header */}
      <div style={{ padding: '52px 22px 20px', position: 'relative' }}>
        {/* Back */}
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            position: 'absolute', top: '52px', left: '22px',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'var(--t3)', fontSize: '12px',
            fontFamily: 'var(--f-body)', letterSpacing: '0.04em',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        <h1 className="capture-title" style={{ marginTop: '28px' }}>
          Jot It Down
        </h1>
        <p style={{
          fontFamily: 'var(--f-body)', fontSize: '12px',
          color: 'var(--t3)', letterSpacing: '0.03em', marginTop: '6px',
        }}>
          What was recommended, and who told you?
        </p>
      </div>

      {/* Form */}
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Title */}
        <div>
          <label htmlFor="jot-title" style={labelStyle}>What is it?</label>
          <input
            id="jot-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Restaurant name, film title, album..."
            style={fieldStyle}
            aria-required="true"
            autoComplete="off"
          />
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>What kind?</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '6px',
          }}>
            {CATEGORIES.map(cat => {
              const isSelected = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as Category)}
                  aria-pressed={isSelected}
                  aria-label={cat.label}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? cat.colourHex : 'rgba(240,230,200,0.10)'}`,
                    background: isSelected ? `${cat.colourHex}18` : 'rgba(240,230,200,0.03)',
                    fontFamily: 'var(--f-title)',
                    fontSize: '8px', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                    color: isSelected ? cat.colourHex : 'rgba(240,230,200,0.55)',
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Source */}
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
          />
        </div>

        {/* Note */}
        <div>
          <label htmlFor="jot-note" style={labelStyle}>
            One thing to remember <span style={{ opacity: 0.6 }}>(optional)</span>
          </label>
          <textarea
            id="jot-note"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Watch it knowing nothing..."
            rows={2}
            style={{
              ...fieldStyle,
              resize: 'none',
              lineHeight: 1.55,
            }}
            maxLength={500}
          />
        </div>

        {/* Error */}
        {error && (
          <p role="alert" style={{
            fontFamily: 'var(--f-body)',
            fontSize: '13px', color: '#c8151e',
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || isSaving}
          style={{
            width: '100%', padding: '14px',
            borderRadius: '12px', border: 'none',
            background: canSave && !isSaving
              ? 'var(--neon)'
              : 'rgba(240,230,200,0.08)',
            color: canSave && !isSaving ? '#080f0a' : 'var(--t3)',
            fontFamily: 'var(--f-title)',
            fontSize: '16px', fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            cursor: canSave && !isSaving ? 'pointer' : 'not-allowed',
            transition: 'background 180ms ease, color 180ms ease',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: canSave && !isSaving
              ? '0 4px 20px rgba(31,206,148,0.35)'
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
