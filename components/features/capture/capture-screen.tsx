'use client'

// components/features/capture/capture-screen.tsx
// Session 9 redesign:
// - ChooseMethod → bottom sheet with speak / scan / type (one word each)
// - Warli-derived icons for each method (circles, lines, triangles only)
// - Sheet slides up, drag handle at top, swipe to dismiss
// - Dashboard dimmed behind the sheet
// - Full-width neon pill back navigation on sub-screens
// - Progressive disclosure on JotForm: basic fields first, "Add more detail" expands
// - Category-responsive canvas: radial gradient shifts to category color on selection
// - Rotating category-aware micro-prompts on note field
// - SAVE IT always neon — alive from start

import { useState, useEffect, useRef } from 'react'
import type { CreateRecommendationInput, Category, SourceType } from '@/lib/types'
import { CATEGORIES } from '@/constants/categories'

type Method  = 'choose' | 'speak' | 'scan' | 'type'
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

export function CaptureScreen({ isOpen, onClose, onSaved }: Props) {
  const [method,  setMethod]  = useState<Method>('choose')
  const [stage,   setStage]   = useState<Stage>('input')
  const [prefill, setPrefill] = useState<Prefill | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
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

  // ChooseMethod = bottom sheet on top of dashboard
  if (method === 'choose') {
    return (
      <>
        {/* Backdrop — dims dashboard behind sheet */}
        <div
          onClick={onClose}
          style={{
            position:      'fixed',
            inset:         0,
            background:    'rgba(0,0,0,0.72)',
            zIndex:        390,
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition:    'opacity 220ms ease',
          }}
        />
        {/* Bottom sheet */}
        <div
          style={{
            position:      'fixed',
            bottom:        0,
            left:          0,
            right:         0,
            zIndex:        400,
            transform:     isOpen ? 'translateY(0)' : 'translateY(100%)',
            transition:    'transform 300ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div style={{
            maxWidth:      '430px',
            margin:        '0 auto',
            background:    '#141414',
            borderRadius:  '22px 22px 0 0',
            border:        '1px solid rgba(255,255,255,0.07)',
            borderBottom:  'none',
            paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          }}>
            {/* Drag handle */}
            <div style={{
              display:       'flex',
              justifyContent:'center',
              padding:       '14px 0 8px',
            }}>
              <div style={{
                width:        '36px',
                height:       '4px',
                borderRadius: '2px',
                background:   'rgba(255,255,255,0.18)',
              }} />
            </div>

            {/* Three options — horizontal row, large Warli icons */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-around',
              alignItems:     'center',
              padding:        '20px 24px 32px',
              gap:            '8px',
            }}>
              <MethodOption
                icon={<WarlMicIcon />}
                label="speak"
                color="rgba(200,21,30,0.90)"
                glow="rgba(200,21,30,0.30)"
                onClick={() => setMethod('speak')}
              />
              <MethodOption
                icon={<WarliCameraIcon />}
                label="scan"
                color="rgba(60,130,255,0.90)"
                glow="rgba(60,130,255,0.30)"
                onClick={() => setMethod('scan')}
              />
              <MethodOption
                icon={<WarliPenIcon />}
                label="type"
                color="rgba(16,195,182,0.90)"
                glow="rgba(16,195,182,0.30)"
                onClick={() => setMethod('type')}
              />
            </div>
          </div>
        </div>
      </>
    )
  }

  // Sub-screens: full-screen, slide up
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save a recommendation"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        400,
        display:       'flex',
        flexDirection: 'column',
        overflowY:     'auto',
        opacity:       isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transform:     isOpen ? 'translateY(0)' : 'translateY(16px)',
        transition:    'opacity 240ms ease, transform 240ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{
        width:      '100%',
        maxWidth:   '430px',
        margin:     '0 auto',
        flex:       1,
        display:    'flex',
        flexDirection:'column',
        paddingBottom:'48px',
      }}>

        {method === 'type' && stage === 'input' && (
          <JotForm
            onSave={handleSave}
            onBack={goBack}
            saving={saving}
            error={error}
          />
        )}

        {method === 'speak' && stage === 'input' && (
          <AudioCapture
            onExtracted={onExtracted}
            onBack={goBack}
            onError={setError}
            error={error}
          />
        )}

        {method === 'scan' && stage === 'input' && (
          <OcrCapture
            onExtracted={onExtracted}
            onBack={goBack}
            onError={setError}
            error={error}
          />
        )}

        {stage === 'confirm' && prefill && (
          <ConfirmCard
            prefill={prefill}
            method={method}
            onSave={handleSave}
            onBack={goBack}
            saving={saving}
            error={error}
          />
        )}

      </div>
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
        display:                 'flex',
        flexDirection:           'column',
        alignItems:              'center',
        gap:                     '14px',
        background:              'none',
        border:                  'none',
        cursor:                  'pointer',
        padding:                 '12px 20px',
        borderRadius:            '16px',
        WebkitTapHighlightColor: 'transparent',
        transition:              'background 140ms ease',
        flex:                    1,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      {/* Icon with glow */}
      <div style={{
        width:        '64px',
        height:       '64px',
        display:      'flex',
        alignItems:   'center',
        justifyContent:'center',
        filter:       `drop-shadow(0 0 12px ${glow})`,
      }}>
        {icon}
      </div>
      {/* One-word label */}
      <div style={{
        fontFamily:    'var(--f-ui)',
        fontWeight:    700,
        fontSize:      '11px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color:         color,
      }}>
        {label}
      </div>
    </button>
  )
}

// ── SCREEN SHELL ──────────────────────────────────────────────────
// Provides: category-responsive canvas background + back pill + heading

function ScreenShell({ title, subtitle, onBack, selectedCategory, children }: {
  title:            string
  subtitle?:        string
  onBack:           () => void
  selectedCategory: Category | null
  children:         React.ReactNode
}) {
  // Find vividRgb for selected category
  const catCfg = selectedCategory
    ? CATEGORIES.find(c => c.id === selectedCategory)
    : null
  const rgb = catCfg?.vividRgb ?? null

  const bgStyle: React.CSSProperties = {
    minHeight:   '100dvh',
    background:  '#0e0e0e',
    position:    'relative',
    // Category-responsive subtle radial glow at top center
    backgroundImage: rgb
      ? `radial-gradient(ellipse at 50% 0%, rgba(${rgb},0.08) 0%, transparent 55%)`
      : 'radial-gradient(ellipse at 50% 0%, rgba(31,206,148,0.05) 0%, transparent 55%)',
    transition:  'background-image 400ms ease',
  }

  return (
    <div style={bgStyle}>
      {/* Back pill */}
      <div style={{ padding: '52px 16px 0' }}>
        <button onClick={onBack} style={NEON_PILL as React.CSSProperties}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          options
        </button>
      </div>

      {/* Heading */}
      <div style={{ padding: '24px 20px 0' }}>
        <h1 style={{
          fontFamily:    'var(--f-display)',
          fontWeight:    400,
          fontStyle:     'italic',
          fontSize:      '30px',
          letterSpacing: '-0.01em',
          color:         'rgba(240,230,200,0.95)',
          lineHeight:    1.1,
          margin:        0,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontFamily:  'var(--f-body)',
            fontSize:    '12px',
            color:       'rgba(240,230,200,0.35)',
            marginTop:   '5px',
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  )
}

// ── JOT FORM (type) ───────────────────────────────────────────────
// Progressive disclosure: basic (title + source) shown first.
// "Add more detail →" expands category + note.

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
  const [expanded,   setExpanded]   = useState(false)
  const [promptIdx,  setPromptIdx]  = useState(0)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 160) }, [])

  // Rotate prompt every 4 seconds when no note typed
  useEffect(() => {
    if (notes.length > 0) return
    const catCfg = category ? CATEGORIES.find(c => c.id === category) : null
    const prompts = catCfg?.notePlaceholders ?? [
      'Watch it knowing nothing…',
      'What made you save this?',
      'Who told you, and why?',
    ]
    const interval = setInterval(() => {
      setPromptIdx(i => (i + 1) % prompts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [notes, category])

  const canSave = title.trim().length > 0

  const catCfg       = category ? CATEGORIES.find(c => c.id === category) : null
  const prompts      = catCfg?.notePlaceholders ?? ['What made you save this?', 'One thing to remember…']
  const notePlaceholder = prompts[promptIdx % prompts.length]

  const fieldStyle: React.CSSProperties = {
    width:        '100%',
    background:   'rgba(240,230,200,0.04)',
    border:       '1px solid rgba(240,230,200,0.11)',
    borderRadius: '10px',
    padding:      '13px 14px',
    fontFamily:   'var(--f-body)',
    fontSize:     '15px',
    fontWeight:   400,
    color:        'rgba(240,230,200,0.95)',
    outline:      'none',
    transition:   'border-color 160ms ease',
    caretColor:   '#1fce94',
    boxSizing:    'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily:    'var(--f-ui)',
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color:         'rgba(240,230,200,0.38)',
    display:       'block',
    marginBottom:  '7px',
  }

  function doSave() {
    onSave({
      title:       title.trim(),
      category:    category ?? ('watch' as Category), // fallback if expanded not used
      source_type: 'friend' as SourceType,
      source_name: sourceName.trim() || 'Someone',
      notes:       notes.trim() || undefined,
    })
  }

  return (
    <ScreenShell
      title="type it."
      subtitle="What was recommended, and who told you?"
      onBack={onBack}
      selectedCategory={category}
    >
      <div style={{ padding: '24px 16px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* WHAT IS IT — always shown */}
        <div>
          <label htmlFor="jot-title" style={labelStyle}>What is it?</label>
          <input
            id="jot-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Film title, restaurant name, book…"
            style={fieldStyle}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={e => { e.target.style.borderColor = 'rgba(31,206,148,0.50)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(240,230,200,0.11)' }}
          />
        </div>

        {/* WHO TOLD YOU — always shown */}
        <div>
          <label htmlFor="jot-source" style={labelStyle}>Who told you about it?</label>
          <input
            id="jot-source"
            type="text"
            value={sourceName}
            onChange={e => setSourceName(e.target.value)}
            placeholder="Arjun, that newsletter, a friend…"
            style={fieldStyle}
            autoComplete="off"
            onFocus={e => { e.target.style.borderColor = 'rgba(31,206,148,0.50)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(240,230,200,0.11)' }}
          />
        </div>

        {/* Progressive disclosure toggle */}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              background:              'none',
              border:                  'none',
              cursor:                  'pointer',
              padding:                 '4px 0',
              display:                 'flex',
              alignItems:              'center',
              gap:                     '6px',
              fontFamily:              'var(--f-body)',
              fontSize:                '12px',
              fontWeight:              400,
              color:                   'rgba(240,230,200,0.38)',
              WebkitTapHighlightColor: 'transparent',
              alignSelf:               'flex-start',
            }}
          >
            Add more detail
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}

        {/* Expanded fields */}
        {expanded && (
          <>
            {/* WHAT KIND */}
            <div>
              <label style={labelStyle}>What kind?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {CATEGORIES.map(cat => {
                  const sel = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setCategory(cat.id as Category); setPromptIdx(0) }}
                      aria-pressed={sel}
                      style={{
                        padding:                 '11px 4px',
                        borderRadius:            '9px',
                        border:                  `1px solid ${sel ? cat.vividColor : 'rgba(240,230,200,0.09)'}`,
                        background:              sel ? `${cat.vividColor}1a` : 'rgba(240,230,200,0.025)',
                        fontFamily:              'var(--f-ui)',
                        fontSize:                '9px',
                        fontWeight:              700,
                        letterSpacing:           '0.06em',
                        textTransform:           'uppercase',
                        color:                   sel ? cat.vividColor : 'rgba(240,230,200,0.52)',
                        cursor:                  'pointer',
                        transition:              'all 160ms ease',
                        boxShadow:               sel ? `0 0 12px rgba(${cat.vividRgb},0.28)` : 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ONE THING TO REMEMBER */}
            <div>
              <label htmlFor="jot-note" style={labelStyle}>
                One thing to remember
                <span style={{ opacity: 0.5, marginLeft: '6px', fontWeight: 400, fontSize: '9px', textTransform: 'none' }}>
                  optional
                </span>
              </label>
              <textarea
                id="jot-note"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={notePlaceholder}
                rows={2}
                maxLength={500}
                style={{
                  ...fieldStyle,
                  resize:     'none',
                  lineHeight: 1.55,
                  fontStyle:  notes.length === 0 ? 'italic' : 'normal',
                }}
                onFocus={e => { e.target.style.borderColor = category
                  ? `rgba(${CATEGORIES.find(c => c.id === category)?.vividRgb},0.45)`
                  : 'rgba(31,206,148,0.50)'
                }}
                onBlur={e => { e.target.style.borderColor = 'rgba(240,230,200,0.11)' }}
              />
            </div>
          </>
        )}

        {error && (
          <p role="alert" style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: '#c8151e', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <SaveButton canSave={canSave} saving={saving} onSave={doSave} />

      </div>
    </ScreenShell>
  )
}

// ── AUDIO CAPTURE ─────────────────────────────────────────────────

function AudioCapture({ onExtracted, onBack, onError, error }: {
  onExtracted: (d: Prefill) => void
  onBack:      () => void
  onError:     (e: string) => void
  error:       string | null
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
    <ScreenShell
      title="speak it"
      subtitle="Say what was recommended and who told you"
      onBack={onBack}
      selectedCategory={null}
    >
      <div style={{
        padding:        '0 16px',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '28px',
        flex:           1,
        minHeight:      'calc(100dvh - 240px)',
      }}>
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          style={{
            width:                   '96px',
            height:                  '96px',
            borderRadius:            '50%',
            background:              recording
              ? 'radial-gradient(circle at 38% 32%, #8e0c12 0%, #5c0b10 60%, #300208 100%)'
              : 'radial-gradient(circle at 38% 32%, #0a2018 0%, #071510 100%)',
            border:                  `2px solid ${recording ? '#c8151e' : 'rgba(31,206,148,0.40)'}`,
            display:                 'flex',
            alignItems:              'center',
            justifyContent:          'center',
            cursor:                  processing ? 'not-allowed' : 'pointer',
            transition:              'all 220ms ease',
            boxShadow:               recording
              ? '0 0 0 8px rgba(200,21,30,0.10), 0 8px 32px rgba(200,21,30,0.40)'
              : '0 0 0 0 transparent, 0 6px 24px rgba(31,206,148,0.25)',
            animation:               recording ? 'recordPulse 1.2s ease-in-out infinite' : 'none',
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
            <div style={{ width: '20px', height: '20px', borderRadius: '3px', background: '#c8151e' }} />
          ) : (
            <WarlMicIcon large />
          )}
        </button>

        <p style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: 'rgba(240,230,200,0.45)', textAlign: 'center', lineHeight: 1.5 }}>
          {processing ? 'Reading your voice…' :
           recording  ? `Recording — tap to stop ${fmt(seconds)}` :
           'Tap to start. Speak naturally.'}
        </p>

        {recording && (
          <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '15px', color: 'rgba(240,230,200,0.38)', textAlign: 'center' }}>
            &ldquo;Rohit told me about this place in Bandra…&rdquo;
          </p>
        )}

        {error && (
          <p role="alert" style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: '#c8151e', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
      <style>{`
        @keyframes recordPulse {
          0%,100% { box-shadow: 0 0 0 8px rgba(200,21,30,0.10), 0 8px 32px rgba(200,21,30,0.40); }
          50%      { box-shadow: 0 0 0 14px rgba(200,21,30,0.05), 0 8px 32px rgba(200,21,30,0.55); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </ScreenShell>
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
        onExtracted(data.data as Prefill)
      }
    } catch {
      onError('Something went wrong — try again?')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ScreenShell
      title="scan it"
      subtitle="Upload a screenshot and we'll read it"
      onBack={onBack}
      selectedCategory={null}
    >
      <div style={{
        padding:        '0 16px',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '20px',
        flex:           1,
        minHeight:      'calc(100dvh - 240px)',
      }}>
        <div
          onClick={() => !processing && inputRef.current?.click()}
          style={{
            width:           '100%',
            maxWidth:        '320px',
            border:          '1px dashed rgba(240,230,200,0.20)',
            borderRadius:    '18px',
            padding:         '40px 24px',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             '14px',
            cursor:          processing ? 'not-allowed' : 'pointer',
            background:      preview ? 'transparent' : 'rgba(240,230,200,0.02)',
            position:        'relative',
            overflow:        'hidden',
            transition:      'border-color 160ms ease',
          }}
        >
          {preview ? (
            <img src={preview} alt="Preview" style={{
              width: '100%', borderRadius: '12px',
              objectFit: 'cover', maxHeight: '200px',
              opacity: processing ? 0.5 : 1,
            }} />
          ) : (
            <WarliCameraIcon large />
          )}

          {processing && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(14,14,14,0.7)', borderRadius: '18px',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: '2px solid rgba(240,230,200,0.20)',
                borderTopColor: '#1fce94',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}

          {!preview && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '14px', color: 'rgba(240,230,200,0.65)', marginBottom: '4px' }}>
                Tap to upload a screenshot
              </div>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', color: 'rgba(240,230,200,0.30)' }}>
                WhatsApp, Instagram, anything
              </div>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {error && (
          <p role="alert" style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: '#c8151e', textAlign: 'center' }}>
            {error}
          </p>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </ScreenShell>
  )
}

// ── CONFIRM CARD ──────────────────────────────────────────────────

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
  const [promptIdx,  setPromptIdx]  = useState(0)

  const canSave = title.trim().length > 0 && category !== null

  useEffect(() => {
    if (notes.length > 0) return
    const catCfg = category ? CATEGORIES.find(c => c.id === category) : null
    const prompts = catCfg?.notePlaceholders ?? ['What made you save this?']
    const interval = setInterval(() => {
      setPromptIdx(i => (i + 1) % prompts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [notes, category])

  const catCfg      = category ? CATEGORIES.find(c => c.id === category) : null
  const prompts     = catCfg?.notePlaceholders ?? ['What made you save this?']
  const notePlaceholder = prompts[promptIdx % prompts.length]

  const fieldStyle: React.CSSProperties = {
    width:        '100%',
    background:   'rgba(240,230,200,0.04)',
    border:       '1px solid rgba(240,230,200,0.11)',
    borderRadius: '10px',
    padding:      '13px 14px',
    fontFamily:   'var(--f-body)',
    fontSize:     '15px',
    color:        'rgba(240,230,200,0.95)',
    outline:      'none',
    caretColor:   '#1fce94',
    boxSizing:    'border-box',
    transition:   'border-color 160ms ease',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily:    'var(--f-ui)',
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color:         'rgba(240,230,200,0.38)',
    display:       'block',
    marginBottom:  '7px',
  }

  const backLabel = method === 'speak' ? '← re-record' : '← re-upload'

  return (
    <ScreenShell
      title="does this look right?"
      subtitle="Edit anything before saving."
      onBack={onBack}
      selectedCategory={category}
    >
      <div style={{ padding: '24px 16px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {prefill.confidence === 'low' && (
          <div style={{
            fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#b87820', background: 'rgba(184,120,32,0.12)',
            border: '0.5px solid rgba(184,120,32,0.25)',
            padding: '6px 10px', borderRadius: '6px', alignSelf: 'flex-start',
          }}>
            Low confidence — please review
          </div>
        )}

        {/* Back to options */}
        <button onClick={onBack} style={{
          ...NEON_PILL as React.CSSProperties,
          fontSize: '11px',
          height: '40px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {backLabel.replace('← ', '')}
        </button>

        <div>
          <label style={labelStyle}>What is it?</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            style={fieldStyle} autoComplete="off"
            onFocus={e => { e.target.style.borderColor = 'rgba(31,206,148,0.50)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(240,230,200,0.11)' }}
          />
        </div>

        <div>
          <label style={labelStyle}>What kind?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {CATEGORIES.map(cat => {
              const sel = category === cat.id
              return (
                <button key={cat.id} type="button"
                  onClick={() => { setCategory(cat.id as Category); setPromptIdx(0) }}
                  aria-pressed={sel}
                  style={{
                    padding:                 '11px 4px',
                    borderRadius:            '9px',
                    border:                  `1px solid ${sel ? cat.vividColor : 'rgba(240,230,200,0.09)'}`,
                    background:              sel ? `${cat.vividColor}1a` : 'rgba(240,230,200,0.025)',
                    fontFamily:              'var(--f-ui)',
                    fontSize:                '9px',
                    fontWeight:              700,
                    letterSpacing:           '0.06em',
                    textTransform:           'uppercase',
                    color:                   sel ? cat.vividColor : 'rgba(240,230,200,0.52)',
                    cursor:                  'pointer',
                    transition:              'all 160ms ease',
                    boxShadow:               sel ? `0 0 12px rgba(${cat.vividRgb},0.28)` : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Who told you about it?</label>
          <input type="text" value={sourceName} onChange={e => setSourceName(e.target.value)}
            placeholder="Arjun, that newsletter, a friend…" style={fieldStyle} autoComplete="off"
            onFocus={e => { e.target.style.borderColor = 'rgba(31,206,148,0.50)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(240,230,200,0.11)' }}
          />
        </div>

        <div>
          <label style={labelStyle}>
            One thing to remember
            <span style={{ opacity: 0.5, marginLeft: '6px', fontWeight: 400, fontSize: '9px', textTransform: 'none' }}>
              optional
            </span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={2} maxLength={500}
            placeholder={notePlaceholder}
            style={{
              ...fieldStyle,
              resize: 'none',
              lineHeight: 1.55,
              fontStyle: notes.length === 0 ? 'italic' : 'normal',
            }}
            onFocus={e => { e.target.style.borderColor = category
              ? `rgba(${CATEGORIES.find(c => c.id === category)?.vividRgb},0.45)`
              : 'rgba(31,206,148,0.50)'
            }}
            onBlur={e => { e.target.style.borderColor = 'rgba(240,230,200,0.11)' }}
          />
        </div>

        {error && (
          <p role="alert" style={{ fontFamily: 'var(--f-body)', fontSize: '13px', color: '#c8151e', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <SaveButton
          canSave={canSave} saving={saving}
          onSave={() => onSave({
            title:       title.trim(),
            category:    category!,
            source_type: (prefill.source_type ?? 'friend') as SourceType,
            source_name: sourceName.trim() || 'Someone',
            notes:       notes.trim() || undefined,
          })}
        />
      </div>
    </ScreenShell>
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
      type="button"
      onClick={onSave}
      disabled={saving}
      style={{
        width:                   '100%',
        height:                  '52px',
        borderRadius:            '14px',
        border:                  'none',
        // Always neon — alive from the start
        background:              saving ? 'rgba(31,206,148,0.55)' : '#1fce94',
        color:                   '#080f0a',
        fontFamily:              'var(--f-ui)',
        fontSize:                '15px',
        fontWeight:              700,
        letterSpacing:           '0.08em',
        textTransform:           'uppercase',
        cursor:                  saving ? 'not-allowed' : 'pointer',
        transition:              'background 200ms ease, box-shadow 200ms ease',
        WebkitTapHighlightColor: 'transparent',
        boxShadow:               saving ? 'none' : '0 4px 24px rgba(31,206,148,0.38)',
      }}
      aria-busy={saving}
    >
      {saving ? 'Saving…' : 'Save it'}
    </button>
  )
}

// ── WARLI ICONS ───────────────────────────────────────────────────
// Built from circles, lines, triangles only.
// Glowing in their action color — set by parent via filter drop-shadow.

function WarlMicIcon({ large }: { large?: boolean }) {
  const size = large ? 40 : 28
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Warli mic: circle head + rectangle body + stand lines */}
      <circle cx="20" cy="12" r="7" stroke="rgba(200,21,30,0.90)" strokeWidth="2.5"/>
      <rect x="14" y="12" width="12" height="14" rx="1" stroke="rgba(200,21,30,0.90)" strokeWidth="2.5"/>
      <path d="M10 22 Q10 32 20 32 Q30 32 30 22" stroke="rgba(200,21,30,0.90)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <line x1="20" y1="32" x2="20" y2="38" stroke="rgba(200,21,30,0.90)" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="14" y1="38" x2="26" y2="38" stroke="rgba(200,21,30,0.90)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function WarliCameraIcon({ large }: { large?: boolean }) {
  const size = large ? 40 : 28
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Warli camera: rect body + circle lens + triangle viewfinder */}
      <rect x="4" y="12" width="32" height="22" rx="3" stroke="rgba(60,130,255,0.90)" strokeWidth="2.5"/>
      <circle cx="20" cy="23" r="6" stroke="rgba(60,130,255,0.90)" strokeWidth="2.5"/>
      <circle cx="20" cy="23" r="2" fill="rgba(60,130,255,0.90)"/>
      <path d="M14 12 L17 6 L23 6 L26 12" stroke="rgba(60,130,255,0.90)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      <circle cx="31" cy="17" r="2" fill="rgba(60,130,255,0.90)"/>
    </svg>
  )
}

function WarliPenIcon({ large }: { large?: boolean }) {
  const size = large ? 40 : 28
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Warli pen: diagonal line + triangle tip + lines for writing */}
      <line x1="8" y1="32" x2="28" y2="8" stroke="rgba(16,195,182,0.90)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 8 L34 6 L32 12 Z" fill="rgba(16,195,182,0.90)"/>
      <line x1="4" y1="36" x2="10" y2="30" stroke="rgba(16,195,182,0.90)" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Writing lines */}
      <line x1="14" y1="30" x2="36" y2="30" stroke="rgba(16,195,182,0.40)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="34" x2="36" y2="34" stroke="rgba(16,195,182,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
