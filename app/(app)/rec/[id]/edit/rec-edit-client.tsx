'use client'

// app/(app)/rec/[id]/edit/rec-edit-client.tsx
// Session 9 redesign:
// - Full-width neon pill back nav (consistent with all screens)
// - Source type: pill row (Person · Instagram · Website · WhatsApp · Other)
//   — not a 2-col grid of 10 options
// - Source name placeholder adapts to source type (@handle vs Name)
// - Rotating micro-prompts on note field (category-aware)
// - Canvas background: category-responsive radial gradient
// - Category-vivid rule under heading
// - Save button always neon

import { useState, useCallback, useEffect } from 'react'
import { useRouter }   from 'next/navigation'
import Link            from 'next/link'
import { CATEGORIES }  from '@/constants/categories'
import type { Recommendation, Category, SourceType, RecMetadata } from '@/lib/types'
import { PlacePhotoPicker } from '@/components/features/places/photo-picker'

type Props = { recommendation: Recommendation }

// Source types — simplified to 5 buckets per session 9 decisions
const SOURCE_BUCKETS: { value: SourceType; label: string }[] = [
  { value: 'friend',    label: 'Person'    },
  { value: 'instagram', label: 'Instagram' },
  { value: 'article',   label: 'Website'   },
  { value: 'newsletter',label: 'WhatsApp'  },
  { value: 'self',      label: 'Other'     },
]

// Map the stored source_type to our simplified bucket display
function getBucket(sourceType: SourceType): SourceType {
  const personTypes    = new Set(['friend', 'family', 'colleague'])
  const instagramTypes = new Set(['instagram', 'twitter', 'youtube'])
  const websiteTypes   = new Set(['article', 'podcast'])
  const whatsappTypes  = new Set(['newsletter'])
  if (personTypes.has(sourceType))    return 'friend'
  if (instagramTypes.has(sourceType)) return 'instagram'
  if (websiteTypes.has(sourceType))   return 'article'
  if (whatsappTypes.has(sourceType))  return 'newsletter'
  return 'self'
}

// Derive the actual stored source_type from our bucket + handle signal
function resolveSourceType(bucket: SourceType, name: string): SourceType {
  if (bucket === 'instagram') {
    if (name.startsWith('@')) return 'instagram'
    return 'instagram'
  }
  return bucket
}

const labelStyle: React.CSSProperties = {
  fontFamily:    'var(--f-ui)',
  fontSize:      '9px',
  fontWeight:    700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color:         'rgba(255,255,255,0.32)',
  marginBottom:  '8px',
  display:       'block',
}

export function RecEditClient({ recommendation: rec }: Props) {
  const router = useRouter()

  const [title,       setTitle]       = useState(rec.title)
  const [category,    setCategory]    = useState<Category>(rec.category)
  const [sourceBucket,setSourceBucket]= useState<SourceType>(getBucket(rec.source_type))
  const [sourceName,  setSourceName]  = useState(rec.source_name)
  const [note,        setNote]        = useState(rec.notes ?? '')
  const [promptIdx,   setPromptIdx]   = useState(0)
  const [whatToOrder, setWhatToOrder] = useState(
    typeof (rec.metadata as Record<string,unknown>).what_to_order === 'string'
      ? (rec.metadata as Record<string,unknown>).what_to_order as string : ''
  )
  const [dates, setDates] = useState(
    typeof (rec.metadata as Record<string,unknown>).dates === 'string'
      ? (rec.metadata as Record<string,unknown>).dates as string : ''
  )
  const [saving, setSaving] = useState(false)
  // Photo picker (place categories) — selection persists immediately,
  // independent of "Save changes", matching the detail screen's behaviour
  const [liveImageUrl, setLiveImageUrl] = useState<string | null>(rec.image_url)
  const [error,  setError]  = useState<string | null>(null)

  const selectedCat = CATEGORIES.find(c => c.id === category)

  // Rotate note placeholder every 4 seconds when note is empty
  useEffect(() => {
    if (note.length > 0) return
    const prompts = selectedCat?.notePlaceholders ?? ['What made you save this?']
    const interval = setInterval(() => {
      setPromptIdx(i => (i + 1) % prompts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [note, selectedCat])

  const prompts         = selectedCat?.notePlaceholders ?? ['What made you save this?']
  const notePlaceholder = prompts[promptIdx % prompts.length]

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    background:   'rgba(255,255,255,0.04)',
    border:       `1px solid rgba(255,255,255,0.08)`,
    borderRadius: '11px',
    padding:      '13px 15px',
    fontFamily:   'var(--f-body)',
    fontSize:     '15px',
    fontWeight:   400,
    color:        'rgba(255,255,255,0.90)',
    outline:      'none',
    caretColor:   '#1fce94',
    transition:   'border-color 160ms ease',
    boxSizing:    'border-box',
  }

  async function handleSelectPhoto(url: string) {
    try {
      const res  = await fetch(`/api/recommendations/${rec.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image_url: url }),
      })
      const json = await res.json()
      if (json.data) {
        setLiveImageUrl(url)
        // Invalidate the client router cache — without this, navigating
        // back serves the cached detail page with the OLD photo even
        // though the DB is already updated. (Next.js App Router caches
        // server-rendered segments on the client.)
        router.refresh()
      }
    } catch {
      setError('Could not update photo — try again?')
    }
  }

  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('Title cannot be empty.'); return }
    if (!sourceName.trim()) { setError('Source name cannot be empty.'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/recommendations/${rec.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:       title.trim(),
          category,
          source_type: resolveSourceType(sourceBucket, sourceName),
          source_name: sourceName.trim(),
          notes:       note.trim() || null,
          metadata: {
            ...((rec.metadata as Record<string,unknown>) ?? {}),
            ...(category === 'dine' && whatToOrder.trim() ? { what_to_order: whatToOrder.trim() } : {}),
            ...(category === 'visit' && dates.trim() ? { dates: dates.trim() } : {}),
          },
        }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      router.push(`/rec/${rec.id}`)
      router.refresh()
    } catch {
      setError('Could not save — please try again.')
    } finally {
      setSaving(false)
    }
  }, [title, category, sourceBucket, sourceName, note, whatToOrder, dates, rec.id, rec.metadata, router])

  const sourcePlaceholder = sourceBucket === 'instagram' ? '@handle or page name'
    : sourceBucket === 'article' ? 'Website or publication name'
    : sourceBucket === 'newsletter' ? 'Name or phone contact'
    : sourceBucket === 'self' ? 'Where did you find it?'
    : 'Their name'

  return (
    <div style={{
      minHeight:           '100dvh',
      background:          '#0e0e0e',
      // Category-responsive radial gradient — same as capture screen
      backgroundImage:     selectedCat
        ? `radial-gradient(ellipse at 50% 0%, rgba(${selectedCat.vividRgb},0.07) 0%, transparent 55%)`
        : 'radial-gradient(ellipse at 50% 0%, rgba(31,206,148,0.04) 0%, transparent 55%)',
      transition:          'background-image 400ms ease',
    }}>
      <div style={{ maxWidth: '430px', margin: '0 auto', padding: '0 0 100px' }}>

        {/* Back nav — full-width neon pill */}
        <div style={{ padding: '52px 16px 0' }}>
          <Link href={`/rec/${rec.id}`} style={{
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
            textTransform:           'uppercase',
            color:                   '#1fce94',
            textDecoration:          'none',
            textShadow:              '0 0 12px rgba(31,206,148,0.45)',
            boxShadow:               '0 0 24px rgba(31,206,148,0.08)',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {selectedCat?.label ?? 'Back'}
          </Link>
        </div>

        {/* Heading */}
        <div style={{ padding: '24px 20px 0' }}>
          <h1 style={{
            fontFamily:    'var(--f-display)',
            fontStyle:     'italic',
            fontWeight:    400,
            fontSize:      '30px',
            color:         'rgba(255,255,255,0.95)',
            margin:        0,
            lineHeight:    1.15,
          }}>
            Edit details
          </h1>
          <p style={{
            fontFamily: 'var(--f-body)',
            fontSize:   '13px',
            fontWeight: 300,
            color:      'rgba(255,255,255,0.35)',
            marginTop:  '6px',
          }}>
            Fix anything before it travels.
          </p>
          {/* Category-vivid rule */}
          <div style={{
            height:     '0.5px',
            marginTop:  '16px',
            background: selectedCat
              ? `linear-gradient(to right, rgba(${selectedCat.vividRgb},0.50), transparent)`
              : 'linear-gradient(to right, rgba(255,255,255,0.12), transparent)',
            transition: 'background 400ms ease',
          }} />
        </div>

        {/* Fields */}
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>What is it?</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={500}
              placeholder="Title"
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = selectedCat
                  ? `rgba(${selectedCat.vividRgb},0.45)`
                  : 'rgba(31,206,148,0.45)'
              }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Category */}
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
                    style={{
                      padding:                 '11px 4px',
                      borderRadius:            '9px',
                      border:                  `1px solid ${sel ? cat.vividColor : 'rgba(255,255,255,0.09)'}`,
                      background:              sel ? `rgba(${cat.vividRgb},0.14)` : 'rgba(255,255,255,0.03)',
                      fontFamily:              'var(--f-ui)',
                      fontSize:                '9px',
                      fontWeight:              700,
                      letterSpacing:           '0.06em',
                      textTransform:           'uppercase',
                      color:                   sel ? cat.vividColor : 'rgba(255,255,255,0.45)',
                      cursor:                  'pointer',
                      transition:              'all 140ms ease',
                      boxShadow:               sel ? `0 0 10px rgba(${cat.vividRgb},0.22)` : 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Source type — 5 pill buckets */}
          <div>
            <label style={labelStyle}>What is the source?</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {SOURCE_BUCKETS.map(st => {
                const sel = sourceBucket === st.value
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setSourceBucket(st.value)}
                    style={{
                      padding:                 '7px 14px',
                      borderRadius:            '20px',
                      border:                  `1px solid ${sel
                        ? (selectedCat?.vividColor ?? '#1fce94')
                        : 'rgba(255,255,255,0.12)'}`,
                      background:              sel
                        ? `rgba(${selectedCat?.vividRgb ?? '31,206,148'},0.14)`
                        : 'rgba(255,255,255,0.03)',
                      fontFamily:              'var(--f-ui)',
                      fontSize:                '10px',
                      fontWeight:              700,
                      letterSpacing:           '0.06em',
                      textTransform:           'uppercase',
                      color:                   sel
                        ? (selectedCat?.vividColor ?? '#1fce94')
                        : 'rgba(255,255,255,0.42)',
                      cursor:                  'pointer',
                      transition:              'all 140ms ease',
                      boxShadow:               sel
                        ? `0 0 10px rgba(${selectedCat?.vividRgb ?? '31,206,148'},0.20)`
                        : 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {st.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Source name */}
          <div>
            <label style={labelStyle}>
              {sourceBucket === 'self' ? 'How did you find it?' : 'Name or handle'}
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={e => setSourceName(e.target.value)}
              maxLength={200}
              placeholder={sourcePlaceholder}
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = selectedCat
                  ? `rgba(${selectedCat.vividRgb},0.45)`
                  : 'rgba(31,206,148,0.45)'
              }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Dine — what to order */}
          {category === 'dine' && (
            <div>
              <label style={labelStyle}>
                What to order
                <span style={{ color: 'rgba(255,255,255,0.20)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>
                  optional
                </span>
              </label>
              <input
                type="text"
                value={whatToOrder}
                onChange={e => setWhatToOrder(e.target.value)}
                maxLength={300}
                placeholder="The dish, the drink, the thing everyone orders"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = selectedCat
                    ? `rgba(${selectedCat.vividRgb},0.45)`
                    : 'rgba(31,206,148,0.45)'
                }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>
          )}

          {/* Visit — closing dates */}
          {category === 'visit' && (
            <div>
              <label style={labelStyle}>
                Dates
                <span style={{ color: 'rgba(255,255,255,0.20)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>
                  optional
                </span>
              </label>
              <input
                type="text"
                value={dates}
                onChange={e => setDates(e.target.value)}
                maxLength={100}
                placeholder="Until 15 Jun · Closes 12 June 2026"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = selectedCat
                    ? `rgba(${selectedCat.vividRgb},0.45)`
                    : 'rgba(31,206,148,0.45)'
                }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>
          )}

          {/* Note — with rotating micro-prompts */}
          <div>
            <label style={labelStyle}>
              Your note
              <span style={{ color: 'rgba(255,255,255,0.20)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>
                optional
              </span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={notePlaceholder}
              style={{
                ...inputStyle,
                resize:    'none',
                lineHeight:1.6,
                fontStyle: note.length === 0 ? 'italic' : 'normal',
              }}
              onFocus={e => {
                e.target.style.borderColor = selectedCat
                  ? `rgba(${selectedCat.vividRgb},0.45)`
                  : 'rgba(31,206,148,0.45)'
              }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* ── PLACE PHOTO PICKER (Build 3) — same component as detail */}
          {(category === 'dine' || category === 'visit' || category === 'do') && (() => {
            const refs = (rec.metadata as RecMetadata).place_photo_refs
            if (!Array.isArray(refs) || refs.length === 0) return null
            return (
              <div>
                <label style={{
                  fontFamily: 'var(--f-ui)', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '2px', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.40)', display: 'block', marginBottom: '8px',
                }}>
                  Card photo
                </label>
                <PlacePhotoPicker
                  refs={refs}
                  currentUrl={liveImageUrl}
                  accentRgb={selectedCat?.vividRgb ?? '31,206,148'}
                  onSelect={handleSelectPhoto}
                />
              </div>
            )
          })()}

          {error && (
            <div style={{
              fontFamily: 'var(--f-body)',
              fontSize:   '12px',
              color:      '#f43f5e',
              textAlign:  'center',
            }}>
              {error}
            </div>
          )}

          {/* Save — always neon */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width:                   '100%',
              height:                  '54px',
              borderRadius:            '14px',
              background:              saving ? 'rgba(31,206,148,0.55)' : '#1fce94',
              border:                  'none',
              fontFamily:              'var(--f-ui)',
              fontWeight:              700,
              fontSize:                '13px',
              letterSpacing:           '0.10em',
              textTransform:           'uppercase',
              color:                   '#080f0a',
              cursor:                  saving ? 'not-allowed' : 'pointer',
              boxShadow:               saving ? 'none' : '0 0 28px rgba(31,206,148,0.30)',
              transition:              'all 160ms ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

        </div>
      </div>
    </div>
  )
}
