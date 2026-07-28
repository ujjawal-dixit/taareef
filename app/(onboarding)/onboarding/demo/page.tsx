'use client'

// app/(onboarding)/onboarding/demo/page.tsx
// Screen 1+2: demo vault + save sheet + signin prompt. No auth required.

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { EXAMPLE_CARDS, type ExampleCard } from '@/constants/example-cards'
import { CategoryMotif } from '@/components/features/cards/category-motif'
import { ensureSession } from '@/lib/supabase/anon'

// Self-contained category config — does not depend on constants/categories.ts export shape
const CAT_CONFIG: Record<string, { label: string; vividHex: string; vividRgb: string; verb: string }> = {
  watch:  { label: 'Watch',      vividHex: '#3C82FF', vividRgb: '60,130,255',  verb: 'to watch'      },
  listen: { label: 'Listen',     vividHex: '#DC3C82', vividRgb: '220,60,130',  verb: 'to listen'     },
  read:   { label: 'Read',       vividHex: '#F09114', vividRgb: '240,145,20',  verb: 'to read'       },
  dine:   { label: 'Dine',       vividHex: '#DA5526', vividRgb: '218,85,38',   verb: 'to dine'       },
  do:     { label: 'Do',         vividHex: '#10C3B6', vividRgb: '16,195,182',  verb: 'to do'         },
  visit:  { label: 'Visit',      vividHex: '#1991E1', vividRgb: '25,145,225',  verb: 'to visit'      },
}

const CAT_LIST = Object.entries(CAT_CONFIG).map(([id, cfg]) => ({ id, ...cfg }))

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 11,
  letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(244,243,238,0.40)', marginBottom: 10,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 10,
  border: '0.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
  fontFamily: 'var(--f-body)', fontSize: 15, color: '#F4F3EE', outline: 'none', boxSizing: 'border-box',
}

export default function DemoVaultPage() {
  const [saveSheetOpen, setSaveSheetOpen] = useState(false)

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Banner */}
      <div style={{ background: 'rgba(31,206,148,0.08)', borderBottom: '0.5px solid rgba(31,206,148,0.18)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'rgba(244,243,238,0.55)' }}>
          This is what your Taareef looks like →
        </span>
        <Link href="/login" style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1fce94', textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>

      {/* Header */}
      <div style={{ padding: '24px 20px 12px' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 28, color: '#F4F3EE', margin: 0, lineHeight: 1.1 }}>
          Your vault
        </h1>
        <p style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'rgba(244,243,238,0.35)', margin: '6px 0 0' }}>
          Every recommendation, one place.
        </p>
      </div>

      {/* Category pills — visual only */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {CAT_LIST.slice(0, 4).map((cat) => (
          <div key={cat.id} style={{ padding: '6px 14px', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.10)', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(244,243,238,0.30)', whiteSpace: 'nowrap', flexShrink: 0, userSelect: 'none' }}>
            {cat.label}
          </div>
        ))}
      </div>

      {/* Example cards */}
      <div style={{ flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 160 }}>
        {EXAMPLE_CARDS.map((card) => (
          <ExampleCardFull key={card.id} card={card} />
        ))}
      </div>

      {/* Invitation prompt */}
      <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: 350, background: 'rgba(14,14,12,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '0.5px solid rgba(31,206,148,0.25)', borderRadius: 16, padding: '16px 20px', zIndex: 50 }}>
        <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 18, color: '#F4F3EE', margin: '0 0 4px', lineHeight: 1.2 }}>
          This is what your Taareef looks like.
        </p>
        <p style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'rgba(244,243,238,0.45)', margin: '0 0 14px' }}>
          Save your first one.
        </p>
        <button onClick={() => setSaveSheetOpen(true)} style={{ width: '100%', padding: '13px 0', background: '#1fce94', borderRadius: 10, border: 'none', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', cursor: 'pointer' }}>
          Save your first →
        </button>
      </div>

      {/* Fake bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: 'rgba(10,10,10,0.95)', borderTop: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 40 }}>
        <div style={{ opacity: 0.3 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#F4F3EE" strokeWidth="1.5" /><path d="M3 9h18" stroke="#F4F3EE" strokeWidth="1.5" /></svg>
        </div>
        <button onClick={() => setSaveSheetOpen(true)} style={{ width: 48, height: 48, borderRadius: '50%', background: '#1fce94', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 0 4px rgba(31,206,148,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
        <div style={{ opacity: 0.3 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#F4F3EE" strokeWidth="1.5" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#F4F3EE" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
      </div>

      {saveSheetOpen && <DemoSaveSheet onClose={() => setSaveSheetOpen(false)} />}
    </div>
  )
}

function ExampleCardFull({ card }: { card: ExampleCard }) {
  const cat = CAT_CONFIG[card.category]
  if (!cat) return null
  const subtype = (card.metadata.subtype as string | undefined) ?? ''
  const rgb = cat.vividRgb
  const hasImage = !!card.image_url
  const titleLen = card.title.length
  const titleSize = titleLen <= 22 ? 25 : titleLen <= 34 ? 22 : 19

  let metaLine = ''
  let castLine = ''
  if (card.category === 'watch') {
    const year = card.metadata.release_year as number | undefined
    const genres = card.metadata.genres as string[] | undefined
    const runtime = card.metadata.runtime_minutes as number | undefined
    metaLine = [year ? String(year) : null, genres?.[0] ?? null, runtime ? `${runtime}m` : null].filter(Boolean).join(' · ')
    const director = card.metadata.director as string | undefined
    if (director) castLine = director
  } else if (card.category === 'dine') {
    metaLine = (card.metadata.city as string | undefined) ?? ''
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 20, background: 'rgba(10,10,10,0.78)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 6, padding: '3px 8px', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,243,238,0.45)', pointerEvents: 'none' }}>
        example
      </div>
      <div style={{ height: 432, width: '100%', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.65)) drop-shadow(0 11px 20px rgba(0,0,0,0.55))' }}>
        <div style={{ height: '100%', borderRadius: 14, background: 'linear-gradient(to bottom, #2a2a28, #161614 4px, #161614 calc(100% - 6px), #050504)', paddingBottom: 5, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(0,0,0,0.4)' }}>
          <div style={{ height: '100%', borderRadius: 12, padding: 7, background: 'linear-gradient(158deg, #0e1421, #0a0a0a 72%)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Grain */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundSize: '150px', opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 1, borderRadius: 12 }} />
            {/* Well */}
            <div style={{ flex: '1 1 auto', minHeight: 0, borderRadius: 7, overflow: 'hidden', position: 'relative', boxShadow: `0 0 0 2px #0a0a0a, 0 0 0 3px rgba(${rgb},0.3)` }}>
              {hasImage ? (
                <>
                  <Image src={card.image_url!} alt={card.title} fill style={{ objectFit: 'cover', objectPosition: 'top center' }} sizes="(max-width: 430px) 100vw, 390px" priority />
                  <div style={{ position: 'absolute', inset: 0, background: `rgba(${rgb},0.14)`, mixBlendMode: 'overlay', zIndex: 4 }} />
                </>
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 42%, rgba(${rgb},0.20) 0%, rgba(10,10,10,0.96) 60%, #0a0a0a 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -52%)' }}>
                    <CategoryMotif category={card.category} rgb={rgb} subtype={subtype} size={150} />
                  </div>
                </div>
              )}
              {/* Marriage gradient */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%', background: 'linear-gradient(to top, #0e1421 0%, transparent 100%)', zIndex: 5, pointerEvents: 'none' }} />
              {/* Notch */}
              <div style={{ position: 'absolute', top: 0, right: 0, background: '#000', borderRadius: '0 7px 0 12px', height: 28, display: 'flex', alignItems: 'center', paddingLeft: 10, paddingRight: 10, zIndex: 10 }}>
                <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 13, color: '#1fce94', position: 'relative', top: '0.5px' }}>taareef</span>
                <span style={{ display: 'inline-block', width: 9, height: 1, background: 'rgba(255,255,255,0.45)', margin: '0 6px', position: 'relative', top: -1, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: cat.vividHex }}>from {card.source_name}</span>
              </div>
            </div>
            {/* Info zone */}
            <div style={{ flex: '0 0 auto', padding: '12px 12px 11px' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: titleSize, color: '#F4F3EE', lineHeight: 1.05, marginBottom: 6 }}>{card.title}</div>
              {metaLine && <div style={{ fontFamily: 'var(--f-body)', fontWeight: 400, fontSize: 11, color: '#BDBBB2', lineHeight: 1.55 }}>{metaLine}</div>}
              {castLine && <div style={{ fontFamily: 'var(--f-body)', fontWeight: 400, fontSize: 11, color: '#7C7A73', lineHeight: 1.5, marginTop: 1 }}>{castLine}</div>}
              {card.notes && <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 12.5, lineHeight: 1.35, color: 'rgba(244,243,238,0.82)', borderLeft: `2px solid rgba(${rgb},0.5)`, paddingLeft: 10, marginTop: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.notes}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 15, color: `rgba(${rgb},0.82)` }}>{cat.verb}</span>
                {subtype && <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7C7A73' }}>{subtype}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DemoSaveSheet({ onClose }: { onClose: () => void }) {
  const [title, setTitle]       = useState('')
  const [category, setCategory] = useState<string>('')
  const [source, setSource]     = useState('')
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const canSave = title.trim().length > 0 && category.length > 0 && !saving

  // Creates an anonymous session (if there isn't one) and writes a real
  // row. Enrichment runs server-side exactly as it does for a signed-in
  // user, so the card fills in with a poster or photo moments later.
  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const userId = await ensureSession()
      if (!userId) throw new Error('no-session')

      const res = await fetch('/api/recommendations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title.trim(),
          category,
          source_type: 'friend',
          source_name: source.trim() || 'Someone',
        }),
      })

      const json = await res.json() as { data?: unknown; error?: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'save-failed')

      setSaved(true)
    } catch (err) {
      console.error('[demo] save failed:', err)
      setError("Couldn't save that — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: '#111110', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid rgba(255,255,255,0.10)', padding: '20px 24px', paddingBottom: 'max(32px, env(safe-area-inset-bottom))', maxHeight: '88dvh', overflowY: 'auto' }}>
        {!saved ? (
          <>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 22, color: '#F4F3EE', margin: 0 }}>Save a recommendation</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(244,243,238,0.35)', cursor: 'pointer', padding: 4, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>What is it?</label>
              <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Restaurant name, film title, album..." style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>What kind?</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CAT_LIST.map((cat) => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: '8px 16px', borderRadius: 20, border: category === cat.id ? `1px solid ${cat.vividHex}` : '0.5px solid rgba(255,255,255,0.12)', background: category === cat.id ? `rgba(${cat.vividRgb},0.15)` : 'transparent', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: category === cat.id ? cat.vividHex : 'rgba(244,243,238,0.45)', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Who told you about it?</label>
              <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Arjun, that newsletter, a friend..." style={inputStyle} />
            </div>
            <button onClick={handleSave} disabled={!canSave} style={{ width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', background: canSave ? '#1fce94' : 'rgba(255,255,255,0.08)', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', color: canSave ? '#0a0a0a' : 'rgba(244,243,238,0.25)', cursor: canSave ? 'pointer' : 'default', transition: 'all 0.15s ease' }}>
              {saving ? 'Saving…' : 'Save it'}
            </button>
            {error && <p role="alert" style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: '#c8151e', textAlign: 'center', margin: '12px 0 0' }}>{error}</p>}
          </>
        ) : (
          <SigninPrompt title={title} />
        )}
      </div>
    </>
  )
}

function SigninPrompt({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 28px' }} />
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(31,206,148,0.10)', border: '0.5px solid rgba(31,206,148,0.20)', borderRadius: 8, padding: '8px 14px', marginBottom: 24 }}>
        <span style={{ fontSize: 14 }}>✓</span>
        <span style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'rgba(244,243,238,0.65)' }}>
          <strong style={{ color: '#1fce94', fontStyle: 'normal' }}>{title}</strong> is saved
        </span>
      </div>
      <h2 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 24, color: '#F4F3EE', margin: '0 0 10px', lineHeight: 1.15 }}>Your vault is starting.</h2>
      <p style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'rgba(244,243,238,0.45)', lineHeight: 1.55, margin: '0 0 28px' }}>
        Create an account to keep it — and everything<br />you&rsquo;ll save from now on.
      </p>
      <Link href="/login" style={{ display: 'block', width: '100%', padding: '15px 0', background: '#1fce94', borderRadius: 12, textAlign: 'center', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', textDecoration: 'none' }}>
        Continue with Google
      </Link>
    </div>
  )
}
