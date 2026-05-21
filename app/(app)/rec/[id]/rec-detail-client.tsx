'use client'

// app/(app)/rec/[id]/rec-detail-client.tsx
// Full card detail with:
// - TMDB candidate confirmation strip
// - Genre hue fallback when no poster found
// - Full metadata per category (genre, year, runtime, overview for films etc.)
// - Lowercase section labels — quieter, more intimate
// - "← vault" top-left, neon, small

import { useState, useRef }              from 'react'
import { useRouter }                     from 'next/navigation'
import { useUpdateRecommendation }       from '@/hooks/use-recommendations'
import { useToast }                      from '@/components/ui/toast'
import type { Recommendation, Reaction } from '@/lib/types'
import type { CategoryConfig }           from '@/constants/categories'

type TmdbCandidate = {
  tmdb_id:      number
  title:        string
  poster_url:   string | null
  release_year: number | null
  overview:     string | null
  vote_average: number | null
  genre:        string | null
  genre_hue:    string | null
  runtime:      number | null
}

type Props = { recommendation: Recommendation; categoryConfig: CategoryConfig }

const REACTIONS: { value: Reaction; emoji: string; label: string }[] = [
  { value: 'loved', emoji: '😍', label: 'Loved it' },
  { value: 'good',  emoji: '👍', label: 'Good'      },
  { value: 'okay',  emoji: '😐', label: 'Okay'      },
  { value: 'skip',  emoji: '👎', label: 'Skip it'   },
]

export function RecDetailClient({ recommendation: init, categoryConfig: cfg }: Props) {
  const router    = useRouter()
  const { toast } = useToast()
  const { update, isLoading } = useUpdateRecommendation()
  const [rec,          setRec]          = useState(init)
  const [notesDirty,   setNotesDirty]   = useState(false)
  const [confirming,   setConfirming]   = useState(false)
  const [enriching,    setEnriching]    = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  const meta         = (rec.metadata ?? {}) as Record<string, unknown>
  const isExperienced = rec.status !== 'saved'
  const candidates   = meta.tmdb_candidates as TmdbCandidate[] | null | undefined
  const hasCandidates = Array.isArray(candidates) && candidates.length > 0
  const col          = cfg.colourHex

  // Genre hue — used when no image and genre data exists
  const genreHue     = typeof meta.genre_hue === 'string' ? meta.genre_hue : null
  const bgAtmosphere = genreHue
    ? `radial-gradient(ellipse at 20% 80%, ${genreHue} 0%, transparent 60%), linear-gradient(148deg, ${col}18 0%, ${col}05 100%)`
    : `linear-gradient(148deg, ${col}18 0%, ${col}05 100%)`

  async function markExperienced() {
    const r = await update(rec.id, { status: 'experienced' })
    if (r) { setRec(r); toast(`Marked as ${cfg.verb} ✦`, 'success') }
  }

  async function setReaction(reaction: Reaction) {
    const r = await update(rec.id, { reaction })
    if (r) {
      setRec(r)
      if (reaction === 'loved' || reaction === 'good') toast(`Tell ${rec.source_name}?`, 'info')
    }
  }

  async function saveNotes() {
    if (!notesDirty) return
    const val = notesRef.current?.value.trim() ?? ''
    const r   = await update(rec.id, { notes: val })
    if (r) { setRec(r); setNotesDirty(false) }
  }

  async function triggerEnrich() {
    setEnriching(true)
    try {
      const res  = await fetch(`/api/enrich/${rec.id}`, { method: 'POST' })
      const data = await res.json()
      if (data?.data?.candidates?.length) {
        // Update local metadata to show candidate strip
        setRec(prev => ({
          ...prev,
          metadata: { ...((prev.metadata as Record<string,unknown>) ?? {}), tmdb_candidates: data.data.candidates }
        }))
        toast('Choose the right poster', 'info')
      } else {
        toast('No poster found for this title', 'info')
      }
    } catch { toast('Could not load poster', 'error') }
    finally { setEnriching(false) }
  }

  async function confirmCandidate(candidate: TmdbCandidate) {
    setConfirming(true)
    try {
      const res = await fetch(`/api/enrich/${rec.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(candidate),
      })
      const data = await res.json()
      if (data?.data?.confirmed) {
        setRec(prev => ({
          ...prev,
          image_url: candidate.poster_url,
          metadata: {
            ...((prev.metadata as Record<string,unknown>) ?? {}),
            tmdb_candidates: null,
            genre:        candidate.genre,
            genre_hue:    candidate.genre_hue,
            overview:     candidate.overview,
            release_year: candidate.release_year,
            runtime:      candidate.runtime,
            vote_average: candidate.vote_average,
          }
        }))
        toast('Poster saved ✦', 'success')
      }
    } catch { toast('Could not confirm poster', 'error') }
    finally { setConfirming(false) }
  }

  async function rejectAllCandidates() {
    // Clear candidates, apply genre hue from first candidate if available
    const firstCandidate = Array.isArray(candidates) ? candidates[0] : null
    const existingMeta   = (rec.metadata as Record<string,unknown>) ?? {}
    const newMeta = {
      ...existingMeta,
      tmdb_candidates: null,
      genre_hue:       firstCandidate?.genre_hue ?? null,
      genre:           firstCandidate?.genre     ?? null,
    }
    setRec(prev => ({ ...prev, metadata: newMeta }))
    await update(rec.id, { metadata: newMeta })
    toast('Using colour fallback', 'info')
  }

  function shareWithSource() {
    const msg = rec.reaction === 'loved'
      ? `Finally ${cfg.verb} ${rec.title} — you were so right. Thank you ❤️`
      : `${cfg.verb.charAt(0).toUpperCase() + cfg.verb.slice(1)} ${rec.title} — it was great! Thanks for the rec`
    if (navigator.share) navigator.share({ text: msg }).catch(() => {})
    else navigator.clipboard?.writeText(msg).then(() => toast('Message copied!', 'success'))
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily:    'var(--f-body)',
    fontSize:      '10px', fontWeight: 600,
    letterSpacing: '0.10em', textTransform: 'uppercase',
    color:         'rgba(240,230,200,0.30)',
    display:       'block', marginBottom: '10px',
  }

  // Rich metadata lines per category
  const metaLines = getMetaLines(cfg.id, rec, meta)

  return (
    <div style={{ maxWidth:'430px', margin:'0 auto', minHeight:'100dvh', background:'#080f0a', paddingBottom:'60px' }}>

      {/* Back */}
      <div style={{ padding:'52px 20px 0' }}>
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Back to vault"
          style={{
            display:'flex', alignItems:'center', gap:'5px', color:'#1fce94',
            fontFamily:'var(--f-body)', fontSize:'12px', fontWeight:500, letterSpacing:'0.04em',
            textShadow:'0 0 10px rgba(31,206,148,0.40)', minHeight:'44px',
            WebkitTapHighlightColor:'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          vault
        </button>
      </div>

      {/* Image zone */}
      <div style={{
        margin:'12px 16px 0', height:'210px', borderRadius:'18px',
        overflow:'hidden', position:'relative',
        background: bgAtmosphere,
        border:`1px solid ${col}20`,
      }}>
        {rec.image_url && (
          <img src={rec.image_url} alt={rec.title}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
          />
        )}

        {/* Load poster button — visual categories, no image, no candidates */}
        {!rec.image_url && !hasCandidates && ['film','tv','music','book','city'].includes(rec.category) && (
          <button onClick={triggerEnrich} disabled={enriching} style={{
            position:'absolute', bottom:'14px', right:'14px',
            background:'rgba(240,230,200,0.07)', border:'0.5px solid rgba(240,230,200,0.16)',
            borderRadius:'8px', padding:'6px 12px',
            fontFamily:'var(--f-ui)', fontSize:'9px', fontWeight:700,
            letterSpacing:'0.08em', textTransform:'uppercase',
            color:'rgba(240,230,200,0.50)', cursor:enriching ? 'not-allowed' : 'pointer',
            WebkitTapHighlightColor:'transparent',
          }}>
            {enriching ? 'searching...' : 'load poster'}
          </button>
        )}

        {/* Category badge */}
        <div style={{
          position:'absolute', top:'12px', left:'14px', zIndex:2,
          background:cfg.badgeBg, border:`0.5px solid ${cfg.badgeBorder}`,
          borderRadius:'6px', padding:'3px 10px',
          fontFamily:'var(--f-ui)', fontSize:'9px', fontWeight:700,
          letterSpacing:'0.08em', textTransform:'uppercase',
          color:'rgba(240,230,200,0.95)', backdropFilter:'blur(8px)',
        }}>
          {cfg.label}
        </div>

        {isExperienced && (
          <div style={{
            position:'absolute', top:'12px', right:'14px', zIndex:2,
            background:'rgba(31,206,148,0.12)', border:'0.5px solid rgba(31,206,148,0.30)',
            borderRadius:'6px', padding:'3px 10px',
            fontFamily:'var(--f-ui)', fontSize:'9px', fontWeight:700,
            letterSpacing:'0.08em', textTransform:'uppercase', color:'#1fce94',
          }}>
            {cfg.verb}
          </div>
        )}
      </div>

      {/* ── CANDIDATE CONFIRMATION STRIP ─────────────────── */}
      {hasCandidates && (
        <div style={{ margin:'14px 16px 0', padding:'14px', borderRadius:'14px', background:'rgba(240,230,200,0.03)', border:'1px solid rgba(240,230,200,0.08)' }}>
          <p style={{ fontFamily:'var(--f-body)', fontSize:'11px', color:'rgba(240,230,200,0.45)', marginBottom:'10px' }}>
            Is one of these the right film?
          </p>
          <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'4px' }}>
            {(candidates as TmdbCandidate[]).map((c, i) => (
              <button
                key={i}
                onClick={() => confirmCandidate(c)}
                disabled={confirming}
                style={{
                  flexShrink:0, width:'70px', cursor:'pointer',
                  WebkitTapHighlightColor:'transparent',
                  display:'flex', flexDirection:'column', gap:'5px',
                }}
              >
                <div style={{
                  width:'70px', height:'100px', borderRadius:'8px',
                  overflow:'hidden', border:'1px solid rgba(240,230,200,0.12)',
                  background:'rgba(240,230,200,0.04)',
                }}>
                  {c.poster_url ? (
                    <img src={c.poster_url} alt={c.title}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    />
                  ) : (
                    <div style={{ width:'100%', height:'100%', background:col + '20', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontFamily:'var(--f-ui)', fontSize:'8px', color:'rgba(240,230,200,0.30)' }}>no image</span>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily:'var(--f-body)', fontSize:'9px', color:'rgba(240,230,200,0.60)', lineHeight:1.3, textAlign:'left' }}>
                  {c.title}
                  {c.release_year ? ` (${c.release_year})` : ''}
                </div>
              </button>
            ))}
          </div>
          <button onClick={rejectAllCandidates} style={{
            marginTop:'10px', fontFamily:'var(--f-body)',
            fontSize:'10px', color:'rgba(240,230,200,0.30)', letterSpacing:'0.04em',
            WebkitTapHighlightColor:'transparent',
          }}>
            None of these →
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ padding:'20px 20px 0' }}>

        <h1 style={{
          fontFamily:'var(--f-title)', fontSize:'24px', fontWeight:700,
          color:'rgba(240,230,200,0.96)', lineHeight:1.15, marginBottom:'5px',
        }}>
          {rec.title}
        </h1>

        <p style={{
          fontFamily:'var(--f-body)', fontSize:'13px', fontWeight:600,
          color:'#c8151e', marginBottom:'10px',
        }}>
          From {rec.source_name}
        </p>

        {/* Rich metadata — genre, year, runtime, author etc. */}
        {metaLines.length > 0 && (
          <div style={{
            display:'flex', flexWrap:'wrap', gap:'4px 8px',
            marginBottom:'16px',
            fontFamily:'var(--f-body)', fontSize:'11px', color:'rgba(240,230,200,0.40)',
          }}>
            {metaLines.map((line, i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                {i > 0 && <span aria-hidden="true" style={{ display:'inline-block', width:'2px', height:'2px', borderRadius:'50%', background:'rgba(240,230,200,0.25)' }} />}
                {line}
              </span>
            ))}
          </div>
        )}

        {/* Overview — film/TV only, collapsible */}
        {typeof meta.overview === 'string' && meta.overview && (
          <div style={{ marginBottom:'16px' }}>
            <p style={{
              fontFamily:'var(--f-body)', fontSize:'12px', fontWeight:300,
              color:'rgba(240,230,200,0.50)', lineHeight:1.65,
              display:'-webkit-box', WebkitLineClamp: showOverview ? 100 : 2,
              WebkitBoxOrient:'vertical', overflow:'hidden',
              transition:'all 200ms ease',
            }}>
              {meta.overview as string}
            </p>
            <button onClick={() => setShowOverview(p => !p)} style={{
              fontFamily:'var(--f-body)', fontSize:'10px', color:'rgba(240,230,200,0.30)',
              letterSpacing:'0.04em', marginTop:'4px',
              WebkitTapHighlightColor:'transparent',
            }}>
              {showOverview ? 'less' : 'more'}
            </button>
          </div>
        )}

        <div style={{ height:'0.5px', background:'rgba(240,230,200,0.07)', marginBottom:'20px' }} />

        {/* Mark experienced */}
        {!isExperienced && (
          <button onClick={markExperienced} disabled={isLoading} style={{
            width:'100%', height:'50px', borderRadius:'12px',
            border:`1px solid ${col}35`, background:`${col}10`, color:col,
            fontFamily:'var(--f-ui)', fontSize:'14px', fontWeight:700,
            letterSpacing:'0.06em', textTransform:'uppercase',
            cursor:isLoading ? 'not-allowed' : 'pointer', opacity:isLoading ? 0.6 : 1,
            marginBottom:'20px', WebkitTapHighlightColor:'transparent',
          }}>
            {isLoading ? 'Updating...' : `I ${cfg.verb} this`}
          </button>
        )}

        {/* Reaction */}
        {isExperienced && (
          <div style={{ marginBottom:'20px' }}>
            <span style={sectionLabel}>how was it?</span>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'8px' }}>
              {REACTIONS.map(r => {
                const sel = rec.reaction === r.value
                return (
                  <button key={r.value} onClick={() => setReaction(r.value)}
                    disabled={isLoading} aria-pressed={sel}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
                      padding:'10px 4px', borderRadius:'10px',
                      border:`1px solid ${sel ? 'rgba(31,206,148,0.40)' : 'rgba(240,230,200,0.09)'}`,
                      background:sel ? 'rgba(31,206,148,0.08)' : 'rgba(240,230,200,0.025)',
                      cursor:'pointer', transition:'all 160ms ease',
                      WebkitTapHighlightColor:'transparent',
                    }}
                  >
                    <span style={{ fontSize:'20px' }}>{r.emoji}</span>
                    <span style={{ fontFamily:'var(--f-ui)', fontSize:'8px', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:sel ? '#1fce94' : 'rgba(240,230,200,0.35)' }}>
                      {r.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {(rec.reaction === 'loved' || rec.reaction === 'good') && (
              <div style={{
                marginTop:'14px', padding:'14px 16px', borderRadius:'12px',
                background:'rgba(31,206,148,0.05)', border:'1px solid rgba(31,206,148,0.14)',
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
              }}>
                <div>
                  <p style={{ fontFamily:'var(--f-display)', fontStyle:'italic', fontSize:'15px', fontWeight:400, color:'rgba(240,230,200,0.90)', marginBottom:'2px' }}>
                    Tell {rec.source_name}?
                  </p>
                  <p style={{ fontFamily:'var(--f-body)', fontSize:'11px', color:'rgba(240,230,200,0.35)' }}>
                    Let them know their rec landed.
                  </p>
                </div>
                <button onClick={shareWithSource} style={{
                  background:'#1fce94', color:'#080f0a',
                  fontFamily:'var(--f-ui)', fontSize:'11px', fontWeight:700,
                  letterSpacing:'0.06em', textTransform:'uppercase',
                  padding:'8px 14px', borderRadius:'8px', border:'none',
                  cursor:'pointer', flexShrink:0, WebkitTapHighlightColor:'transparent',
                }}>
                  Send
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom:'20px' }}>
          <span style={sectionLabel}>your note</span>
          <textarea
            ref={notesRef} defaultValue={rec.notes ?? ''}
            placeholder="One thing to remember..."
            rows={3} onChange={() => setNotesDirty(true)} onBlur={saveNotes}
            style={{
              width:'100%', background:'rgba(240,230,200,0.04)',
              border:'1px solid rgba(240,230,200,0.10)', borderRadius:'10px',
              padding:'12px 14px', fontFamily:'var(--f-body)',
              fontSize:'14px', color:'rgba(240,230,200,0.92)',
              outline:'none', resize:'none', lineHeight:1.6, caretColor:'#1fce94',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{
          display:'flex', justifyContent:'space-between',
          fontFamily:'var(--f-body)', fontSize:'11px', color:'rgba(240,230,200,0.22)',
        }}>
          <span>Saved {new Date(rec.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
          <span style={{ textTransform:'capitalize' }}>{rec.source_type}</span>
        </div>

      </div>
    </div>
  )
}

// Rich metadata per category — every field earns its place
function getMetaLines(
  catId: string,
  rec:   Recommendation,
  meta:  Record<string, unknown>
): string[] {
  switch (catId) {
    case 'film': case 'tv': {
      const p: string[] = []
      if (typeof meta.genre        === 'string') p.push(meta.genre)
      if (typeof meta.release_year === 'number') p.push(String(meta.release_year))
      if (typeof meta.runtime      === 'number') p.push(`${meta.runtime} min`)
      if (typeof meta.vote_average === 'number' && meta.vote_average > 0) p.push(`★ ${(meta.vote_average as number).toFixed(1)}`)
      return p
    }
    case 'music': {
      const p: string[] = []
      if (typeof meta.artist === 'string') p.push(meta.artist)
      if (typeof meta.album  === 'string') p.push(meta.album)
      if (typeof meta.release_year === 'number') p.push(String(meta.release_year))
      return p
    }
    case 'book': {
      const p: string[] = []
      if (typeof meta.author === 'string') p.push(meta.author)
      if (typeof meta.genre  === 'string') p.push(meta.genre)
      if (typeof meta.year   === 'number') p.push(String(meta.year))
      return p
    }
    case 'restaurant': case 'bar': {
      const p: string[] = []
      if (rec.location?.city)                                     p.push(rec.location.city)
      if (typeof meta.cuisine      === 'string')                  p.push(meta.cuisine)
      if (typeof meta.type         === 'string')                  p.push(meta.type)
      if (typeof meta.price_level  === 'number')                  p.push('₹'.repeat(meta.price_level as number))
      return p
    }
    case 'city': {
      const p: string[] = []
      if (rec.location?.country)                                  p.push(rec.location.country)
      if (typeof meta.type         === 'string')                  p.push(meta.type)
      if (typeof meta.best_season  === 'string')                  p.push(meta.best_season)
      return p
    }
    case 'activity': {
      const p: string[] = []
      if (rec.location?.city)                                     p.push(rec.location.city)
      if (typeof meta.type         === 'string')                  p.push(meta.type)
      return p
    }
    default: return []
  }
}
