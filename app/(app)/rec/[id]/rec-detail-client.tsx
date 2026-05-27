'use client'

// app/(app)/rec/[id]/rec-detail-client.tsx
//
// Fixed card (sticky top) — the shareable artifact, always visible.
// Scrollable interaction layer beneath:
//   Zone A: status + meta line
//   Zone B: tell source (by source_type) + note
//   Zone C: reactions (text pills — Loved · Good · Okay · Skip)

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CATEGORY_MAP, getCardGradient, getCardVignette } from '@/constants/categories'
import { hasValidImage } from '@/lib/utils/fallback'
import type { CategoryConfig } from '@/constants/categories'
import type { Recommendation, Reaction, Category } from '@/lib/types'

type Props = {
  recommendation: Recommendation
  categoryConfig: CategoryConfig
}

const REACTIONS: { value: Reaction; label: string }[] = [
  { value: 'loved', label: 'Loved' },
  { value: 'good',  label: 'Good'  },
  { value: 'okay',  label: 'Okay'  },
  { value: 'skip',  label: 'Skip'  },
]

type TellConfig = { label: string; sub: string; action: 'share-message' | 'open-profile' | 'share-card' | 'none' }

function getTellConfig(sourceType: string, sourceName: string, reaction: Reaction | null): TellConfig | null {
  if (reaction !== 'loved' && reaction !== 'good') return null
  switch (sourceType) {
    case 'friend': case 'family': case 'colleague':
      return { label: `Tell ${sourceName}?`, sub: 'Let them know their rec landed.', action: 'share-message' }
    case 'instagram': case 'twitter': case 'youtube':
      return { label: `Found via ${sourceName}`, sub: 'Visit their page?', action: 'open-profile' }
    case 'article': case 'newsletter': case 'podcast':
      return { label: 'Enjoyed it?', sub: 'Share this with a friend.', action: 'share-card' }
    default: return null
  }
}

function buildMeta(category: Category, meta: Record<string, unknown>): string {
  const p: string[] = []
  switch (category) {
    case 'watch': {
      const d = typeof meta.director === 'string' ? meta.director : null
      const g = Array.isArray(meta.genres) ? (meta.genres as string[])[0] : typeof meta.genres === 'string' ? meta.genres : null
      const y = meta.release_year ?? meta.year
      const r = meta.runtime_minutes ? `${meta.runtime_minutes} min` : null
      const st = typeof meta.series_status === 'string' ? meta.series_status : null
      const sn = meta.seasons ? `${meta.seasons} seasons` : null
      if (d) p.push(d); if (g) p.push(String(g)); if (y) p.push(String(y)); if (r) p.push(r); if (st) p.push(st); if (sn) p.push(sn)
      break
    }
    case 'listen': {
      const a = typeof meta.artist === 'string' ? meta.artist : null
      const g = typeof meta.genre === 'string' ? meta.genre : null
      const y = meta.release_year ?? meta.year
      const t = meta.total_tracks ? `${meta.total_tracks} tracks` : null
      if (a) p.push(a); if (g) p.push(g); if (y) p.push(String(y)); if (t) p.push(t)
      break
    }
    case 'read': {
      const a = typeof meta.author === 'string' ? meta.author : null
      const y = meta.year ?? meta.published_year
      const g = typeof meta.genre === 'string' ? meta.genre : null
      if (a) p.push(a); if (y) p.push(String(y)); if (g) p.push(g)
      break
    }
    case 'dine': {
      const c = typeof meta.cuisine === 'string' ? meta.cuisine : null
      const t = typeof meta.type === 'string' ? meta.type : null
      const ci = typeof meta.city === 'string' ? meta.city : null
      if (c) p.push(c); if (t) p.push(t); if (ci) p.push(ci)
      break
    }
    case 'do': {
      const l = typeof meta.city === 'string' ? meta.city : null
      const d = typeof meta.difficulty === 'string' ? meta.difficulty : null
      const du = typeof meta.duration === 'string' ? meta.duration : null
      if (l) p.push(l); if (d) p.push(d); if (du) p.push(du)
      break
    }
    case 'visit': {
      const v = typeof meta.venue === 'string' ? meta.venue : null
      const c = typeof meta.city === 'string' ? meta.city : null
      const d = typeof meta.dates === 'string' ? meta.dates : null
      if (v) p.push(v); if (c) p.push(c); if (d) p.push(d)
      break
    }
  }
  return p.slice(0, 4).join(' · ')
}

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")"

function DotGrid({ rgb }: { rgb: string }) {
  return <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', backgroundImage: `radial-gradient(circle,rgba(${rgb},1) 1.4px,transparent 1.4px)`, backgroundSize: '13px 13px', opacity: 0.10 }} />
}

function Rangoli({ rgb }: { rgb: string }) {
  const c = `rgba(${rgb},1)`
  return (
    <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-54%)', zIndex: 5, pointerEvents: 'none', width: '152px', height: '152px' }} viewBox="0 0 152 152" fill="none">
      <circle cx="76" cy="76" r="72" stroke={c} strokeWidth="2" opacity="0.22"/>
      <circle cx="76" cy="76" r="58" stroke={c} strokeWidth="2" opacity="0.26"/>
      <circle cx="76" cy="76" r="44" stroke={c} strokeWidth="2.2" opacity="0.30"/>
      <circle cx="76" cy="76" r="30" stroke={c} strokeWidth="2.2" opacity="0.32"/>
      <circle cx="76" cy="76" r="17" stroke={c} strokeWidth="2" opacity="0.38"/>
      <circle cx="76" cy="76" r="6" fill={c} opacity="0.45"/>
      <line x1="76" y1="4" x2="76" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="76" y1="122" x2="76" y2="148" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="4" y1="76" x2="30" y2="76" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="122" y1="76" x2="148" y2="76" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="25" y1="25" x2="44" y2="44" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="108" y1="108" x2="127" y2="127" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="127" y1="25" x2="108" y2="44" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="25" y1="127" x2="44" y2="108" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <circle cx="76" cy="32" r="3.5" fill={c} opacity="0.35"/>
      <circle cx="76" cy="120" r="3.5" fill={c} opacity="0.35"/>
      <circle cx="32" cy="76" r="3.5" fill={c} opacity="0.35"/>
      <circle cx="120" cy="76" r="3.5" fill={c} opacity="0.35"/>
    </svg>
  )
}

export function RecDetailClient({ recommendation: rec, categoryConfig: cfg }: Props) {
  const [reaction, setReaction]     = useState<Reaction | null>(rec.reaction)
  const [note, setNote]             = useState(rec.notes ?? '')
  const [saving, setSaving]         = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const hasImage = hasValidImage(rec.image_url)
  const isExp    = rec.status !== 'saved'
  const meta     = rec.metadata as Record<string, unknown>
  const metaLine = buildMeta(rec.category as Category, meta)
  const tell     = getTellConfig(rec.source_type, rec.source_name, reaction)

  async function patch(body: Record<string, unknown>) {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/recommendations/${rec.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.error) setError(json.error)
      return json
    } catch { setError('Could not save — try again?') }
    finally { setSaving(false) }
  }

  async function handleReaction(v: Reaction) { setReaction(v); await patch({ reaction: v, status: 'experienced' }) }
  async function handleRemove() {
    const r = await patch({ reaction: null, status: 'saved' })
    if (!r?.error) { setReaction(null); setShowRemove(false) }
  }

  function handleTell() {
    if (!tell) return
    if (tell.action === 'share-message' || tell.action === 'share-card') {
      const text = reaction === 'loved'
        ? `Finally ${cfg.verbPast} ${rec.title} — you were so right. Thank you ♥`
        : `${cfg.verbPast.charAt(0).toUpperCase() + cfg.verbPast.slice(1)} ${rec.title} — it was great! Thanks for the rec.`
      if (navigator.share) navigator.share({ text }).catch(() => {})
    } else if (tell.action === 'open-profile') {
      const handle = rec.source_name.replace(/^@/, '')
      const urls: Record<string, string> = { instagram: `https://instagram.com/${handle}`, twitter: `https://twitter.com/${handle}`, youtube: `https://youtube.com/@${handle}` }
      const url = urls[rec.source_type]
      if (url) window.open(url, '_blank', 'noopener')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111111' }}>

      {/* FIXED CARD — sticky, always visible */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#111111' }}>
        {/* Top bar */}
        <div style={{ padding: '52px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/dashboard/${rec.category}`} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: 'var(--f-ui)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
            color: '#1fce94', textDecoration: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            {cfg.label}
          </Link>
          {isExp && (
            <button onClick={() => setShowRemove(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.24)', fontSize: '20px', cursor: 'pointer', letterSpacing: '3px', padding: '0 4px' }}>···</button>
          )}
        </div>

        {/* Card */}
        <div style={{ margin: '12px 16px 0', borderRadius: '11px', overflow: 'hidden', position: 'relative', background: cfg.deepDark, boxShadow: '0 0 0 1px rgba(255,255,255,0.06),0 20px 50px rgba(0,0,0,0.70)' }}>
          {/* Grain */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '11px', zIndex: 30, pointerEvents: 'none', backgroundImage: GRAIN, backgroundSize: '200px 200px', opacity: 0.052, mixBlendMode: 'overlay' }} />

          {/* Image zone */}
          <div style={{ width: '100%', height: '172px', position: 'relative', overflow: 'hidden' }}>
            {hasImage ? (
              <Image src={rec.image_url!} alt={rec.title} fill style={{ objectFit: 'cover' }} sizes="(max-width:480px) 100vw,480px" priority/>
            ) : (
              <>
                <div style={{ position: 'absolute', inset: 0, background: getCardGradient(rec.category as Category) }} />
                <DotGrid rgb={cfg.vividRgb} />
                <Rangoli rgb={cfg.vividRgb} />
              </>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', zIndex: 10, pointerEvents: 'none', background: getCardVignette(rec.category as Category) }} />
            <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 15, fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', padding: '4px 11px', borderRadius: '20px', backdropFilter: 'blur(10px)', background: `rgba(${cfg.vividRgb},0.16)`, border: `1px solid rgba(${cfg.vividRgb},0.45)`, color: 'rgba(255,255,255,0.94)' }}>
              {cfg.label.toUpperCase()}
            </div>
            {isExp && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 15, fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 11px', borderRadius: '20px', border: '1px solid rgba(31,206,148,0.45)', color: '#1fce94' }}>
                {cfg.verbPast.toUpperCase()}
              </div>
            )}
          </div>

          {/* Info zone */}
          <div style={{ padding: '16px 17px 17px', background: cfg.deepDark }}>
            <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400, fontSize: '26px', color: 'rgba(255,255,255,0.97)', lineHeight: 1.10, marginBottom: '5px', letterSpacing: '-0.2px' }}>
              {rec.title}
            </div>
            {metaLine && (
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 400, color: `rgba(${cfg.vividRgb},0.65)`, marginBottom: note ? '13px' : '15px' }}>
                {metaLine}
              </div>
            )}
            {note && (
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '13.5px', color: 'rgba(255,255,255,0.90)', lineHeight: 1.55, marginBottom: '15px', paddingLeft: '11px', borderLeft: '1.5px solid rgba(255,255,255,0.18)' }}>
                &ldquo;{note.length > 120 ? note.slice(0, 120) + '…' : note}&rdquo;
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '17px', color: '#1fce94', textShadow: '0 0 16px rgba(31,206,148,0.50)', letterSpacing: '-0.2px' }}>taareef</div>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.60)' }}>from {rec.source_name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE INTERACTION LAYER */}
      <div style={{ padding: '20px 20px 100px' }}>

        {/* Zone A — status + meta */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>
            {isExp ? `Marked as ${rec.status.toLowerCase()}` : 'Not yet experienced'}
            {metaLine ? ` · ${metaLine}` : ''}
          </div>
        </div>

        <div style={{ height: '0.5px', background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.10),transparent)', marginBottom: '20px' }} />

        {/* Zone B — tell source + note */}
        {isExp && tell && tell.action !== 'none' && (
          <div style={{ background: 'rgba(31,206,148,0.05)', border: '1px solid rgba(31,206,148,0.14)', borderRadius: '13px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '15px', color: 'rgba(255,255,255,0.88)', marginBottom: '3px' }}>{tell.label}</div>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.40)' }}>{tell.sub}</div>
            </div>
            <button onClick={handleTell} style={{ background: '#1fce94', color: '#111111', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: '11px', letterSpacing: '1px', padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', flexShrink: 0 }}>SEND</button>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', marginBottom: '8px' }}>Your note</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => patch({ notes: note })}
            placeholder="One thing you'll remember…"
            maxLength={500} rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '11px', padding: '12px 14px', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.75)', resize: 'none', outline: 'none', caretColor: '#1fce94' }}
            onFocus={(e) => { e.target.style.borderColor = `rgba(${cfg.vividRgb},0.40)` }}
            onBlurCapture={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.06)' }}
          />
        </div>

        <div style={{ height: '0.5px', background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.10),transparent)', marginBottom: '20px' }} />

        {/* Zone C — reactions */}
        <div>
          <div style={{ fontFamily: 'var(--f-ui)', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', marginBottom: '12px' }}>How was it?</div>
          {!isExp && (
            <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '14px', color: 'rgba(255,255,255,0.30)', marginBottom: '12px' }}>
              Mark as experienced above to react.
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {REACTIONS.map(r => {
              const on = reaction === r.value
              return (
                <button key={r.value} onClick={() => isExp && handleReaction(r.value)} disabled={saving || !isExp}
                  style={{ fontFamily: 'var(--f-ui)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '10px 20px', borderRadius: '8px', cursor: isExp ? 'pointer' : 'not-allowed', transition: 'all 150ms ease', background: on ? `rgba(${cfg.vividRgb},0.18)` : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? `rgba(${cfg.vividRgb},0.55)` : 'rgba(255,255,255,0.08)'}`, color: on ? cfg.vividColor : 'rgba(255,255,255,0.42)' }}>
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        {error && <div style={{ marginTop: '16px', fontFamily: 'var(--f-body)', fontSize: '12px', color: '#f43f5e', textAlign: 'center' }}>{error}</div>}

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-body)', fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.20)' }}>
          <span>Saved {new Date(rec.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span style={{ textTransform: 'capitalize' }}>{rec.source_type}</span>
        </div>
      </div>

      {/* Remove sheet */}
      {showRemove && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={() => setShowRemove(false)}>
          <div style={{ width: '100%', background: '#161616', borderRadius: '22px 22px 0 0', padding: '28px 24px 40px', border: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '22px', color: 'rgba(255,255,255,0.92)', marginBottom: '8px' }}>Remove experience log?</div>
            <div style={{ fontFamily: 'var(--f-body)', fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.45)', marginBottom: '28px', lineHeight: 1.6 }}>This moves {rec.title} back to saved and clears your reaction.</div>
            <button onClick={handleRemove} disabled={saving} style={{ width: '100%', background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.30)', color: '#f43f5e', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', padding: '14px', borderRadius: '13px', cursor: 'pointer', marginBottom: '10px' }}>YES, REMOVE</button>
            <button onClick={() => setShowRemove(false)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--f-ui)', fontSize: '11px', letterSpacing: '1px', padding: '10px', cursor: 'pointer' }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  )
}
