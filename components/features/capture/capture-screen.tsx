'use client'

// components/features/capture/capture-screen.tsx
// Session 9 — Intelligent capture flow:
//
// FLOW:
// 1. Bottom sheet: speak · scan · type
// 2. Each method captures raw input differently
// 3. All three paths converge at /api/capture/understand
// 4. Understand returns structured extraction + clarification if needed
// 5. If clarification needed: one focused question, user answers with a tap
// 6. Confirmation screen: card preview — user sees exactly what will be saved
// 7. One tap to save. Card appears in vault.
//
// DESIGN PRINCIPLES:
// - Never ask a question the LLM can answer itself
// - Never ask more than one question
// - The confirmation screen is always shown — user is always in control
// - Category canvas responds to detected category
// - Rotating micro-prompts on note field
// - Save button always neon — never dim

import { useState, useEffect, useRef, useCallback } from 'react'
import type { CreateRecommendationInput, Category, SourceType } from '@/lib/types'
import type { UnderstandResult } from '@/app/api/capture/understand/route'
import { CATEGORIES } from '@/constants/categories'

// ── TYPES ─────────────────────────────────────────────────────────

type Method = 'choose' | 'speak' | 'scan' | 'type'
type Stage  = 'input' | 'clarifying' | 'confirming'

type Props = {
  isOpen:  boolean
  onClose: () => void
  onSaved: (input: CreateRecommendationInput) => Promise<void>
}

// ── SHARED STYLES ─────────────────────────────────────────────────

const NEON_PILL: React.CSSProperties = {
  display:                 'flex',
  alignItems:              'center',
  justifyContent:          'center',
  gap:                     '8px',
  height:                  '50px',
  borderRadius:            '14px',
  border:                  '1px solid rgba(31,206,148,0.38)',
  background:              'rgba(31,206,148,0.06)',
  fontFamily:              'var(--f-ui)',
  fontSize:                '13px',
  fontWeight:              700,
  letterSpacing:           '0.08em',
  textTransform:           'uppercase' as const,
  color:                   '#1fce94',
  textDecoration:          'none',
  textShadow:              '0 0 12px rgba(31,206,148,0.45)',
  boxShadow:               '0 0 24px rgba(31,206,148,0.08)',
  WebkitTapHighlightColor: 'transparent',
  cursor:                  'pointer',
  transition:              'background 160ms ease',
  width:                   '100%',
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily:    'var(--f-ui)',
  fontSize:      '9px',
  fontWeight:    700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color:         'rgba(255,255,255,0.32)',
  marginBottom:  '8px',
  display:       'block',
}

const FIELD_STYLE: React.CSSProperties = {
  width:        '100%',
  background:   'rgba(255,255,255,0.04)',
  border:       '1px solid rgba(255,255,255,0.08)',
  borderRadius: '11px',
  padding:      '13px 15px',
  fontFamily:   'var(--f-body)',
  fontSize:     '15px',
  fontWeight:   400,
  color:        'rgba(255,255,255,0.92)',
  outline:      'none',
  caretColor:   '#1fce94',
  transition:   'border-color 160ms ease',
  boxSizing:    'border-box' as const,
}

// ── ROOT COMPONENT ────────────────────────────────────────────────

export function CaptureScreen({ isOpen, onClose, onSaved }: Props) {
  const [method,    setMethod]    = useState<Method>('choose')
  const [stage,     setStage]     = useState<Stage>('input')
  const [understood,setUnderstood]= useState<UnderstandResult | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setMethod('choose'); setStage('input')
        setUnderstood(null); setSaving(false); setError(null)
      }, 320)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  function handleUnderstood(result: UnderstandResult) {
    setUnderstood(result)
    if (result.clarification.needed) {
      setStage('clarifying')
    } else {
      setStage('confirming')
    }
  }

  function handleClarified(result: UnderstandResult) {
    setUnderstood(result)
    setStage('confirming')
  }

  function handleBack() {
    if (stage === 'confirming' || stage === 'clarifying') {
      setStage('input'); setUnderstood(null); setError(null)
    } else {
      setMethod('choose'); setStage('input'); setUnderstood(null); setError(null)
    }
  }

  async function handleSave(input: CreateRecommendationInput) {
    setSaving(true); setError(null)
    try {
      await onSaved(input)
    } catch {
      setError("Couldn't save — try again?")
      setSaving(false)
    }
  }

  // ── METHOD CHOOSER — bottom sheet ────────────────────────────────
  if (method === 'choose') {
    return (
      <>
        <div
          onClick={onClose}
          style={{
            position:      'fixed', inset: 0,
            background:    'rgba(0,0,0,0.72)',
            zIndex:        390,
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition:    'opacity 220ms ease',
          }}
        />
        <div style={{
          position:   'fixed', bottom: 0, left: 0, right: 0,
          zIndex:     400,
          transform:  isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{
            maxWidth:      '430px',
            margin:        '0 auto',
            background:    '#141414',
            borderRadius:  '22px 22px 0 0',
            border:        '1px solid rgba(255,255,255,0.07)',
            borderBottom:  'none',
            paddingBottom: 'env(safe-area-inset-bottom, 32px)',
            minHeight:     '65vh',
            display:       'flex',
            flexDirection: 'column',
            justifyContent:'center',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 8px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.18)' }} />
            </div>
            {/* Three options — inverted triangle: speak top-left, scan top-right, type bottom-center */}
            <div style={{ padding: '16px 20px 28px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0' }}>
              {/* Top row: speak + scan */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <MethodOption icon={<WarliMicIcon />}    label="speak" color="rgba(200,21,30,0.90)"  glow="rgba(200,21,30,0.30)"  onClick={() => setMethod('speak')} />
                <MethodOption icon={<WarliCameraIcon />} label="scan"  color="rgba(60,130,255,0.90)" glow="rgba(60,130,255,0.30)" onClick={() => setMethod('scan')}  />
              </div>
              {/* Bottom row: type centered */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <MethodOption icon={<WarliPenIcon />} label="type" color="rgba(16,195,182,0.90)" glow="rgba(16,195,182,0.30)" onClick={() => setMethod('type')} />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── FULL SCREEN STAGES ────────────────────────────────────────────
  const selectedCat = understood?.category
    ? CATEGORIES.find(c => c.id === understood.category)
    : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position:      'fixed', inset: 0, zIndex: 400,
        overflowY:     'auto',
        opacity:       isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transform:     isOpen ? 'translateY(0)' : 'translateY(16px)',
        transition:    'opacity 240ms ease, transform 240ms cubic-bezier(0.16,1,0.3,1)',
        // Category-responsive background
        background:    '#0e0e0e',
        backgroundImage: selectedCat
          ? `radial-gradient(ellipse at 50% 0%, rgba(${selectedCat.vividRgb},0.08) 0%, transparent 55%)`
          : 'radial-gradient(ellipse at 50% 0%, rgba(31,206,148,0.05) 0%, transparent 55%)',
      }}
    >
      <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100dvh', paddingBottom: '60px' }}>

        {/* Back pill */}
        <div style={{ padding: '52px 16px 0' }}>
          <button onClick={handleBack} style={NEON_PILL}>
            <ChevronLeft />
            {stage === 'confirming' || stage === 'clarifying' ? 'back' : 'options'}
          </button>
        </div>

        {/* INPUT STAGES */}
        {stage === 'input' && method === 'speak' && (
          <SpeakInput
            onUnderstood={handleUnderstood}
            onError={setError}
            error={error}
          />
        )}

        {stage === 'input' && method === 'scan' && (
          <ScanInput
            onUnderstood={handleUnderstood}
            onError={setError}
            error={error}
          />
        )}

        {stage === 'input' && method === 'type' && (
          <TypeInput
            onUnderstood={handleUnderstood}
            onError={setError}
            error={error}
          />
        )}

        {/* CLARIFICATION — one focused question */}
        {stage === 'clarifying' && understood && (
          <ClarificationStep
            understood={understood}
            onClarified={handleClarified}
            selectedCat={selectedCat}
          />
        )}

        {/* CONFIRMATION — card preview + save */}
        {stage === 'confirming' && understood && (
          <ConfirmationScreen
            understood={understood}
            onSave={handleSave}
            saving={saving}
            error={error}
            selectedCat={selectedCat}
          />
        )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes recordPulse {
          0%,100% { box-shadow: 0 0 0 8px rgba(200,21,30,0.10), 0 8px 32px rgba(200,21,30,0.40); }
          50%     { box-shadow: 0 0 0 14px rgba(200,21,30,0.05), 0 8px 32px rgba(200,21,30,0.55); }
        }
        @keyframes pulseOpacity {
          0%,100% { opacity: 0.55; }
          50%     { opacity: 0.90; }
        }
      `}</style>
    </div>
  )
}

// ── SPEAK INPUT ───────────────────────────────────────────────────

function SpeakInput({ onUnderstood, onError, error }: {
  onUnderstood: (r: UnderstandResult) => void
  onError:      (e: string) => void
  error:        string | null
}) {
  const [recording,  setRecording]  = useState(false)
  const [processing, setProcessing] = useState(false)
  const [seconds,    setSeconds]    = useState(0)
  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  function startRecording() {
    chunksRef.current = []
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mr = new MediaRecorder(stream)
        mediaRef.current = mr
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); processAudio() }
        mr.start()
        setRecording(true); setSeconds(0)
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      })
      .catch(() => onError('Microphone access denied — allow it in your browser settings'))
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
        onUnderstood(data.data as UnderstandResult)
      }
    } catch {
      onError('Something went wrong — try again?')
    } finally {
      setProcessing(false)
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ padding: '32px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
      <div style={{ padding: '0 0 8px' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400, fontSize: '30px', color: 'rgba(255,255,255,0.95)', margin: 0, textAlign: 'center' }}>
          speak it
        </h1>
        <p style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0', textAlign: 'center' }}>
          Say what was recommended and who told you
        </p>
      </div>

      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={processing}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        style={{
          width:                   '96px', height: '96px',
          borderRadius:            '50%',
          background:              recording
            ? 'radial-gradient(circle at 38% 32%, #8e0c12 0%, #5c0b10 60%, #300208 100%)'
            : 'radial-gradient(circle at 38% 32%, #0a2018 0%, #071510 100%)',
          border:                  `2px solid ${recording ? '#c8151e' : 'rgba(31,206,148,0.40)'}`,
          display:                 'flex', alignItems: 'center', justifyContent: 'center',
          cursor:                  processing ? 'not-allowed' : 'pointer',
          transition:              'all 220ms ease',
          animation:               recording ? 'recordPulse 1.2s ease-in-out infinite' : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {processing ? (
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#1fce94', animation: 'spin 0.8s linear infinite' }} />
        ) : recording ? (
          <div style={{ width: '20px', height: '20px', borderRadius: '3px', background: '#c8151e' }} />
        ) : (
          <WarliMicIcon />
        )}
      </button>

      <p style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 1.6, maxWidth: '260px' }}>
        {processing ? 'Understanding what you said…' :
         recording  ? `Recording — tap to stop  ${fmt(seconds)}` :
         'Tap to start. Speak naturally.'}
      </p>

      {recording && (
        <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '15px', color: 'rgba(255,255,255,0.30)', textAlign: 'center', maxWidth: '260px', lineHeight: 1.6 }}>
          &ldquo;Rohit told me to watch Fight Club, the David Fincher one&rdquo;
        </p>
      )}

      {error && <ErrorLine message={error} />}
    </div>
  )
}

// ── SCAN INPUT ────────────────────────────────────────────────────

function ScanInput({ onUnderstood, onError, error }: {
  onUnderstood: (r: UnderstandResult) => void
  onError:      (e: string) => void
  error:        string | null
}) {
  const [processing, setProcessing] = useState(false)
  const [preview,    setPreview]    = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { onError('Please upload an image file'); return }
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
        onUnderstood(data.data as UnderstandResult)
      }
    } catch {
      onError('Something went wrong — try again?')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div style={{ padding: '32px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400, fontSize: '30px', color: 'rgba(255,255,255,0.95)', margin: 0, textAlign: 'center' }}>
          scan it
        </h1>
        <p style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0', textAlign: 'center' }}>
          Upload a screenshot and we&rsquo;ll read it
        </p>
      </div>

      <div
        onClick={() => !processing && inputRef.current?.click()}
        style={{
          width: '100%', maxWidth: '320px',
          border:        '1px dashed rgba(255,255,255,0.16)',
          borderRadius:  '18px',
          padding:       preview ? '0' : '40px 24px',
          display:       'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap:           '14px', cursor: processing ? 'not-allowed' : 'pointer',
          background:    preview ? 'transparent' : 'rgba(255,255,255,0.02)',
          position:      'relative', overflow: 'hidden', transition: 'border-color 160ms ease',
        }}
      >
        {preview ? (
          <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '18px', objectFit: 'cover', maxHeight: '240px', opacity: processing ? 0.4 : 1, transition: 'opacity 200ms ease' }} />
        ) : (
          <>
            <WarliCameraIcon large />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '14px', color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>Tap to upload a screenshot</div>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>WhatsApp, Instagram, anything</div>
            </div>
          </>
        )}
        {processing && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,14,0.80)', borderRadius: '18px', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', borderTopColor: '#1fce94', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontFamily: 'var(--f-body)', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Reading the image…</p>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {error && <ErrorLine message={error} />}
    </div>
  )
}

// ── TYPE INPUT ────────────────────────────────────────────────────
// Structured form: title, category, subcategory, source, note.
// On continue: if all fields are clear → skip LLM → go straight to confirm.
// If any field is vague or missing → send to understand → clarification if needed.

function TypeInput({ onUnderstood, onError, error }: {
  onUnderstood: (r: UnderstandResult) => void
  onError:      (e: string) => void
  error:        string | null
}) {
  const [title,      setTitle]      = useState('')
  const [category,   setCategory]   = useState<Category | null>(null)
  const [subtype,    setSubtype]    = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [note,         setNote]         = useState('')
  const [locationHint, setLocationHint] = useState('')
  const [processing,   setProcessing]   = useState(false)
  const [promptIdx,  setPromptIdx]  = useState(0)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 160) }, [])

  const activeCat = category ? CATEGORIES.find(c => c.id === category) : null
  const subtypes  = activeCat ? activeCat.nudges : []

  // Rotate note prompt every 4s
  useEffect(() => {
    if (note.length > 0) return
    const prompts = activeCat?.notePlaceholders ?? ['What made you save this?']
    const interval = setInterval(() => setPromptIdx(i => (i + 1) % prompts.length), 4000)
    return () => clearInterval(interval)
  }, [note, activeCat])

  const notePlaceholder = (activeCat?.notePlaceholders ?? ['What made you save this?'])[promptIdx % (activeCat?.notePlaceholders?.length ?? 1)]

  // Determine if input is clear enough to skip LLM
  function isInputClear(): boolean {
    return title.trim().length > 0 && category !== null && sourceName.trim().length > 0
  }

  async function handleContinue() {
    if (!title.trim()) { onError('What are you saving?'); return }
    setProcessing(true)

    if (isInputClear()) {
      // Structured and complete — skip LLM, build result directly
      const result: UnderstandResult = {
        title:       title.trim(),
        category:    category,
        subtype:     subtype,
        source_name: sourceName.trim(),
        source_type: null,
        note:        note.trim() || null,
        confidence: {
          title:       'high',
          category:    'high',
          subtype:     subtype ? 'high' : null,
          source_name: 'high',
          source_type: null,
        },
        transcription_quality: 'clear',
        multiple_items:        null,
        input_language:        'english',
        supplementary: {
          what_to_order: null,
          dates:         null,
          director:      null,
          author:        null,
          location_hint: locationHint.trim() || null,
        },
        clarification: { needed: false, field: null, question: null, type: null, options: null },
        raw_input: `${title} ${sourceName}`.trim(),
      }
      setProcessing(false)
      onUnderstood(result)
      return
    }

    // Vague input — send to understand
    const inputStr = [
      title.trim(),
      category ? `category: ${category}` : '',
      subtype  ? `type: ${subtype}` : '',
      sourceName.trim()   ? `from: ${sourceName.trim()}` : '',
      locationHint.trim() ? `in: ${locationHint.trim()}`  : '',
      note.trim() ? `note: ${note.trim()}` : '',
    ].filter(Boolean).join(', ')

    try {
      const res  = await fetch('/api/capture/understand', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ input: inputStr, input_type: 'typed' }),
      })
      const data = await res.json()
      if (!res.ok || !data.data) {
        onError(data.error ?? "Couldn't process — try again?")
      } else {
        onUnderstood(data.data as UnderstandResult)
      }
    } catch {
      onError('Something went wrong — try again?')
    } finally {
      setProcessing(false)
    }
  }

  const vividRgb = activeCat?.vividRgb ?? '31,206,148'
  const vividColor = activeCat?.vividColor ?? '#1fce94'

  return (
    <div style={{ padding: '32px 20px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400, fontSize: '30px', color: 'rgba(255,255,255,0.95)', margin: 0 }}>
          type it.
        </h1>
        <p style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0' }}>
          Structured saves. Natural input. Both work.
        </p>
      </div>

      {/* WHAT */}
      <div>
        <label style={LABEL_STYLE}>What is it?</label>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && title.trim()) handleContinue() }}
          placeholder="Film, book, restaurant, album…"
          style={FIELD_STYLE}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onFocus={e => { e.target.style.borderColor = `rgba(${vividRgb},0.45)` }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* CATEGORY */}
      <div>
        <label style={LABEL_STYLE}>What kind?</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {CATEGORIES.map(cat => {
            const sel = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setCategory(cat.id as Category); setSubtype(null) }}
                style={{
                  padding:                 '10px 4px',
                  borderRadius:            '9px',
                  border:                  `1px solid ${sel ? cat.vividColor : 'rgba(255,255,255,0.07)'}`,
                  background:              sel ? `rgba(${cat.vividRgb},0.14)` : 'rgba(255,255,255,0.02)',
                  fontFamily:              'var(--f-ui)',
                  fontSize:                '9px',
                  fontWeight:              700,
                  letterSpacing:           '0.06em',
                  textTransform:           'uppercase',
                  color:                   sel ? cat.vividColor : 'rgba(255,255,255,0.38)',
                  cursor:                  'pointer',
                  transition:              'all 140ms ease',
                  boxShadow:               sel ? `0 0 10px rgba(${cat.vividRgb},0.20)` : 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* SUBCATEGORY — appears after category selected */}
      {activeCat && subtypes.length > 0 && (
        <div>
          <label style={LABEL_STYLE}>What type?</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {subtypes.map(st => {
              const sel = subtype === st
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSubtype(sel ? null : st)}
                  style={{
                    padding:                 '6px 14px',
                    borderRadius:            '20px',
                    border:                  `1px solid rgba(${vividRgb},${sel ? '0.65' : '0.22'})`,
                    background:              sel ? `rgba(${vividRgb},0.18)` : `rgba(${vividRgb},0.06)`,
                    fontFamily:              'var(--f-ui)',
                    fontSize:                '10px',
                    fontWeight:              700,
                    letterSpacing:           '1px',
                    textTransform:           'uppercase',
                    color:                   sel ? vividColor : `rgba(${vividRgb},0.72)`,
                    cursor:                  'pointer',
                    transition:              'all 140ms ease',
                    WebkitTapHighlightColor: 'transparent',
                    boxShadow:               sel ? `0 0 10px rgba(${vividRgb},0.22)` : 'none',
                  }}
                >
                  {st}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* SOURCE */}
      <div>
        <label style={LABEL_STYLE}>Who told you?</label>
        <input
          type="text"
          value={sourceName}
          onChange={e => setSourceName(e.target.value)}
          placeholder="Arjun, @boxoffice, a newsletter…"
          style={FIELD_STYLE}
          autoComplete="off"
          onFocus={e => { e.target.style.borderColor = `rgba(${vividRgb},0.45)` }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* CITY / AREA — only for place categories (dine, do, visit) */}
      {(category === 'dine' || category === 'do' || category === 'visit') && (
        <div>
          <label style={LABEL_STYLE}>
            City or area
            <span style={{ marginLeft: '6px', fontWeight: 400, fontSize: '9px', textTransform: 'none', opacity: 0.45 }}>optional</span>
          </label>
          <input
            type="text"
            value={locationHint}
            onChange={e => setLocationHint(e.target.value)}
            placeholder="Bandra, Lower Parel, Delhi…"
            style={FIELD_STYLE}
            autoComplete="off"
            onFocus={e => { e.target.style.borderColor = `rgba(${vividRgb},0.45)` }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </div>
      )}

      {/* NOTE */}
      <div>
        <label style={LABEL_STYLE}>
          One thing to remember
          <span style={{ marginLeft: '6px', fontWeight: 400, fontSize: '9px', textTransform: 'none', opacity: 0.45 }}>optional</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={notePlaceholder}
          maxLength={500}
          rows={2}
          style={{
            ...FIELD_STYLE,
            resize:    'none',
            lineHeight:1.6,
            fontStyle: note.length === 0 ? 'italic' : 'normal',
          }}
          onFocus={e => { e.target.style.borderColor = `rgba(${vividRgb},0.45)` }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {error && <ErrorLine message={error} />}

      <button
        onClick={handleContinue}
        disabled={!title.trim() || processing}
        style={{
          width:         '100%', height: '52px', borderRadius: '14px', border: 'none',
          background:    title.trim() && !processing ? '#1fce94' : 'rgba(31,206,148,0.28)',
          color:         title.trim() && !processing ? '#080f0a' : 'rgba(31,206,148,0.45)',
          fontFamily:    'var(--f-ui)', fontSize: '13px', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          cursor:        title.trim() && !processing ? 'pointer' : 'not-allowed',
          transition:    'all 180ms ease',
          boxShadow:     title.trim() && !processing ? '0 4px 24px rgba(31,206,148,0.35)' : 'none',
          WebkitTapHighlightColor: 'transparent',
          marginBottom:  '24px',
        }}
      >
        {processing ? 'Understanding…' : 'Continue'}
      </button>
    </div>
  )
}

// ── CLARIFICATION STEP ────────────────────────────────────────────
// One focused question. Never two. Answers are tappable — never a form.

function ClarificationStep({ understood, onClarified, selectedCat }: {
  understood:  UnderstandResult
  onClarified: (r: UnderstandResult) => void
  selectedCat: ReturnType<typeof CATEGORIES.find> | null
}) {
  const { clarification } = understood
  const [textAnswer, setTextAnswer] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (clarification.type === 'text_input') {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [clarification.type])

  function handleSelectAnswer(answer: string) {
    // User tapped an option
    if (clarification.field === 'title') {
      if (answer === 'No, let me type it') {
        // Switch to text input mode
        setTextAnswer('')
        return
      }
      // If multiple_items — save the chosen item
      if (understood.multiple_items) {
        onClarified({ ...understood, title: answer, multiple_items: null, clarification: { needed: false, field: null, question: null, type: null, options: null } })
        return
      }
      // Confirmed the suggested title
      onClarified({ ...understood, title: answer, clarification: { needed: false, field: null, question: null, type: null, options: null } })
      return
    }
    if (clarification.field === 'category') {
      const catId = answer.toLowerCase() as typeof understood.category
      onClarified({ ...understood, category: catId, clarification: { needed: false, field: null, question: null, type: null, options: null } })
      return
    }
    // Generic select answer
    onClarified({ ...understood, clarification: { needed: false, field: null, question: null, type: null, options: null } })
  }

  function handleTextAnswer() {
    if (!textAnswer.trim()) return
    if (clarification.field === 'title') {
      onClarified({ ...understood, title: textAnswer.trim(), clarification: { needed: false, field: null, question: null, type: null, options: null } })
      return
    }
    if (clarification.field === 'location_hint') {
      onClarified({
        ...understood,
        supplementary: { ...understood.supplementary, location_hint: textAnswer.trim() },
        clarification: { needed: false, field: null, question: null, type: null, options: null },
      })
      return
    }
  }

  const vividColor = selectedCat?.vividColor ?? '#1fce94'
  const vividRgb   = selectedCat?.vividRgb   ?? '31,206,148'

  // Determine if we should show text input (user chose "No, let me type it" or forced text)
  const showTextInput = clarification.type === 'text_input' || textAnswer !== '' || clarification.options?.includes('No, let me type it') === false

  return (
    <div style={{ padding: '32px 20px 0', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Question */}
      <div>
        <div style={{
          fontFamily:   'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize:     '26px', color: 'rgba(255,255,255,0.95)',
          lineHeight:   1.2, marginBottom: '8px',
        }}>
          {clarification.question}
        </div>
        {/* Context — what we already understood */}
        {(understood.category || understood.source_name) && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {understood.category && (
              <span style={{ fontFamily: 'var(--f-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: `rgba(${vividRgb},0.80)`, background: `rgba(${vividRgb},0.12)`, border: `1px solid rgba(${vividRgb},0.25)`, borderRadius: '20px', padding: '4px 10px' }}>
                {understood.category}
              </span>
            )}
            {understood.source_name && (
              <span style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 500, color: '#d41020', background: 'rgba(212,16,32,0.08)', border: '1px solid rgba(212,16,32,0.15)', borderRadius: '20px', padding: '4px 10px' }}>
                from {understood.source_name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Category tiles — special treatment */}
      {clarification.field === 'category' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleSelectAnswer(cat.id)}
              style={{
                padding:                 '16px 8px',
                borderRadius:            '12px',
                border:                  `1px solid rgba(${cat.vividRgb},0.30)`,
                background:              `rgba(${cat.vividRgb},0.08)`,
                fontFamily:              'var(--f-ui)', fontSize: '10px', fontWeight: 700,
                letterSpacing:           '0.06em', textTransform: 'uppercase',
                color:                   cat.vividColor,
                cursor:                  'pointer', transition: 'all 140ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${cat.vividRgb},0.18)` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${cat.vividRgb},0.08)` }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Select options — pills */}
      {clarification.type === 'select' && clarification.field !== 'category' && clarification.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {clarification.options.map(opt => (
            <button
              key={opt}
              onClick={() => {
                if (opt === 'No, let me type it') { setTextAnswer('') }
                else handleSelectAnswer(opt)
              }}
              style={{
                padding:                 '14px 18px', borderRadius: '12px', textAlign: 'left',
                border:                  `1px solid rgba(${vividRgb},0.25)`,
                background:              `rgba(${vividRgb},0.06)`,
                fontFamily:              'var(--f-display)', fontStyle: 'italic',
                fontSize:                '18px', color: 'rgba(255,255,255,0.88)',
                cursor:                  'pointer', transition: 'all 140ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${vividRgb},0.14)` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${vividRgb},0.06)` }}
            >
              {opt === 'No, let me type it' ? (
                <span style={{ fontFamily: 'var(--f-body)', fontStyle: 'normal', fontSize: '13px', color: 'rgba(255,255,255,0.38)' }}>
                  {opt}
                </span>
              ) : opt}
            </button>
          ))}
        </div>
      )}

      {/* Text input — for title clarification via typing */}
      {(clarification.type === 'text_input' || (clarification.options?.includes('No, let me type it') && textAnswer === '' && clarification.type !== 'select')) && (
        <div>
          <input
            ref={inputRef}
            type="text"
            value={textAnswer}
            onChange={e => setTextAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && textAnswer.trim()) handleTextAnswer() }}
            placeholder={clarification.field === 'title' ? 'Type the title…' : 'Type your answer…'}
            style={FIELD_STYLE}
            autoComplete="off"
            onFocus={e => { e.target.style.borderColor = `rgba(${vividRgb},0.45)` }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={handleTextAnswer}
            disabled={!textAnswer.trim()}
            style={{
              marginTop:     '10px', width: '100%', height: '50px',
              borderRadius:  '14px', border: 'none',
              background:    textAnswer.trim() ? vividColor : 'rgba(255,255,255,0.06)',
              color:         textAnswer.trim() ? '#080f0a' : 'rgba(255,255,255,0.25)',
              fontFamily:    'var(--f-ui)', fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor:        textAnswer.trim() ? 'pointer' : 'not-allowed',
              transition:    'all 160ms ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

// ── CONFIRMATION SCREEN ───────────────────────────────────────────
// The user sees their card before it is saved.
// This is the delight moment — the card is born here.
// Every field is editable. Save is always neon.

function ConfirmationScreen({ understood, onSave, saving, error, selectedCat }: {
  understood:  UnderstandResult
  onSave:      (input: CreateRecommendationInput) => Promise<void>
  saving:      boolean
  error:       string | null
  selectedCat: ReturnType<typeof CATEGORIES.find> | null
}) {
  const [title,       setTitle]       = useState(understood.title ?? '')
  const [category,    setCategory]    = useState<Category | null>(understood.category)
  const [sourceName,  setSourceName]  = useState(understood.source_name ?? '')
  const [sourceType,  setSourceType]  = useState<SourceType>(understood.source_type ?? 'friend')
  const [note,        setNote]        = useState(understood.note ?? '')
  const [promptIdx,   setPromptIdx]   = useState(0)
  const [editingField,setEditingField]= useState<string | null>(null)

  const activeCat = category ? CATEGORIES.find(c => c.id === category) : selectedCat
  const vividRgb  = activeCat?.vividRgb   ?? '31,206,148'
  const vividColor= activeCat?.vividColor ?? '#1fce94'

  // Rotate note prompt every 4 seconds
  useEffect(() => {
    if (note.length > 0) return
    const prompts  = activeCat?.notePlaceholders ?? ['What made you save this?']
    const interval = setInterval(() => setPromptIdx(i => (i + 1) % prompts.length), 4000)
    return () => clearInterval(interval)
  }, [note, activeCat])

  const prompts     = activeCat?.notePlaceholders ?? ['What made you save this?']
  const placeholder = prompts[promptIdx % prompts.length]

  const canSave = title.trim().length > 0 && category !== null

  function doSave() {
    if (!canSave || saving) return
    const supplementary = understood.supplementary ?? {}
    onSave({
      title:       title.trim(),
      category:    category!,
      source_type: sourceType,
      source_name: sourceName.trim() || 'Someone',
      notes:       note.trim() || undefined,
      metadata: {
        subtype:       understood.subtype ?? undefined,
        ...(supplementary.director      ? { director:      supplementary.director }      : {}),
        ...(supplementary.author        ? { author:        supplementary.author }        : {}),
        ...(supplementary.what_to_order ? { what_to_order: supplementary.what_to_order } : {}),
        ...(supplementary.dates         ? { dates:         supplementary.dates }         : {}),
        ...(supplementary.location_hint ? { location_hint: supplementary.location_hint } : {}),
      },
    })
  }

  return (
    <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Card preview — the card being born */}
      <div style={{
        borderRadius: '14px', overflow: 'hidden',
        border:       `1px solid rgba(${vividRgb},0.35)`,
        boxShadow:    `0 0 0 1px rgba(${vividRgb},0.08), 0 0 20px rgba(${vividRgb},0.12)`,
        background:   activeCat?.deepDark ?? '#0d0d0d',
        transition:   'border-color 300ms ease, box-shadow 300ms ease',
      }}>
        {/* Atmospheric gradient zone */}
        <div style={{
          height:     '120px', position: 'relative', overflow: 'hidden',
          background: activeCat
            ? [
                `radial-gradient(ellipse at 30% 25%, rgba(${vividRgb},0.70) 0%, transparent 50%)`,
                `radial-gradient(ellipse at 75% 70%, rgba(${vividRgb},0.40) 0%, transparent 45%)`,
                `linear-gradient(145deg, ${activeCat.deepDark} 0%, #111111 100%)`,
              ].join(', ')
            : '#161616',
        }}>
          {/* Grain */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundSize: '180px 180px', opacity: 0.05, mixBlendMode: 'overlay',
          }} />
          {/* Category badge */}
          {category && (
            <div style={{
              position: 'absolute', top: '12px', left: '12px',
              fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: '20px',
              background: `rgba(${vividRgb},0.16)`, border: `1px solid rgba(${vividRgb},0.40)`,
              color: 'rgba(255,255,255,0.90)',
            }}>
              {activeCat?.label.toUpperCase()}
            </div>
          )}
          {/* Subtype badge */}
          {understood.subtype && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700,
              letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.55)',
            }}>
              {understood.subtype}
            </div>
          )}
        </div>

        {/* Info zone */}
        <div style={{ padding: '14px 16px 16px', background: activeCat?.deepDark ?? '#0d0d0d' }}>
          <div style={{
            fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 600,
            fontSize:   '24px', color: 'rgba(255,255,255,0.97)', lineHeight: 1.1,
            marginBottom: '4px',
          }}>
            {title || <span style={{ opacity: 0.30 }}>Title</span>}
          </div>
          {/* Supplementary meta if available */}
          {(understood.supplementary.director || understood.supplementary.author) && (
            <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: `rgba(${vividRgb},0.60)`, marginBottom: '10px' }}>
              {understood.supplementary.director ?? understood.supplementary.author}
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '10px', borderTop: '0.5px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '15px', color: '#1fce94', textShadow: '0 0 14px rgba(31,206,148,0.45)' }}>
              taareef
            </div>
            <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: '#d41020', fontWeight: 500 }}>
              {sourceName ? `from ${sourceName}` : <span style={{ color: 'rgba(255,255,255,0.30)' }}>add source</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Editable fields — minimal, only what matters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Title */}
        <EditableField
          label="What is it?"
          value={title}
          onChange={setTitle}
          placeholder="Title"
          vividRgb={vividRgb}
          active={editingField === 'title'}
          onFocus={() => setEditingField('title')}
          onBlur={() => setEditingField(null)}
        />

        {/* Category — tap to change */}
        <div>
          <span style={LABEL_STYLE}>What kind?</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '5px' }}>
            {CATEGORIES.map(cat => {
              const sel = category === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as Category)}
                  style={{
                    padding:                 '9px 4px', borderRadius: '8px',
                    border:                  `1px solid ${sel ? cat.vividColor : 'rgba(255,255,255,0.07)'}`,
                    background:              sel ? `rgba(${cat.vividRgb},0.14)` : 'rgba(255,255,255,0.02)',
                    fontFamily:              'var(--f-ui)', fontSize: '9px', fontWeight: 700,
                    letterSpacing:           '0.06em', textTransform: 'uppercase',
                    color:                   sel ? cat.vividColor : 'rgba(255,255,255,0.38)',
                    cursor:                  'pointer', transition: 'all 140ms ease',
                    boxShadow:               sel ? `0 0 10px rgba(${cat.vividRgb},0.20)` : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Source */}
        <EditableField
          label="Who told you?"
          value={sourceName}
          onChange={setSourceName}
          placeholder="Arjun, @boxoffice, a newsletter…"
          vividRgb={vividRgb}
          active={editingField === 'source'}
          onFocus={() => setEditingField('source')}
          onBlur={() => setEditingField(null)}
        />

        {/* Note — with rotating prompt */}
        <div>
          <span style={LABEL_STYLE}>
            One thing to remember
            <span style={{ marginLeft: '6px', fontWeight: 400, fontSize: '9px', textTransform: 'none', opacity: 0.45 }}>optional</span>
          </span>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={placeholder}
            maxLength={500}
            rows={2}
            style={{
              ...FIELD_STYLE, resize: 'none', lineHeight: 1.6,
              fontStyle: note.length === 0 ? 'italic' : 'normal',
            }}
            onFocus={e => { setEditingField('note'); e.target.style.borderColor = `rgba(${vividRgb},0.45)` }}
            onBlur={e => { setEditingField(null); e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </div>

      </div>

      {error && <ErrorLine message={error} />}

      {/* Save */}
      <button
        onClick={doSave}
        disabled={!canSave || saving}
        style={{
          width:         '100%', height: '54px', borderRadius: '14px', border: 'none',
          background:    canSave && !saving ? '#1fce94' : 'rgba(31,206,148,0.28)',
          color:         canSave && !saving ? '#080f0a' : 'rgba(31,206,148,0.45)',
          fontFamily:    'var(--f-ui)', fontSize: '14px', fontWeight: 700,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          cursor:        canSave && !saving ? 'pointer' : 'not-allowed',
          transition:    'all 180ms ease',
          boxShadow:     canSave && !saving ? '0 4px 28px rgba(31,206,148,0.38)' : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-busy={saving}
      >
        {saving ? 'Saving…' : 'Save it'}
      </button>

    </div>
  )
}

// ── EDITABLE FIELD ────────────────────────────────────────────────

function EditableField({ label, value, onChange, placeholder, vividRgb, active, onFocus, onBlur }: {
  label:       string
  value:       string
  onChange:    (v: string) => void
  placeholder: string
  vividRgb:    string
  active:      boolean
  onFocus:     () => void
  onBlur:      () => void
}) {
  return (
    <div>
      <span style={LABEL_STYLE}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        autoComplete="off"
        style={{
          ...FIELD_STYLE,
          borderColor: active ? `rgba(${vividRgb},0.45)` : 'rgba(255,255,255,0.08)',
        }}
        onFocus={e => { onFocus(); e.target.style.borderColor = `rgba(${vividRgb},0.45)` }}
        onBlur={e => { onBlur(); e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
      />
    </div>
  )
}

// ── METHOD OPTION ─────────────────────────────────────────────────

function MethodOption({ icon, label, color, glow, onClick }: {
  icon:    React.ReactNode
  label:   string
  color:   string
  glow:    string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '20px 16px', borderRadius: '16px', flex: 1,
        WebkitTapHighlightColor: 'transparent', transition: 'background 140ms ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <div style={{ width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 22px ${glow})` }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: '12px', letterSpacing: '2.5px', textTransform: 'uppercase', color }}>
        {label}
      </div>
    </button>
  )
}

// ── SMALL COMPONENTS ──────────────────────────────────────────────

function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: '#f43f5e', textAlign: 'center', margin: 0 }}>
      {message}
    </p>
  )
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

// ── WARLI ICONS ───────────────────────────────────────────────────

function WarliMicIcon({ large }: { large?: boolean }) {
  const s = large ? 68 : 44
  const c = "rgba(200,21,30,0.92)"
  const sw = large ? "3" : "2.5"
  return (
    <svg width={s} height={s} viewBox="0 0 52 52" fill="none">
      {/* Capsule body */}
      <rect x="16" y="4" width="20" height="28" rx="10" stroke={c} strokeWidth={sw} fill="none"/>
      {/* Centre dot — Warli soul mark */}
      <circle cx="26" cy="18" r="3" fill={c} opacity="0.70"/>
      {/* Stand arc */}
      <path d="M10 28 Q10 44 26 44 Q42 44 42 28" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round"/>
      {/* Stem */}
      <line x1="26" y1="44" x2="26" y2="50" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      {/* Base */}
      <line x1="18" y1="50" x2="34" y2="50" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  )
}

function WarliCameraIcon({ large }: { large?: boolean }) {
  const s = large ? 68 : 44
  const c = "rgba(60,130,255,0.92)"
  const sw = large ? "3" : "2.5"
  return (
    <svg width={s} height={s} viewBox="0 0 52 52" fill="none">
      {/* Camera body */}
      <rect x="4" y="14" width="44" height="30" rx="5" stroke={c} strokeWidth={sw} fill="none"/>
      {/* Lens outer */}
      <circle cx="26" cy="29" r="9" stroke={c} strokeWidth={sw} fill="none"/>
      {/* Lens inner — Warli dot */}
      <circle cx="26" cy="29" r="3.5" fill={c}/>
      {/* Viewfinder bump */}
      <path d="M18 14 L21 7 L31 7 L34 14" stroke={c} strokeWidth={sw} strokeLinejoin="round" fill="none"/>
      {/* Flash dot */}
      <circle cx="40" cy="21" r="2.5" fill={c}/>
    </svg>
  )
}

function WarliPenIcon({ large }: { large?: boolean }) {
  const s = large ? 68 : 44
  const c = "rgba(16,195,182,0.92)"
  const sw = large ? "3" : "2.5"
  return (
    <svg width={s} height={s} viewBox="0 0 52 52" fill="none">
      {/* Pen shaft */}
      <line x1="10" y1="42" x2="36" y2="10" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      {/* Nib triangle */}
      <path d="M36 10 L44 7 L41 15 Z" fill={c}/>
      {/* Tip dot */}
      <line x1="6" y1="46" x2="12" y2="40" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      {/* Writing lines — suggest paper */}
      <line x1="16" y1="40" x2="46" y2="40" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.45"/>
      <line x1="20" y1="46" x2="46" y2="46" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.28"/>
    </svg>
  )
}
