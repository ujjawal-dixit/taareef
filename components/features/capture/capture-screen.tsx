'use client'

// components/features/capture/capture-screen.tsx
//
// All three capture methods wired and functional:
//   jot    → manual form (V1, live)
//   audio  → Groq Whisper → pre-filled card (live with GROQ_API_KEY)
//   ocr    → Groq Vision  → pre-filled card (live with GROQ_API_KEY)
//
// Flow for audio + ocr:
//   record/upload → processing → pre-filled confirmation card →
//   user edits if needed → save
//
// Back button personality:
//   close (choose screen) → cream X, 44px target, visible
//   ← options (from any sub-screen) → cream 70%
//   ← retake (from confirmation) → cream 60%

import { useState, useEffect, useRef } from 'react'
import type { CreateRecommendationInput, Category, SourceType } from '@/lib/types'
import { CATEGORIES } from '@/constants/categories'

type Method  = 'choose' | 'jot' | 'audio' | 'ocr'
type Stage   = 'input' | 'processing' | 'confirm'

type Prefill = {
  title:       string
  category:    Category | null
  source_name: string
  source_type: SourceType | null
  notes:       string
  confidence:  'high' | 'medium' | 'low'
}

type Props = {
  isOpen:  boolean
  onClose: () => void
  onSaved: (input: CreateRecommendationInput) => Promise<void>
}

export function CaptureScreen({ isOpen, onClose, onSaved }: Props) {
  const [method,  setMethod]  = useState<Method>('choose')
  const [stage,   setStage]   = useState<Stage>('input')
  const [prefill, setPrefill] = useState<Prefill | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      const t = setTimeout(() => {
        setMethod('choose'); setStage('input')
        setPrefill(null); setSaving(false); setError(null)
      }, 320)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  async function handleSave(input: CreateRecommendationInput) {
    setSaving(true); setError(null)
    try {
      await onSaved(input)
    } catch {
      setError("Couldn't save — try again?")
      setSaving(false)
    }
  }

  function goBack() {
    if (stage === 'confirm') { setStage('input'); setPrefill(null) }
    else { setMethod('choose'); setStage('input'); setPrefill(null); setError(null) }
  }

  function onExtracted(data: Prefill) {
    setPrefill(data)
    setStage('confirm')
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Save a recommendation"
      style={{
        position:      'fixed', inset: 0,
        background:    '#06100a',
        zIndex:        400,
        display:       'flex', flexDirection: 'column',
        overflowY:     'auto',
        opacity:       isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transform:     isOpen ? 'translateY(0)' : 'translateY(12px)',
        transition:    'opacity 240ms ease, transform 240ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '430px', margin: '0 auto',
        flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '48px',
      }}>

        {method === 'choose' && (
          <ChooseMethod onSelect={setMethod} onClose={onClose} />
        )}

        {method === 'jot' && (
          <JotForm
            onSave={handleSave} onBack={goBack}
            saving={saving} error={error}
          />
        )}

        {method === 'audio' && stage === 'input' && (
          <AudioCapture
            onExtracted={onExtracted} onBack={goBack}
            onError={setError} error={error}
          />
        )}

        {method === 'ocr' && stage === 'input' && (
          <OcrCapture
            onExtracted={onExtracted} onBack={goBack}
            onError={setError} error={error}
          />
        )}

        {stage === 'confirm' && prefill && (
          <ConfirmCard
            prefill={prefill} method={method}
            onSave={handleSave} onBack={goBack}
            saving={saving} error={error}
          />
        )}

      </div>
    </div>
  )
}

// ── CHOOSE METHOD ─────────────────────────────────────────────────

function ChooseMethod({ onSelect, onClose }: {
  onSelect: (m: Method) => void
  onClose:  () => void
}) {
  return (
    <>
      <div style={{ padding: '52px 22px 20px', position: 'relative' }}>
        <h1 style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 400, fontStyle: 'italic',
          fontSize: '30px', letterSpacing: '-0.01em',
          color: 'rgba(240,230,200,0.95)', lineHeight: 1.1,
          maxWidth: 'calc(100% - 52px)', margin: 0,
        }}>
          save a<br />recommendation
        </h1>
        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '12px', color: 'rgba(240,230,200,0.35)',
          letterSpacing: '0.03em', marginTop: '6px',
        }}>
          How did it arrive?
        </p>

        {/*
          CLOSE BUTTON
          Destination: back to vault. Not navigating — dismissing.
          Cream 80%: clearly visible, not competing with content.
          44×44 touch target minimum.
        */}
        <button
          onClick={onClose} aria-label="Close"
          style={{
            position:               'absolute', top: '48px', right: '18px',
            width:                  '44px', height: '44px',
            borderRadius:           '50%',
            background:             'rgba(240,230,200,0.08)',
            border:                 '0.5px solid rgba(240,230,200,0.16)',
            display:                'flex', alignItems: 'center', justifyContent: 'center',
            cursor:                 'pointer',
            color:                  'rgba(240,230,200,0.80)',
            WebkitTapHighlightColor:'transparent',
            transition:             'background 160ms ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.0" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6"  y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Option
          grad="linear-gradient(148deg,#2e0206 0%,#5c0b10 44%,#880e16 100%)"
          shadow="0 12px 40px rgba(136,14,22,0.36)"
          icon={<MicIcon />} label="speak it"
          desc="Say what was recommended and who told you"
          onClick={() => onSelect('audio')}
        />
        <Option
          grad="linear-gradient(148deg,#02091a 0%,#0b1a4a 44%,#102068 100%)"
          shadow="0 12px 40px rgba(16,32,104,0.36)"
          icon={<CameraIcon />} label="share a screenshot"
          desc="Upload and we'll read it for you"
          onClick={() => onSelect('ocr')}
        />
        <Option
          grad="linear-gradient(148deg,#010e06 0%,#053618 44%,#094e24 100%)"
          shadow="0 12px 40px rgba(9,78,36,0.36)"
          icon={<PenIcon />} label="jot it down"
          desc="Tell us what it is and who recommended it"
          onClick={() => onSelect('jot')}
        />
      </div>
    </>
  )
}

// ── OPTION CARD ───────────────────────────────────────────────────

function Option({ grad, shadow, icon, label, desc, onClick }: {
  grad:    string
  shadow:  string
  icon:    React.ReactNode
  label:   string
  desc:    string
  onClick: () => void
}) {
  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter') onClick() }}
      style={{
        borderRadius: '18px', padding: '20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        cursor: 'pointer',
        background: grad, boxShadow: shadow,
        border: '1px solid rgba(255,255,255,0.07)',
        transition: 'transform 160ms ease',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
        background: 'rgba(255,255,255,0.09)', border: '0.5px solid rgba(255,255,255,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 400, fontStyle: 'italic',
          fontSize: '21px', color: 'rgba(240,230,200,0.96)',
          lineHeight: 1.1, marginBottom: '3px',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '12px', fontWeight: 300,
          color: 'rgba(240,230,200,0.42)', lineHeight: 1.45,
        }}>
          {desc}
        </div>
      </div>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="rgba(240,230,200,0.25)" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}

// ── BACK BUTTON (sub-screens) ─────────────────────────────────────
// Destination: previous step in a flow. Cream 70% — neutral, not neon.

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        color: 'rgba(240,230,200,0.70)',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        fontSize: '12px', letterSpacing: '0.04em',
        minHeight: '44px',
        WebkitTapHighlightColor: 'transparent',
        transition: 'color 160ms ease',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      {label}
    </button>
  )
}

// ── SCREEN HEADER ─────────────────────────────────────────────────

function ScreenHeader({ title, subtitle, onBack, backLabel }: {
  title:     string
  subtitle?: string
  onBack:    () => void
  backLabel: string
}) {
  return (
    <div style={{ padding: '48px 22px 20px', position: 'relative' }}>
      <BackBtn label={backLabel} onClick={onBack} />
      <h1 style={{
        fontFamily: 'var(--font-cormorant), Georgia, serif',
        fontWeight: 400, fontStyle: 'italic',
        fontSize: '30px', letterSpacing: '-0.01em',
        color: 'rgba(240,230,200,0.95)', lineHeight: 1.1,
        margin: '8px 0 0',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '12px', color: 'rgba(240,230,200,0.35)',
          letterSpacing: '0.02em', marginTop: '5px',
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

// ── JOT FORM ─────────────────────────────────────────────────────

function JotForm({ onSave, onBack, saving, error }: {
  onSave:  (i: CreateRecommendationInput) => Promise<void>
  onBack:  () => void
  saving:  boolean
  error:   string | null
}) {
  const [title,      setTitle]      = useState('')
  const [category,   setCategory]   = useState<Category | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [notes,      setNotes]      = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 160) }, [])

  const canSave = title.trim().length > 0 && category !== null

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(240,230,200,0.04)',
    border: '1px solid rgba(240,230,200,0.11)', borderRadius: '10px',
    padding: '13px 14px',
    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
    fontSize: '15px', fontWeight: 400, color: 'rgba(240,230,200,0.95)',
    outline: 'none', transition: 'border-color 160ms ease', caretColor: '#1fce94',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em',
    textTransform: 'uppercase', color: 'rgba(240,230,200,0.38)',
    display: 'block', marginBottom: '7px',
  }

  return (
    <>
      <ScreenHeader
        title="jot it down"
        subtitle="What was recommended, and who told you?"
        onBack={onBack} backLabel="← options"
      />
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

        <div>
          <label htmlFor="jot-title" style={labelStyle}>What is it?</label>
          <input
            id="jot-title" ref={titleRef} type="text"
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && canSave) onSave({ title: title.trim(), category: category!, source_type: 'friend', source_name: sourceName.trim() || 'Someone', notes: notes.trim() || undefined }) }}
            placeholder="Restaurant name, film title, album..." style={fieldStyle}
            autoComplete="off" autoCorrect="off" spellCheck={false}
          />
        </div>

        <div>
          <label style={labelStyle}>What kind?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {CATEGORIES.map(cat => {
              const sel = category === cat.id
              return (
                <button key={cat.id} type="button"
                  onClick={() => setCategory(cat.id as Category)}
                  aria-pressed={sel}
                  style={{
                    padding: '9px 4px', borderRadius: '8px',
                    border: `1px solid ${sel ? cat.colourHex : 'rgba(240,230,200,0.09)'}`,
                    background: sel ? `${cat.colourHex}1a` : 'rgba(240,230,200,0.025)',
                    fontFamily: 'var(--font-rajdhani), system-ui, sans-serif',
                    fontSize: '8px', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: sel ? cat.colourHex : 'rgba(240,230,200,0.52)',
                    cursor: 'pointer', transition: 'all 160ms ease',
                    boxShadow: sel ? `inset 0 2px 0 ${cat.colourHex}` : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="jot-source" style={labelStyle}>Who told you about it?</label>
          <input
            id="jot-source" type="text" value={sourceName}
            onChange={e => setSourceName(e.target.value)}
            placeholder="Arjun, that newsletter, a friend..."
            style={fieldStyle} autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="jot-note" style={labelStyle}>
            One thing to remember
            <span style={{ opacity: 0.5, marginLeft: '6px', fontWeight: 400, fontSize: '10px', textTransform: 'none' }}>
              optional
            </span>
          </label>
          <textarea
            id="jot-note" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Watch it knowing nothing..." rows={2} maxLength={500}
            style={{ ...fieldStyle, resize: 'none', lineHeight: 1.55 }}
          />
        </div>

        {error && (
          <p role="alert" style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif', fontSize: '13px', color: '#c8151e', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <SaveButton
          canSave={canSave} saving={saving}
          onSave={() => onSave({
            title: title.trim(), category: category!,
            source_type: 'friend' as SourceType,
            source_name: sourceName.trim() || 'Someone',
            notes: notes.trim() || undefined,
          })}
        />
      </div>
    </>
  )
}

// ── AUDIO CAPTURE ─────────────────────────────────────────────────

function AudioCapture({ onExtracted, onBack, onError, error }: {
  onExtracted: (d: Prefill) => void
  onBack:      () => void
  onError:     (e: string) => void
  error:       string | null
}) {
  const [recording,   setRecording]   = useState(false)
  const [processing,  setProcessing]  = useState(false)
  const [seconds,     setSeconds]     = useState(0)
  const mediaRef    = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  function startRecording() {
    chunksRef.current = []
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mr = new MediaRecorder(stream)
        mediaRef.current = mr
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        mr.onstop = () => {
          stream.getTracks().forEach(t => t.stop())
          processAudio()
        }
        mr.start()
        setRecording(true)
        setSeconds(0)
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      })
      .catch(() => onError('Microphone access denied — please allow it in your browser settings'))
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRef.current?.stop()
    setRecording(false)
  }

  async function processAudio() {
    setProcessing(true)
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')
      const res  = await fetch('/api/capture/audio', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.data) {
        onError(data.error ?? "Couldn't process audio — try again?")
      } else {
        onExtracted(data.data as Prefill)
      }
    } catch {
      onError('Something went wrong — try again?')
    } finally {
      setProcessing(false)
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <>
      <ScreenHeader
        title="speak it"
        subtitle="Say what was recommended and who told you"
        onBack={onBack} backLabel="← options"
      />

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>

        {/* Recording button */}
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          style={{
            width: '96px', height: '96px', borderRadius: '50%',
            background:   recording
              ? 'radial-gradient(circle at 38% 32%, #8e0c12 0%, #5c0b10 60%, #300208 100%)'
              : 'radial-gradient(circle at 38% 32%, #0a2018 0%, #071510 100%)',
            border: `2px solid ${recording ? '#c8151e' : 'rgba(31,206,148,0.40)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: processing ? 'not-allowed' : 'pointer',
            transition: 'all 220ms ease',
            boxShadow: recording
              ? '0 0 0 8px rgba(200,21,30,0.10), 0 8px 32px rgba(200,21,30,0.40)'
              : '0 0 0 0 transparent, 0 6px 24px rgba(31,206,148,0.25)',
            animation: recording ? 'recordPulse 1.2s ease-in-out infinite' : 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {processing ? (
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              border: '2px solid rgba(240,230,200,0.20)',
              borderTopColor: '#1fce94',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : recording ? (
            <div style={{
              width: '20px', height: '20px', borderRadius: '3px',
              background: '#c8151e',
            }} />
          ) : (
            <MicIcon />
          )}
        </button>

        <p style={{
          fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:     '13px', color: 'rgba(240,230,200,0.45)',
          textAlign:    'center', lineHeight: 1.5,
        }}>
          {processing  ? 'Reading your voice...'            :
           recording   ? `Recording — tap to stop ${fmt(seconds)}` :
           'Tap to start. Speak naturally.'}
        </p>

        {recording && (
          <p style={{
            fontFamily:   'var(--font-cormorant), Georgia, serif',
            fontStyle:    'italic', fontSize: '15px',
            color:        'rgba(240,230,200,0.38)', textAlign: 'center',
          }}>
            "Rohit told me about this place in Bandra..."
          </p>
        )}

        {error && (
          <p role="alert" style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '13px', color: '#c8151e', textAlign: 'center',
          }}>
            {error}
          </p>
        )}
      </div>

      <style>{`
        @keyframes recordPulse {
          0%,100% { box-shadow: 0 0 0 8px rgba(200,21,30,0.10), 0 8px 32px rgba(200,21,30,0.40); }
          50%      { box-shadow: 0 0 0 14px rgba(200,21,30,0.05), 0 8px 32px rgba(200,21,30,0.55); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

// ── OCR CAPTURE ───────────────────────────────────────────────────

function OcrCapture({ onExtracted, onBack, onError, error }: {
  onExtracted: (d: Prefill) => void
  onBack:      () => void
  onError:     (e: string) => void
  error:       string | null
}) {
  const [processing, setProcessing] = useState(false)
  const [preview,    setPreview]    = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file')
      return
    }
    setPreview(URL.createObjectURL(file))
    setProcessing(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res  = await fetch('/api/capture/ocr', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.data) {
        onError(data.error ?? "Couldn't read the screenshot — try again?")
      } else {
        onExtracted(data.data as Prefill)
      }
    } catch {
      onError('Something went wrong — try again?')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <ScreenHeader
        title="share a screenshot"
        subtitle="Upload and we'll read it for you"
        onBack={onBack} backLabel="← options"
      />

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

        {/* Upload zone */}
        <div
          onClick={() => !processing && inputRef.current?.click()}
          style={{
            width: '100%', minHeight: '180px', borderRadius: '16px',
            border: `1.5px dashed ${processing ? 'rgba(31,206,148,0.30)' : 'rgba(240,230,200,0.15)'}`,
            background: preview ? 'transparent' : 'rgba(240,230,200,0.025)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: processing ? 'wait' : 'pointer',
            position: 'relative', overflow: 'hidden',
            transition: 'border-color 200ms ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {preview ? (
            <img src={preview} alt="Screenshot preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '240px' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <CameraIcon />
              <p style={{
                fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                fontSize: '13px', color: 'rgba(240,230,200,0.40)',
                marginTop: '12px', lineHeight: 1.5,
              }}>
                Tap to upload a screenshot<br />
                <span style={{ fontSize: '11px', opacity: 0.6 }}>WhatsApp, Instagram, anything</span>
              </p>
            </div>
          )}

          {processing && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(6,16,10,0.85)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: '2px solid rgba(240,230,200,0.15)',
                borderTopColor: '#1fce94',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{
                fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                fontSize: '12px', color: 'rgba(240,230,200,0.50)',
              }}>
                Reading your screenshot...
              </p>
            </div>
          )}
        </div>

        <input
          ref={inputRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {error && (
          <p role="alert" style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '13px', color: '#c8151e', textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  )
}

// ── CONFIRM CARD ──────────────────────────────────────────────────
// Pre-filled card from audio or OCR. User can edit before saving.

function ConfirmCard({ prefill, method, onSave, onBack, saving, error }: {
  prefill: Prefill
  method:  Method
  onSave:  (i: CreateRecommendationInput) => Promise<void>
  onBack:  () => void
  saving:  boolean
  error:   string | null
}) {
  const [title,      setTitle]      = useState(prefill.title ?? '')
  const [category,   setCategory]   = useState<Category | null>(prefill.category)
  const [sourceName, setSourceName] = useState(prefill.source_name ?? '')
  const [notes,      setNotes]      = useState(prefill.notes ?? '')

  const canSave = title.trim().length > 0 && category !== null

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(240,230,200,0.04)',
    border: '1px solid rgba(240,230,200,0.11)', borderRadius: '10px',
    padding: '13px 14px',
    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
    fontSize: '15px', color: 'rgba(240,230,200,0.95)',
    outline: 'none', caretColor: '#1fce94',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em',
    textTransform: 'uppercase', color: 'rgba(240,230,200,0.38)',
    display: 'block', marginBottom: '7px',
  }

  const backLabel = method === 'audio' ? '← re-record' : '← re-upload'

  return (
    <>
      <div style={{ padding: '48px 22px 16px' }}>
        <BackBtn label={backLabel} onClick={onBack} />

        {/* Confidence indicator */}
        <div style={{ marginTop: '10px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 400, fontStyle: 'italic',
            fontSize: '26px', color: 'rgba(240,230,200,0.95)',
            letterSpacing: '-0.01em', margin: 0,
          }}>
            does this look right?
          </h1>
          {prefill.confidence === 'low' && (
            <span style={{
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#b87820', background: 'rgba(184,120,32,0.12)',
              border: '0.5px solid rgba(184,120,32,0.25)',
              padding: '3px 8px', borderRadius: '6px',
            }}>
              low confidence
            </span>
          )}
        </div>
        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '12px', color: 'rgba(240,230,200,0.35)',
          letterSpacing: '0.02em',
        }}>
          Edit anything before saving.
        </p>
      </div>

      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div>
          <label style={labelStyle}>What is it?</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            style={fieldStyle} autoComplete="off" />
        </div>

        <div>
          <label style={labelStyle}>What kind?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {CATEGORIES.map(cat => {
              const sel = category === cat.id
              return (
                <button key={cat.id} type="button"
                  onClick={() => setCategory(cat.id as Category)}
                  aria-pressed={sel}
                  style={{
                    padding: '9px 4px', borderRadius: '8px',
                    border: `1px solid ${sel ? cat.colourHex : 'rgba(240,230,200,0.09)'}`,
                    background: sel ? `${cat.colourHex}1a` : 'rgba(240,230,200,0.025)',
                    fontFamily: 'var(--font-rajdhani), system-ui, sans-serif',
                    fontSize: '8px', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: sel ? cat.colourHex : 'rgba(240,230,200,0.52)',
                    cursor: 'pointer', transition: 'all 160ms ease',
                    boxShadow: sel ? `inset 0 2px 0 ${cat.colourHex}` : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Who told you about it?</label>
          <input type="text" value={sourceName} onChange={e => setSourceName(e.target.value)}
            placeholder="Arjun, that newsletter, a friend..." style={fieldStyle} autoComplete="off" />
        </div>

        <div>
          <label style={labelStyle}>
            Note
            <span style={{ opacity: 0.5, marginLeft: '6px', fontWeight: 400, fontSize: '10px', textTransform: 'none' }}>
              optional
            </span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={2} maxLength={500}
            style={{ ...fieldStyle, resize: 'none', lineHeight: 1.55 }}
          />
        </div>

        {error && (
          <p role="alert" style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '13px', color: '#c8151e', textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        <SaveButton
          canSave={canSave} saving={saving}
          onSave={() => onSave({
            title: title.trim(), category: category!,
            source_type: (prefill.source_type ?? 'friend') as SourceType,
            source_name: sourceName.trim() || 'Someone',
            notes: notes.trim() || undefined,
          })}
        />
      </div>
    </>
  )
}

// ── SAVE BUTTON ───────────────────────────────────────────────────

function SaveButton({ canSave, saving, onSave }: {
  canSave: boolean
  saving:  boolean
  onSave:  () => void
}) {
  return (
    <button
      type="button" onClick={onSave}
      disabled={!canSave || saving}
      style={{
        width: '100%', height: '52px', borderRadius: '12px', border: 'none',
        background:    canSave && !saving ? '#1fce94' : 'rgba(240,230,200,0.07)',
        color:         canSave && !saving ? '#080f0a' : 'rgba(240,230,200,0.28)',
        fontFamily:    'var(--font-rajdhani), system-ui, sans-serif',
        fontSize:      '15px', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        cursor:        canSave && !saving ? 'pointer' : 'not-allowed',
        transition:    'background 200ms ease, color 200ms ease, box-shadow 200ms ease',
        WebkitTapHighlightColor: 'transparent',
        boxShadow:     canSave && !saving ? '0 4px 24px rgba(31,206,148,0.38)' : 'none',
      }}
      aria-busy={saving}
    >
      {saving ? 'Saving...' : 'Save it'}
    </button>
  )
}

// ── ICONS ─────────────────────────────────────────────────────────

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="rgba(240,230,200,0.88)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8"  y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="rgba(240,230,200,0.88)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function PenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="rgba(240,230,200,0.88)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  )
}
