'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCategoryBloom, CATEGORY_MAP } from '@/constants/categories'
import { hasValidImage } from '@/lib/utils/fallback'
import type { Recommendation, Reaction, Category } from '@/lib/types'

type RecDetailClientProps = {
  recommendation: Recommendation
}

const REACTIONS = [
  { value: 'loved' as Reaction, symbol: '♥', label: 'Loved it', color: '#f43f5e', bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.35)' },
  { value: 'good'  as Reaction, symbol: '✓', label: 'Good',     color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)' },
  { value: 'okay'  as Reaction, symbol: '–', label: 'Okay',     color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.35)' },
  { value: 'skip'  as Reaction, symbol: '✕', label: 'Skip it',  color: 'rgba(242,230,205,0.35)', bg: 'rgba(242,230,205,0.04)', border: 'rgba(242,230,205,0.10)' },
]

export function RecDetailClient({ recommendation }: RecDetailClientProps) {
  const [reaction, setReaction]           = useState<Reaction | null>(recommendation.reaction)
  const [note, setNote]                   = useState(recommendation.notes ?? '')
  const [saving, setSaving]               = useState(false)
  const [showRemove, setShowRemove]       = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const config      = CATEGORY_MAP[recommendation.category as Category]
  const hasImage    = hasValidImage(recommendation.image_url)
  const isExperienced = recommendation.status !== 'saved'
  const meta        = recommendation.metadata as Record<string, unknown>

  const genre   = Array.isArray(meta?.genres) ? (meta.genres as string[])[0] : typeof meta?.genres === 'string' ? meta.genres : null
  const year    = meta?.release_year ?? meta?.year ?? null
  const runtime = meta?.runtime_minutes ? `${meta.runtime_minutes} min` : null
  const rating  = meta?.rating ? `★ ${meta.rating}` : null
  const overview = typeof meta?.overview === 'string' ? meta.overview : null

  const detailParts = [genre, year, runtime, rating].filter(Boolean).map(String).slice(0, 4)

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch(`/api/recommendations/${recommendation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.error) setError(json.error)
      return json
    } catch {
      setError('Could not save — try again?')
    } finally {
      setSaving(false)
    }
  }

  async function handleReaction(value: Reaction) {
    setReaction(value)
    await patch({ reaction: value, status: 'experienced' })
  }

  async function handleSaveNote() {
    await patch({ notes: note })
  }

  async function handleRemoveExperience() {
    const res = await patch({ reaction: null, status: 'saved' })
    if (!res?.error) { setReaction(null); setShowRemove(false) }
  }

  function handleTellSource() {
    const text = reaction === 'loved'
      ? `Finally ${config.verbPast} ${recommendation.title} — you were so right. Thank you ♥`
      : `${config.verbPast.charAt(0).toUpperCase() + config.verbPast.slice(1)} ${recommendation.title} — it was great! Thanks for the rec.`
    if (navigator.share) navigator.share({ text }).catch(() => {})
  }

  if (!config) return null

  return (
    <div style={{ minHeight: '100vh', background: '#080f0a' }}>

      {/* Top bar */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href={`/dashboard/${recommendation.category}`}
          style={{ fontFamily: 'var(--f-ui)', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1fce94', textDecoration: 'none' }}
        >
          ← vault
        </Link>
        {isExperienced && (
          <button
            onClick={() => setShowRemove(true)}
            style={{ background: 'none', border: 'none', color: 'rgba(242,230,205,0.25)', fontSize: '20px', cursor: 'pointer', padding: '0 4px', letterSpacing: '2px' }}
          >
            ···
          </button>
        )}
      </div>

      {/* Hero */}
      <div
        style={{
          margin: '14px 16px 0',
          borderRadius: '22px',
          height: '210px',
          overflow: 'hidden',
          position: 'relative',
          background: getCategoryBloom(recommendation.category as Category),
          boxShadow: `inset 5px 0 0 ${config.vividColor}`,
        }}
      >
        {hasImage && (
          <Image src={recommendation.image_url!} alt={recommendation.title} fill style={{ objectFit: 'cover' }} sizes="(max-width:480px) 100vw, 480px"/>
        )}
        <div style={{ position: 'absolute', top: '12px', left: '12px', background: `${config.vividColor}28`, border: `1px solid ${config.vividColor}44`, color: config.vividColor, fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', padding: '4px 12px', borderRadius: '20px' }}>
          {config.label.toUpperCase()}
        </div>
        {isExperienced && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', border: '1px solid rgba(31,206,148,0.4)', color: '#1fce94', fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', padding: '4px 12px', borderRadius: '20px' }}>
            {config.verbPast.toUpperCase()}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px 100px' }}>
        <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '22px', fontWeight: 700, color: 'rgba(242,230,205,0.97)', marginBottom: '5px', lineHeight: 1.2 }}>
          {recommendation.title}
        </h1>
        <div style={{ fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 500, color: '#d41020', marginBottom: '8px' }}>
          From {recommendation.source_name}
        </div>
        {detailParts.length > 0 && (
          <div style={{ fontFamily: 'var(--f-body)', fontSize: '12px', fontWeight: 300, color: 'rgba(242,230,205,0.42)', marginBottom: '14px' }}>
            {detailParts.join(' · ')}
          </div>
        )}
        {overview && (
          <p style={{ fontFamily: 'var(--f-body)', fontSize: '13px', fontWeight: 300, color: 'rgba(242,230,205,0.45)', lineHeight: 1.7, marginBottom: '18px' }}>
            {overview.length > 180 ? overview.slice(0, 180) + '…' : overview}
          </p>
        )}

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)', margin: '0 0 18px' }}/>

        {/* Reactions */}
        <div style={{ fontFamily: 'var(--f-ui)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(242,230,205,0.35)', marginBottom: '10px' }}>
          How was it?
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          {REACTIONS.map((r) => {
            const on = reaction === r.value
            return (
              <button
                key={r.value}
                onClick={() => handleReaction(r.value)}
                disabled={saving}
                style={{ flex: 1, background: on ? r.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? r.border : 'rgba(255,255,255,0.06)'}`, borderRadius: '13px', padding: '11px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '18px', color: on ? r.color : 'rgba(242,230,205,0.35)', fontWeight: 700, lineHeight: 1 }}>{r.symbol}</span>
                <span style={{ fontFamily: 'var(--f-ui)', fontSize: '8px', letterSpacing: '1px', textTransform: 'uppercase', color: on ? r.color : 'rgba(242,230,205,0.22)' }}>{r.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tell source */}
        {(reaction === 'loved' || reaction === 'good') && isExperienced && (
          <div style={{ background: 'rgba(31,206,148,0.05)', border: '1px solid rgba(31,206,148,0.14)', borderRadius: '13px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '15px', color: 'rgba(242,230,205,0.88)', marginBottom: '3px' }}>
                Tell {recommendation.source_name}?
              </div>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300, color: 'rgba(242,230,205,0.40)' }}>
                Let them know their rec landed.
              </div>
            </div>
            <button onClick={handleTellSource} style={{ background: '#1fce94', color: '#080f0a', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: '11px', letterSpacing: '1px', padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              SEND
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)', margin: '0 0 18px' }}/>

        {/* Note */}
        <div style={{ fontFamily: 'var(--f-ui)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(242,230,205,0.35)', marginBottom: '8px' }}>
          Your note
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleSaveNote}
          placeholder="One thing you will remember…"
          maxLength={500}
          rows={3}
          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '11px', padding: '12px 14px', fontFamily: 'var(--f-body)', fontStyle: 'italic', fontSize: '14px', fontWeight: 300, color: 'rgba(242,230,205,0.72)', resize: 'none', outline: 'none', marginBottom: '16px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300, color: 'rgba(242,230,205,0.22)' }}>
          <span>Saved {new Date(recommendation.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span style={{ textTransform: 'capitalize' }}>{recommendation.source_type}</span>
        </div>

        {error && <div style={{ marginTop: '12px', fontFamily: 'var(--f-body)', fontSize: '12px', color: '#f43f5e', textAlign: 'center' }}>{error}</div>}
      </div>

      {/* Remove experience sheet */}
      {showRemove && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,15,10,0.88)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={() => setShowRemove(false)}>
          <div style={{ width: '100%', background: '#0d1810', borderRadius: '22px 22px 0 0', padding: '28px 24px 40px', border: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '22px', color: 'rgba(242,230,205,0.92)', marginBottom: '8px' }}>
              Remove experience log?
            </div>
            <div style={{ fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 300, color: 'rgba(242,230,205,0.45)', marginBottom: '28px', lineHeight: 1.6 }}>
              This will move {recommendation.title} back to saved and clear your reaction.
            </div>
            <button onClick={handleRemoveExperience} disabled={saving} style={{ width: '100%', background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', padding: '14px', borderRadius: '13px', cursor: 'pointer', marginBottom: '10px' }}>
              YES, REMOVE
            </button>
            <button onClick={() => setShowRemove(false)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(242,230,205,0.35)', fontFamily: 'var(--f-ui)', fontSize: '11px', letterSpacing: '1px', padding: '10px', cursor: 'pointer' }}>
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
