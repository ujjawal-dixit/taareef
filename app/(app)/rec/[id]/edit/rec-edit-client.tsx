'use client'

// app/(app)/rec/[id]/edit/rec-edit-client.tsx
// Pre-filled edit form for a saved recommendation.
// Allows correcting title, category, source type, source name, and note.
// Accessed via the ··· menu on the detail screen.
// On save: PATCHes the recommendation and navigates back to the detail screen.

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CATEGORIES } from '@/constants/categories'
import type { Recommendation, Category, SourceType } from '@/lib/types'

type Props = {
  recommendation: Recommendation
}

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'friend',     label: 'Friend'      },
  { value: 'family',     label: 'Family'      },
  { value: 'colleague',  label: 'Colleague'   },
  { value: 'instagram',  label: 'Instagram'   },
  { value: 'twitter',    label: 'Twitter'     },
  { value: 'youtube',    label: 'YouTube'     },
  { value: 'article',    label: 'Article'     },
  { value: 'newsletter', label: 'Newsletter'  },
  { value: 'podcast',    label: 'Podcast'     },
  { value: 'self',       label: 'Myself'      },
]

// Shared field label style
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--f-ui)',
  fontSize: '9px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.32)',
  marginBottom: '8px',
  display: 'block',
}

// Shared input style
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '11px',
  padding: '13px 15px',
  fontFamily: 'var(--f-body)',
  fontSize: '15px',
  fontWeight: 400,
  color: 'rgba(255,255,255,0.90)',
  outline: 'none',
  caretColor: '#1fce94',
  transition: 'border-color 160ms ease',
}

// Full-width neon pill — same as profile and category list back nav
const backNavStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  height: '50px',
  borderRadius: '14px',
  border: '1px solid rgba(31,206,148,0.38)',
  background: 'rgba(31,206,148,0.06)',
  fontFamily: 'var(--f-ui)',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#1fce94',
  textDecoration: 'none',
  textShadow: '0 0 12px rgba(31,206,148,0.45)',
  WebkitTapHighlightColor: 'transparent',
}

export function RecEditClient({ recommendation: rec }: Props) {
  const router = useRouter()

  const [title,      setTitle]      = useState(rec.title)
  const [category,   setCategory]   = useState<Category>(rec.category)
  const [sourceType, setSourceType] = useState<SourceType>(rec.source_type)
  const [sourceName, setSourceName] = useState(rec.source_name)
  const [note,       setNote]       = useState(rec.notes ?? '')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const selectedCat = CATEGORIES.find(c => c.id === category)

  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('Title cannot be empty.'); return }
    if (!sourceName.trim()) { setError('Source name cannot be empty.'); return }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/recommendations/${rec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title.trim(),
          category,
          source_type: sourceType,
          source_name: sourceName.trim(),
          notes:       note.trim() || null,
        }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      // Navigate back to detail screen
      router.push(`/rec/${rec.id}`)
      router.refresh()
    } catch {
      setError('Could not save — please try again.')
    } finally {
      setSaving(false)
    }
  }, [title, category, sourceType, sourceName, note, rec.id, router])

  return (
    <div style={{ minHeight: '100vh', background: '#111111' }}>
      <div style={{ maxWidth: '430px', margin: '0 auto', padding: '0 0 100px' }}>

        {/* Back nav — full-width neon pill */}
        <div style={{ padding: '48px 16px 0' }}>
          <Link href={`/rec/${rec.id}`} style={backNavStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </Link>
        </div>

        {/* Header */}
        <div style={{ padding: '24px 20px 0' }}>
          <h1 style={{
            fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400,
            fontSize: '30px', color: 'rgba(255,255,255,0.95)', margin: 0, lineHeight: 1.15,
          }}>
            Edit details
          </h1>
          <p style={{
            fontFamily: 'var(--f-body)', fontSize: '13px', fontWeight: 300,
            color: 'rgba(255,255,255,0.35)', marginTop: '6px',
          }}>
            Fix anything before it travels.
          </p>
        </div>

        {/* Rule */}
        <div style={{
          height: '0.5px', margin: '16px 20px 0',
          background: `linear-gradient(to right, rgba(${selectedCat?.vividRgb ?? '255,255,255'},0.40), transparent)`,
        }} />

        {/* ── FIELDS ── */}
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
              onFocus={e => { e.target.style.borderColor = `rgba(${selectedCat?.vividRgb ?? '255,255,255'},0.42)` }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Category — 3-col grid */}
          <div>
            <label style={labelStyle}>What kind?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {CATEGORIES.map(cat => {
                const sel = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as Category)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '10px',
                      border: `1px solid ${sel ? cat.vividColor : 'rgba(255,255,255,0.09)'}`,
                      background: sel ? `rgba(${cat.vividRgb},0.14)` : 'rgba(255,255,255,0.03)',
                      fontFamily: 'var(--f-ui)',
                      fontSize: '10px', fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: sel ? cat.vividColor : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer',
                      transition: 'all 140ms ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Source type */}
          <div>
            <label style={labelStyle}>How did you find it?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {SOURCE_TYPES.map(st => {
                const sel = sourceType === st.value
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setSourceType(st.value)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '10px',
                      border: `1px solid ${sel ? (selectedCat?.vividColor ?? '#1fce94') : 'rgba(255,255,255,0.09)'}`,
                      background: sel ? `rgba(${selectedCat?.vividRgb ?? '31,206,148'},0.12)` : 'rgba(255,255,255,0.03)',
                      fontFamily: 'var(--f-ui)',
                      fontSize: '10px', fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: sel ? (selectedCat?.vividColor ?? '#1fce94') : 'rgba(255,255,255,0.40)',
                      cursor: 'pointer',
                      transition: 'all 140ms ease',
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
              {sourceType === 'self' ? 'Your name' : 'Their name or handle'}
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={e => setSourceName(e.target.value)}
              maxLength={200}
              placeholder={
                ['instagram', 'twitter', 'youtube'].includes(sourceType)
                  ? '@handle'
                  : 'Name'
              }
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = `rgba(${selectedCat?.vividRgb ?? '255,255,255'},0.42)` }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Note */}
          <div>
            <label style={labelStyle}>Your note <span style={{ color: 'rgba(255,255,255,0.20)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span></label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="One thing you'll remember…"
              style={{
                ...inputStyle,
                fontFamily: 'var(--f-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                resize: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = `rgba(${selectedCat?.vividRgb ?? '255,255,255'},0.42)` }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontFamily: 'var(--f-body)', fontSize: '12px',
              color: '#f43f5e', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', height: '54px', borderRadius: '14px',
              background: saving ? 'rgba(31,206,148,0.40)' : '#1fce94',
              border: 'none',
              fontFamily: 'var(--f-ui)', fontWeight: 700,
              fontSize: '13px', letterSpacing: '0.10em', textTransform: 'uppercase',
              color: '#111111',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 0 28px rgba(31,206,148,0.28)',
              transition: 'all 160ms ease',
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

        </div>
      </div>
    </div>
  )
}
