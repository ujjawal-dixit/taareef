'use client'

// app/(app)/rec/[id]/rec-detail-client.tsx
// Session 9 redesign:
// - Category badge removed from detail screen (back nav already names it)
// - WATCHED/EXPERIENCED status badge: top-right only, category vivid
// - Card border: 1px category vivid at 40% + outer glow at 8%
// - Card/interaction separator: thin rule category vivid at 20%
// - Interaction layer background: #1a1a1a — elevated from canvas
// - Section headers: category vivid at 60% opacity
// - Reactions: hidden entirely until experienced (not greyed out)
// - Reaction pills: 1px category vivid border at 30% when unselected
// - Duplicate note bug fixed: note field hidden when card already shows it; "Edit note" tap to expand
// - Back nav: full-width neon pill every screen
// - Source block: dedicated section with source type display
// - Edit details: full-width pill, same style as back nav
// - Share card: full-width neon pill (PNG export via html2canvas)
// - Mark as experienced: full-width, category color, always visible when not experienced
// - Tell source: "Tell them" instead of "SEND"
// - Experienced status: structured label, not floating text
// - Rotating micro-prompts on note field

import { useState, useRef, useCallback, useEffect } from 'react'
import Link                               from 'next/link'
import { useRouter }                      from 'next/navigation'
import Image                              from 'next/image'
import { CATEGORY_MAP, getCardGradient, getCardVignette, CATEGORIES } from '@/constants/categories'
import { hasValidImage } from '@/lib/utils/fallback'
import type { CategoryConfig } from '@/constants/categories'
import type { Recommendation, Reaction, Category } from '@/lib/types'
import { triggerEnrichment } from '@/lib/utils/enrich'

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

// Source type → display prefix + glyph
function formatSource(sourceType: string, sourceName: string): { display: string; type: string } {
  switch (sourceType) {
    case 'instagram':
      return { display: `@${sourceName.replace(/^@/, '')}`, type: 'Instagram' }
    case 'twitter':
      return { display: `@${sourceName.replace(/^@/, '')}`, type: 'Twitter' }
    case 'youtube':
      return { display: `@${sourceName.replace(/^@/, '')}`, type: 'YouTube' }
    case 'article':
    case 'newsletter':
      return { display: sourceName, type: 'Article' }
    case 'podcast':
      return { display: sourceName, type: 'Podcast' }
    default:
      return { display: sourceName, type: '' }
  }
}

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
      const subtype  = typeof meta.subtype === 'string' ? meta.subtype : null
      const director = typeof meta.director === 'string' ? meta.director : null
      const creator  = typeof meta.created_by === 'string' ? meta.created_by : null
      const genre    = Array.isArray(meta.genres)
        ? (meta.genres as string[])[0]
        : typeof meta.genres === 'string' ? meta.genres : null
      const year     = meta.release_year ?? meta.year
      const runtime  = meta.runtime_minutes ? `${meta.runtime_minutes} min` : null
      const status   = typeof meta.series_status === 'string' ? meta.series_status : null
      const seasons  = meta.seasons ? `${meta.seasons} seasons` : null
      const platform = typeof meta.platform === 'string' ? meta.platform : null
      if (subtype === 'series') {
        if (creator)  p.push(creator)
        if (platform) p.push(platform)
        if (seasons)  p.push(seasons)
        if (status)   p.push(status)
      } else {
        if (director) p.push(director)
        if (genre)    p.push(String(genre))
        if (year)     p.push(String(year))
        if (runtime)  p.push(runtime)
      }
      break
    }
    case 'listen': {
      const artist   = typeof meta.artist === 'string' ? meta.artist : null
      const host     = typeof meta.host === 'string' ? meta.host : null
      const genre    = typeof meta.genre === 'string' ? meta.genre : null
      const year     = meta.release_year ?? meta.year
      const album    = typeof meta.album === 'string' ? meta.album : null
      const tracks   = meta.total_tracks ? `${meta.total_tracks} tracks` : null
      const subtype  = typeof meta.subtype === 'string' ? meta.subtype : null
      if (subtype === 'podcast') {
        if (host) p.push(host)
      } else if (subtype === 'song') {
        if (artist) p.push(artist)
        if (album)  p.push(album)
        if (year)   p.push(String(year))
      } else {
        if (artist) p.push(artist)
        if (genre)  p.push(genre)
        if (year)   p.push(String(year))
        if (tracks) p.push(tracks)
      }
      break
    }
    case 'read': {
      const author   = typeof meta.author === 'string' ? meta.author : null
      const subgenre = typeof meta.subgenre === 'string' ? meta.subgenre
        : typeof meta.genre === 'string' ? meta.genre : null
      const year     = meta.year ?? meta.published_year
      const pages    = meta.pages ? `${meta.pages} pp` : null
      if (author)   p.push(author)
      if (subgenre) p.push(subgenre)
      if (year)     p.push(String(year))
      if (pages)    p.push(pages)
      break
    }
    case 'dine': {
      const type = typeof meta.type === 'string' ? meta.type : null
      const nbhd = typeof meta.neighbourhood === 'string' ? meta.neighbourhood : null
      const city = typeof meta.city === 'string' ? meta.city : null
      if (type) p.push(type)
      if (nbhd) p.push(nbhd)
      if (city) p.push(city)
      break
    }
    case 'do': {
      const location   = typeof meta.city === 'string' ? meta.city : typeof meta.location === 'string' ? meta.location : null
      const difficulty = typeof meta.difficulty === 'string' ? meta.difficulty : null
      if (location)   p.push(location)
      if (difficulty) p.push(difficulty)
      break
    }
    case 'visit': {
      const venue = typeof meta.venue === 'string' ? meta.venue : null
      const city  = typeof meta.city === 'string' ? meta.city : null
      if (venue) p.push(venue)
      if (city)  p.push(city)
      break
    }
  }
  return p.slice(0, 4).join(' · ')
}

function getDateUrgency(dateStr: string | null): 'none' | 'info' | 'soon' | 'urgent' | 'closed' {
  if (!dateStr) return 'none'
  const cleaned = dateStr.replace(/until|closes|closing|through/gi, '').trim()
  const parsed  = new Date(cleaned)
  if (isNaN(parsed.getTime())) return 'info'
  const now  = new Date()
  const days = Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0)   return 'closed'
  if (days <= 7)  return 'urgent'
  if (days <= 30) return 'soon'
  return 'info'
}

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")"

function DotGrid({ rgb }: { rgb: string }) {
  return (
    <div style={{
      position:        'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle,rgba(${rgb},1) 1.4px,transparent 1.4px)`,
      backgroundSize:  '13px 13px', opacity: 0.10,
    }} />
  )
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
      <circle cx="76" cy="76" r="6"  fill={c} opacity="0.45"/>
      <line x1="76" y1="4"   x2="76"  y2="30"  stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="76" y1="122" x2="76"  y2="148" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="4"  y1="76"  x2="30"  y2="76"  stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="122" y1="76" x2="148" y2="76"  stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.28"/>
      <line x1="25" y1="25"  x2="44"  y2="44"  stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="108" y1="108" x2="127" y2="127" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="127" y1="25" x2="108" y2="44"  stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <line x1="25" y1="127" x2="44"  y2="108" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.20"/>
      <circle cx="76" cy="32"  r="3.5" fill={c} opacity="0.35"/>
      <circle cx="76" cy="120" r="3.5" fill={c} opacity="0.35"/>
      <circle cx="32" cy="76"  r="3.5" fill={c} opacity="0.35"/>
      <circle cx="120" cy="76" r="3.5" fill={c} opacity="0.35"/>
    </svg>
  )
}

export function RecDetailClient({ recommendation: rec, categoryConfig: cfg }: Props) {
  const [reaction,     setReaction]     = useState<Reaction | null>(rec.reaction)
  const noteDraftKey = `taareef-note-draft-${rec.id}`
  const [note,         setNote]         = useState(rec.notes ?? '')
  const [noteExpanded, setNoteExpanded] = useState(!rec.notes)
  const [saving,       setSaving]       = useState(false)
  const [showRemove,   setShowRemove]   = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [promptIdx,    setPromptIdx]    = useState(0)
  const [sharing,      setSharing]      = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const router   = useRouter()

  // Live metadata state — updated when candidates arrive or poster confirmed
  const [liveMeta,       setLiveMeta]       = useState<Record<string,unknown>>(
    (rec.metadata as Record<string,unknown>) ?? {}
  )
  const [liveImageUrl,   setLiveImageUrl]   = useState<string | null>(rec.image_url)
  const [confirmingId,   setConfirmingId]   = useState<number | null>(null)
  const [dismissedCands, setDismissedCands] = useState(false)
  const [platforms,      setPlatforms]      = useState<string[]>(
    // Use cached platforms from metadata if available
    Array.isArray((rec.metadata as Record<string,unknown>)?.streaming_platforms)
      ? (rec.metadata as Record<string,unknown>).streaming_platforms as string[]
      : []
  )
  const [loadingPlatforms, setLoadingPlatforms] = useState(false)

  // Retroactive enrichment — fires if Watch/Listen card has no image and no candidates.
  // After firing, polls once after 2.5s to pick up candidates that just arrived.
  useEffect(() => {
    const hasCands   = Array.isArray(liveMeta.tmdb_candidates) && (liveMeta.tmdb_candidates as unknown[]).length > 0
    const enrichable = rec.category === 'watch' || rec.category === 'listen'
    if (!enrichable || liveImageUrl || hasCands || dismissedCands) return

    // Fire enrichment then poll once after 2.5s for candidates
    triggerEnrichment(rec.id)
      .then(() => new Promise(r => setTimeout(r, 2500)))
      .then(() => fetch(`/api/recommendations/${rec.id}`))
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return
        const freshMeta = (data.metadata as Record<string,unknown>) ?? {}
        if (Array.isArray(freshMeta.tmdb_candidates) && (freshMeta.tmdb_candidates as unknown[]).length > 0) {
          setLiveMeta(freshMeta)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.id, rec.category])

  // Fetch Watchmode streaming platforms for experienced Watch cards
  useEffect(() => {
    const cachedPlatforms = liveMeta.streaming_platforms
    if (
      rec.category !== 'watch' ||
      rec.status === 'saved' ||
      platforms.length > 0 ||
      Array.isArray(cachedPlatforms)
    ) return

    setLoadingPlatforms(true)
    fetch(`/api/watchmode?recId=${rec.id}&title=${encodeURIComponent(rec.title)}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (data?.platforms?.length) setPlatforms(data.platforms)
      })
      .catch(() => {})
      .finally(() => setLoadingPlatforms(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.id, rec.category, rec.status])

  // Restore note draft from localStorage on mount
  useEffect(() => {
    if (rec.notes) return
    try {
      const draft = localStorage.getItem(noteDraftKey)
      if (draft && draft.trim()) setNote(draft)
    } catch {}
  }, [noteDraftKey, rec.notes])

  // Persist note draft as user types
  useEffect(() => {
    if (rec.notes && note === rec.notes) return
    try {
      if (note.trim()) {
        localStorage.setItem(noteDraftKey, note)
      } else {
        localStorage.removeItem(noteDraftKey)
      }
    } catch {}
  }, [note, noteDraftKey, rec.notes])

  const hasImage = hasValidImage(liveImageUrl)
  const isExp    = rec.status !== 'saved'
  const meta     = rec.metadata as Record<string, unknown>
  const metaLine = buildMeta(rec.category as Category, meta)
  const tell     = getTellConfig(rec.source_type, rec.source_name, reaction)
  const src      = formatSource(rec.source_type, rec.source_name)

  // Note micro-prompts — rotating
  const catCfg      = CATEGORIES.find(c => c.id === rec.category)
  const prompts     = catCfg?.notePlaceholders ?? ['What made you save this?', 'One thing to remember…']
  const notePlaceholder = prompts[promptIdx % prompts.length]

  const rotatePrompt = useCallback(() => {
    setPromptIdx(i => (i + 1) % prompts.length)
  }, [prompts.length])

  // Rotate prompt every 4s when note is empty
  useState(() => {
    if (note.length > 0) return
    const interval = setInterval(rotatePrompt, 4000)
    return () => clearInterval(interval)
  })

  async function patch(body: Record<string, unknown>) {
    setSaving(true); setError(null)
    try {
      const res  = await fetch(`/api/recommendations/${rec.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
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

  async function handleMarkExperienced() {
    await patch({ status: cfg.statusOptions.find(s => s !== 'saved' && s !== 'dismissed') ?? 'experienced' })
    window.location.reload()
  }

  async function handleReaction(v: Reaction) {
    setReaction(v)
    await patch({ reaction: v, status: 'experienced' })
  }

  async function handleRemove() {
    const r = await patch({ reaction: null, status: 'saved' })
    if (!r?.error) { setReaction(null); setShowRemove(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      // Hard delete via DELETE method — immediate, clean
      const res  = await fetch(`/api/recommendations/${rec.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
        setDeleting(false)
        return
      }
      // Clear note draft from localStorage
      try { localStorage.removeItem(`taareef-note-draft-${rec.id}`) } catch {}
      // Navigate back to category list
      router.push(`/dashboard/${rec.category}`)
      router.refresh()
    } catch {
      setError('Could not delete — try again?')
      setDeleting(false)
    }
  }

  // Confirm a TMDB candidate — sets poster, clears candidates
  async function handleConfirmCandidate(candidate: Record<string,unknown>) {
    setConfirmingId(candidate.tmdb_id as number)
    try {
      const res  = await fetch(`/api/enrich/${rec.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tmdb_id:      candidate.tmdb_id,
          poster_url:   candidate.poster_url,
          genre:        candidate.genre,
          genre_hue:    candidate.genre_hue,
          overview:     candidate.overview,
          release_year: candidate.release_year,
          runtime:      candidate.runtime,
          vote_average: candidate.vote_average,
          director:     candidate.director,
          seasons:      candidate.seasons,
          series_status:candidate.series_status,
          subtype:      candidate.subtype,
        }),
      })
      const json = await res.json()
      if (json.data?.confirmed) {
        setLiveImageUrl(candidate.poster_url as string)
        setLiveMeta(prev => ({ ...prev, tmdb_candidates: null, ...candidate }))
      }
    } catch {
      setError('Could not confirm poster — try again?')
    } finally {
      setConfirmingId(null)
    }
  }

  // Dismiss all candidates — keeps Criterion mode permanently
  function handleDismissCandidates() {
    setDismissedCands(true)
    setLiveMeta(prev => ({ ...prev, tmdb_candidates: null }))
    // Clear from database silently
    fetch(`/api/recommendations/${rec.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ metadata: { ...liveMeta, tmdb_candidates: null } }),
    }).catch(() => {})
  }

  async function handleShare() {
    setSharing(true)
    try {
      // PNG export via html2canvas
      const html2canvas = (await import('html2canvas')).default
      if (!cardRef.current) return
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale:           2,
        useCORS:         true,
        logging:         false,
      })
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) return
      const file = new File([blob], `taareef-${rec.title.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: rec.title })
      } else {
        // Fallback: share link
        const url = `${window.location.origin}/rec/${rec.id}`
        if (navigator.share) {
          await navigator.share({ title: rec.title, url })
        } else {
          await navigator.clipboard.writeText(url)
        }
      }
    } catch {
      // User cancelled or browser unsupported — silent
    } finally {
      setSharing(false)
    }
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
      const urls: Record<string, string> = {
        instagram: `https://instagram.com/${handle}`,
        twitter:   `https://twitter.com/${handle}`,
        youtube:   `https://youtube.com/@${handle}`,
      }
      const url = urls[rec.source_type]
      if (url) window.open(url, '_blank', 'noopener')
    }
  }

  const neonPill: React.CSSProperties = {
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
    cursor:                  'pointer',
    width:                   '100%',
    transition:              'background 160ms ease',
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily:    'var(--f-ui)',
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color:         `rgba(${cfg.vividRgb},0.60)`,
    marginBottom:  '8px',
    display:       'block',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111111' }}>

      {/* FIXED CARD — sticky, always visible */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#111111' }}>

        {/* Back nav — full-width neon pill */}
        <div style={{ padding: '52px 16px 0' }}>
          <Link
            href={`/dashboard/${rec.category}`}
            style={neonPill as React.CSSProperties}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {cfg.label}
          </Link>
        </div>

        {/* Card — with deliberate border and precious feel */}
        <div
          ref={cardRef}
          style={{
            margin:       '12px 16px 0',
            borderRadius: '11px',
            overflow:     'hidden',
            position:     'relative',
            background:   cfg.deepDark,
            // Category vivid border at 40% + outer glow at 8%
            border:       `1px solid rgba(${cfg.vividRgb},0.40)`,
            boxShadow:    `0 0 0 1px rgba(${cfg.vividRgb},0.08), 0 0 24px rgba(${cfg.vividRgb},0.12), 0 20px 50px rgba(0,0,0,0.70)`,
          }}
        >
          {/* Grain */}
          <div style={{
            position:        'absolute', inset: 0, borderRadius: '11px',
            zIndex:          30, pointerEvents: 'none',
            backgroundImage: GRAIN, backgroundSize: '200px 200px',
            opacity:         0.052, mixBlendMode: 'overlay',
          }} />

          {/* Image zone — no category badge (back nav already names it) */}
          <div style={{ width: '100%', height: '200px', position: 'relative', overflow: 'hidden' }}>
            {hasImage ? (
              <Image
                src={liveImageUrl!}
                alt={rec.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width:480px) 100vw,480px"
                priority
              />
            ) : (
              <>
                <div style={{ position: 'absolute', inset: 0, background: getCardGradient(rec.category as Category) }} />
                <DotGrid rgb={cfg.vividRgb} />
                <Rangoli rgb={cfg.vividRgb} />
              </>
            )}
            <div style={{
              position:   'absolute', bottom: 0, left: 0, right: 0,
              height:     '70%', zIndex: 10, pointerEvents: 'none',
              background: getCardVignette(rec.category as Category),
            }} />
            {/* Status badge top-right — only when experienced */}
            {isExp && (
              <div style={{
                position:      'absolute', top: '12px', right: '12px', zIndex: 15,
                fontFamily:    'var(--f-ui)', fontSize: '9px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase',
                padding:       '4px 11px', borderRadius: '20px',
                border:        `1px solid rgba(${cfg.vividRgb},0.55)`,
                color:         cfg.vividColor,
                background:    `rgba(${cfg.vividRgb},0.12)`,
                backdropFilter:'blur(8px)',
              }}>
                {cfg.verbPast.toUpperCase()}
              </div>
            )}
          </div>

          {/* Info zone — deepDark background */}
          <div style={{ padding: '16px 17px 17px', background: cfg.deepDark }}>
            <div style={{
              fontFamily:    'var(--f-display)',
              fontStyle:     'italic',
              fontWeight:    600,
              fontSize:      '28px',
              color:         'rgba(255,255,255,0.97)',
              lineHeight:    1.10,
              marginBottom:  '5px',
              letterSpacing: '-0.2px',
            }}>
              {rec.title}
            </div>
            {metaLine && (
              <div style={{
                fontFamily:   'var(--f-body)',
                fontSize:     '11px',
                fontWeight:   400,
                color:        'rgba(255,255,255,0.50)',
                marginBottom: note ? '13px' : '15px',
              }}>
                {metaLine}
              </div>
            )}
            {note && (
              <div style={{
                fontFamily:   'var(--f-display)',
                fontStyle:    'italic',
                fontWeight:   300,
                fontSize:     '13.5px',
                color:        'rgba(255,255,255,0.90)',
                lineHeight:   1.55,
                marginBottom: '15px',
                paddingLeft:  '11px',
                borderLeft:   `1.5px solid rgba(${cfg.vividRgb},0.35)`,
              }}>
                &ldquo;{note.length > 120 ? note.slice(0, 120) + '…' : note}&rdquo;
              </div>
            )}
            <div style={{
              display:       'flex',
              justifyContent:'space-between',
              alignItems:    'center',
              paddingTop:    '12px',
              borderTop:     '0.5px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                fontFamily:  'var(--f-display)',
                fontStyle:   'italic',
                fontWeight:  300,
                fontSize:    '17px',
                color:       '#1fce94',
                textShadow:  '0 0 16px rgba(31,206,148,0.50)',
                letterSpacing:'-0.2px',
              }}>
                taareef
              </div>
              <div style={{
                fontFamily: 'var(--f-body)',
                fontSize:   '11px',
                fontWeight: 400,
                color:      'rgba(255,255,255,0.60)',
              }}>
                from {src.display}
              </div>
            </div>
          </div>
        </div>

        {/* Thin separator between card and interaction layer */}
        <div style={{
          height:     '1px',
          margin:     '0 16px',
          background: `rgba(${cfg.vividRgb},0.20)`,
        }} />
      </div>

      {/* SCROLLABLE INTERACTION LAYER — elevated surface */}
      <div style={{
        background:    '#1a1a1a',
        padding:       '20px 20px 100px',
        borderTop:     'none',
      }}>

        {/* ── CANDIDATE STRIP ──────────────────────────────────────
            Shows when TMDB enrichment has returned poster options.
            The card was a sketch — now the user picks the poster
            and it comes alive. The strip slides in naturally. */}
        {(() => {
          const cands = Array.isArray(liveMeta.tmdb_candidates) && !dismissedCands
            ? liveMeta.tmdb_candidates as Record<string,unknown>[]
            : []
          if (!cands.length && !liveImageUrl && rec.category === 'watch') {
            // Enrichment fired but candidates not yet back — show breathing rangoli
            return (
              <div style={{
                textAlign:   'center',
                padding:     '8px 0 20px',
                fontFamily:  'var(--f-body)',
                fontSize:    '11px',
                fontWeight:  300,
                color:       `rgba(${cfg.vividRgb},0.45)`,
                letterSpacing:'0.04em',
                animation:   'pulseOpacity 2.4s ease-in-out infinite',
              }}>
                finding the right poster…
              </div>
            )
          }
          if (!cands.length) return null
          return (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontFamily:    'var(--f-ui)',
                fontSize:      '9px',
                fontWeight:    700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color:         `rgba(${cfg.vividRgb},0.60)`,
                marginBottom:  '10px',
              }}>
                Is this the right one?
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {cands.map((c, idx) => {
                  const isConfirming = confirmingId === (c.tmdb_id as number)
                  return (
                    <button
                      key={idx}
                      onClick={() => handleConfirmCandidate(c)}
                      disabled={confirmingId !== null}
                      style={{
                        flexShrink:              0,
                        width:                   '88px',
                        borderRadius:            '8px',
                        overflow:                'hidden',
                        border:                  `1px solid rgba(${cfg.vividRgb},0.30)`,
                        background:              cfg.deepDark,
                        cursor:                  confirmingId !== null ? 'not-allowed' : 'pointer',
                        position:                'relative',
                        transition:              'border-color 160ms ease, transform 120ms ease',
                        WebkitTapHighlightColor: 'transparent',
                        padding:                 0,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = `rgba(${cfg.vividRgb},0.70)`
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = `rgba(${cfg.vividRgb},0.30)`
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                      }}
                    >
                      {/* Poster image */}
                      <div style={{ width: '100%', paddingTop: '150%', position: 'relative', overflow: 'hidden' }}>
                        {c.poster_url ? (
                          <img
                            src={c.poster_url as string}
                            alt={c.title as string}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: `rgba(${cfg.vividRgb},0.20)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '10px', color: cfg.vividColor, padding: '4px', textAlign: 'center' }}>
                              {c.title as string}
                            </span>
                          </div>
                        )}
                        {isConfirming && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.70)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.20)', borderTopColor: cfg.vividColor, animation: 'spin 0.7s linear infinite' }} />
                          </div>
                        )}
                      </div>
                      {/* Title + year */}
                      <div style={{ padding: '6px 6px 7px', background: cfg.deepDark }}>
                        <div style={{
                          fontFamily: 'var(--f-body)', fontSize: '9px', fontWeight: 500,
                          color: 'rgba(255,255,255,0.80)', lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        } as React.CSSProperties}>
                          {c.title as string}
                        </div>
                        <div style={{ fontFamily: 'var(--f-body)', fontSize: '8px', fontWeight: 300, color: `rgba(${cfg.vividRgb},0.55)`, marginTop: '2px' }}>
                          {c.subtype === 'series' ? 'Series' : 'Film'} {c.release_year ? `· ${c.release_year}` : ''}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {/* None of these */}
              <button
                onClick={handleDismissCandidates}
                style={{
                  marginTop:               '8px',
                  background:              'none',
                  border:                  'none',
                  cursor:                  'pointer',
                  fontFamily:              'var(--f-body)',
                  fontSize:                '11px',
                  fontWeight:              300,
                  color:                   'rgba(255,255,255,0.28)',
                  padding:                 '4px 0',
                  WebkitTapHighlightColor: 'transparent',
                  textDecoration:          'underline',
                  textUnderlineOffset:     '3px',
                  textDecorationColor:     'rgba(255,255,255,0.14)',
                }}
              >
                None of these
              </button>
            </div>
          )
        })()}

        {/* Share card + Edit details — full-width pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={handleShare}
            disabled={sharing}
            style={{
              ...neonPill as React.CSSProperties,
              opacity: sharing ? 0.6 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            {sharing ? 'Preparing…' : 'Share this card'}
          </button>

          <Link
            href={`/rec/${rec.id}/edit`}
            style={neonPill as React.CSSProperties}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit details
          </Link>
        </div>

        <div style={{ height: '0.5px', background: `rgba(${cfg.vividRgb},0.12)`, marginBottom: '20px' }} />

        {/* Mark as experienced — always visible when not experienced */}
        {!isExp && (
          <button
            onClick={handleMarkExperienced}
            disabled={saving}
            style={{
              width:                   '100%',
              height:                  '52px',
              borderRadius:            '14px',
              border:                  'none',
              background:              `rgba(${cfg.vividRgb},0.90)`,
              color:                   '#111111',
              fontFamily:              'var(--f-ui)',
              fontSize:                '13px',
              fontWeight:              700,
              letterSpacing:           '0.08em',
              textTransform:           'uppercase',
              cursor:                  saving ? 'not-allowed' : 'pointer',
              transition:              'all 160ms ease',
              WebkitTapHighlightColor: 'transparent',
              marginBottom:            '20px',
              boxShadow:               `0 4px 20px rgba(${cfg.vividRgb},0.35)`,
            }}
          >
            Mark as {cfg.verbPast}
          </button>
        )}

        {/* Experienced status — structured */}
        {isExp && (
          <div style={{ marginBottom: '16px' }}>
            <span style={sectionLabel}>Experienced</span>
            <div style={{
              display:    'flex',
              alignItems: 'center',
              justifyContent:'space-between',
            }}>
              <span style={{
                fontFamily: 'var(--f-body)',
                fontSize:   '13px',
                fontWeight: 400,
                color:      'rgba(255,255,255,0.60)',
                textTransform:'capitalize',
              }}>
                {rec.status}
              </span>
              {isExp && (
                <button
                  onClick={() => setShowRemove(true)}
                  style={{
                    background:   'none',
                    border:       'none',
                    cursor:       'pointer',
                    fontFamily:   'var(--f-body)',
                    fontSize:     '11px',
                    fontWeight:   300,
                    color:        'rgba(255,255,255,0.24)',
                    padding:      '4px 0',
                  }}
                >
                  Remove log
                </button>
              )}
            </div>
            <div style={{ height: '0.5px', background: `rgba(${cfg.vividRgb},0.12)`, marginTop: '14px', marginBottom: '20px' }} />
          </div>
        )}

        {/* Streaming platforms — Watch cards only, after experiencing */}
        {rec.category === 'watch' && isExp && (
          <div style={{ marginBottom: '20px' }}>
            <span style={sectionLabel}>Stream on</span>
            {loadingPlatforms ? (
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '12px', color: `rgba(${cfg.vividRgb},0.40)`, fontStyle: 'italic' }}>
                Checking availability…
              </div>
            ) : platforms.length > 0 ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {platforms.map(p => (
                  <span key={p} style={{
                    fontFamily:    'var(--f-ui)',
                    fontSize:      '10px',
                    fontWeight:    700,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    color:         `rgba(${cfg.vividRgb},0.85)`,
                    background:    `rgba(${cfg.vividRgb},0.10)`,
                    border:        `1px solid rgba(${cfg.vividRgb},0.28)`,
                    borderRadius:  '6px',
                    padding:       '4px 10px',
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--f-body)', fontSize: '12px', color: 'rgba(255,255,255,0.22)', fontWeight: 300 }}>
                Not available on major platforms
              </div>
            )}
            <div style={{ height: '0.5px', background: `rgba(${cfg.vividRgb},0.12)`, marginTop: '16px' }} />
          </div>
        )}

        {/* Source block */}
        <div style={{ marginBottom: '20px' }}>
          <span style={sectionLabel}>Source</span>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            background:     'rgba(255,255,255,0.03)',
            border:         '1px solid rgba(255,255,255,0.06)',
            borderRadius:   '10px',
            padding:        '12px 14px',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--f-body)',
                fontSize:   '13px',
                fontWeight: 500,
                color:      'rgba(255,255,255,0.82)',
              }}>
                {src.display}
              </div>
              {src.type && (
                <div style={{
                  fontFamily: 'var(--f-body)',
                  fontSize:   '11px',
                  fontWeight: 300,
                  color:      'rgba(255,255,255,0.32)',
                  marginTop:  '2px',
                }}>
                  {src.type}
                </div>
              )}
            </div>
            <Link
              href={`/rec/${rec.id}/edit`}
              style={{
                fontFamily:    'var(--f-ui)',
                fontSize:      '9px',
                fontWeight:    700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:         `rgba(${cfg.vividRgb},0.65)`,
                textDecoration:'none',
                padding:       '6px 10px',
                border:        `1px solid rgba(${cfg.vividRgb},0.20)`,
                borderRadius:  '8px',
              }}
            >
              Edit
            </Link>
          </div>
        </div>

        <div style={{ height: '0.5px', background: `rgba(${cfg.vividRgb},0.12)`, marginBottom: '20px' }} />

        {/* Tell source block */}
        {isExp && tell && tell.action !== 'none' && (
          <div style={{
            background:    'rgba(31,206,148,0.05)',
            border:        '1px solid rgba(31,206,148,0.14)',
            borderRadius:  '13px',
            padding:       '14px 16px',
            display:       'flex',
            justifyContent:'space-between',
            alignItems:    'center',
            marginBottom:  '20px',
          }}>
            <div>
              <div style={{
                fontFamily:   'var(--f-body)',
                fontSize:     '14px',
                fontWeight:   500,
                color:        'rgba(255,255,255,0.88)',
                marginBottom: '3px',
              }}>
                {tell.label}
              </div>
              <div style={{
                fontFamily: 'var(--f-body)',
                fontSize:   '11px',
                fontWeight: 300,
                color:      'rgba(255,255,255,0.40)',
              }}>
                {tell.sub}
              </div>
            </div>
            <button
              onClick={handleTell}
              style={{
                background:    '#1fce94',
                color:         '#111111',
                fontFamily:    'var(--f-ui)',
                fontWeight:    700,
                fontSize:      '11px',
                letterSpacing: '1px',
                padding:       '8px 16px',
                borderRadius:  '20px',
                border:        'none',
                cursor:        'pointer',
                flexShrink:    0,
                textTransform: 'uppercase',
              }}
            >
              Tell them
            </button>
          </div>
        )}

        {/* Visit urgency date */}
        {rec.category === 'visit' && (() => {
          const dateStr = typeof meta.dates === 'string' ? meta.dates : null
          const urgency = getDateUrgency(dateStr)
          if (!dateStr || urgency === 'none') return null
          const styleMap: Record<string, React.CSSProperties> = {
            info:   { color: 'rgba(30,159,235,0.55)' },
            soon:   { color: 'rgba(30,159,235,0.80)' },
            urgent: { color: 'rgba(30,159,235,1.0)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' },
            closed: { color: 'rgba(255,255,255,0.22)', textDecoration: 'line-through' },
          }
          return (
            <div style={{ fontFamily: 'var(--f-body)', fontSize: '12px', fontWeight: 300, marginBottom: '16px', ...styleMap[urgency] }}>
              {urgency === 'urgent' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(30,159,235,1)', flexShrink: 0, display: 'inline-block' }} />}
              {dateStr}
            </div>
          )
        })()}

        {/* Dine — what to order */}
        {rec.category === 'dine' && typeof meta.what_to_order === 'string' && meta.what_to_order.trim() !== '' && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ ...sectionLabel, marginBottom: 0, flexShrink: 0 }}>Order</span>
            <span style={{ fontFamily: 'var(--f-body)', fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.72)' }}>
              {meta.what_to_order as string}
            </span>
          </div>
        )}

        <div style={{ height: '0.5px', background: `rgba(${cfg.vividRgb},0.12)`, marginBottom: '20px' }} />

        {/* Note — collapsed when note exists, expandable */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={sectionLabel}>
              {rec.notes ? 'Your note' : 'Add a note'}
            </span>
            {rec.notes && !noteExpanded && (
              <button
                onClick={() => setNoteExpanded(true)}
                style={{
                  background:   'none',
                  border:       'none',
                  cursor:       'pointer',
                  fontFamily:   'var(--f-ui)',
                  fontSize:     '9px',
                  fontWeight:   700,
                  letterSpacing:'0.08em',
                  textTransform:'uppercase',
                  color:        `rgba(${cfg.vividRgb},0.55)`,
                  padding:      '2px 0',
                }}
              >
                Edit
              </button>
            )}
          </div>
          {noteExpanded || !rec.notes ? (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => {
                if (note !== rec.notes) {
                  patch({ notes: note })
                  try { localStorage.removeItem(noteDraftKey) } catch {}
                }
              }}
              placeholder={notePlaceholder}
              maxLength={500}
              rows={3}
              style={{
                width:        '100%',
                background:   'rgba(255,255,255,0.03)',
                border:       `1px solid rgba(${cfg.vividRgb},0.18)`,
                borderRadius: '11px',
                padding:      '12px 14px',
                fontFamily:   'var(--f-body)',
                fontSize:     '13px',
                fontWeight:   300,
                fontStyle:    note.length === 0 ? 'italic' : 'normal',
                color:        'rgba(255,255,255,0.75)',
                resize:       'none',
                outline:      'none',
                caretColor:   '#1fce94',
                boxSizing:    'border-box',
                lineHeight:   1.6,
                transition:   'border-color 160ms ease',
              }}
              onFocus={e => { e.target.style.borderColor = `rgba(${cfg.vividRgb},0.45)` }}
              onBlurCapture={e => { e.target.style.borderColor = `rgba(${cfg.vividRgb},0.18)` }}
            />
          ) : (
            // Collapsed note preview
            <div style={{
              fontFamily:  'var(--f-body)',
              fontSize:    '13px',
              fontWeight:  300,
              fontStyle:   'italic',
              color:       'rgba(255,255,255,0.60)',
              lineHeight:  1.6,
              paddingLeft: '10px',
              borderLeft:  `1.5px solid rgba(${cfg.vividRgb},0.25)`,
            }}>
              {rec.notes}
            </div>
          )}
        </div>

        <div style={{ height: '0.5px', background: `rgba(${cfg.vividRgb},0.12)`, marginBottom: '20px' }} />

        {/* Reactions — only shown when experienced */}
        {isExp && (
          <div>
            <span style={sectionLabel}>How was it?</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {REACTIONS.map(r => {
                const on = reaction === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => handleReaction(r.value)}
                    disabled={saving}
                    style={{
                      fontFamily:              'var(--f-ui)',
                      fontSize:                '11px',
                      fontWeight:              700,
                      letterSpacing:           '1.5px',
                      textTransform:           'uppercase',
                      padding:                 '10px 20px',
                      borderRadius:            '8px',
                      cursor:                  'pointer',
                      transition:              'all 150ms ease',
                      background:              on ? `rgba(${cfg.vividRgb},0.18)` : 'rgba(255,255,255,0.04)',
                      // Unselected: 1px category vivid border at 30%
                      border:                  `1px solid rgba(${cfg.vividRgb},${on ? '0.55' : '0.30'})`,
                      color:                   on ? cfg.vividColor : `rgba(${cfg.vividRgb},0.55)`,
                      boxShadow:               on ? `0 0 12px rgba(${cfg.vividRgb},0.22)` : 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginTop:  '16px',
            fontFamily: 'var(--f-body)',
            fontSize:   '12px',
            color:      '#f43f5e',
            textAlign:  'center',
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop:      '24px',
          display:        'flex',
          justifyContent: 'space-between',
          fontFamily:     'var(--f-body)',
          fontSize:       '11px',
          fontWeight:     300,
          color:          'rgba(255,255,255,0.20)',
        }}>
          <span>
            Saved {new Date(rec.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span style={{ textTransform: 'capitalize' }}>
            {rec.source_type}
          </span>
        </div>

        {/* Delete card — inside interaction layer, not floating below */}
        <button
          onClick={() => setShowDelete(true)}
          style={{
            width:                   '100%',
            height:                  '44px',
            borderRadius:            '12px',
            background:              'transparent',
            border:                  '1px solid rgba(244,63,94,0.18)',
            color:                   'rgba(244,63,94,0.55)',
            fontFamily:              'var(--f-ui)',
            fontSize:                '11px',
            fontWeight:              700,
            letterSpacing:           '1.5px',
            textTransform:           'uppercase',
            cursor:                  'pointer',
            transition:              'all 160ms ease',
            WebkitTapHighlightColor: 'transparent',
            marginTop:               '16px',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.06)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,63,94,0.35)'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(244,63,94,0.80)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,63,94,0.18)'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(244,63,94,0.55)'
          }}
        >
          Delete card
        </button>
      </div>



      {/* Remove experience sheet */}
      {showRemove && (
        <div
          style={{
            position:  'fixed', inset: 0,
            background:'rgba(0,0,0,0.88)',
            display:   'flex', alignItems: 'flex-end',
            zIndex:    100,
          }}
          onClick={() => setShowRemove(false)}
        >
          <div
            style={{
              width:         '100%',
              background:    '#161616',
              borderRadius:  '22px 22px 0 0',
              padding:       '28px 24px 40px',
              border:        '1px solid rgba(255,255,255,0.06)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontFamily:   'var(--f-display)',
              fontStyle:    'italic',
              fontSize:     '22px',
              color:        'rgba(255,255,255,0.92)',
              marginBottom: '8px',
            }}>
              Remove experience log?
            </div>
            <div style={{
              fontFamily:   'var(--f-body)',
              fontSize:     '14px',
              fontWeight:   300,
              color:        'rgba(255,255,255,0.45)',
              marginBottom: '28px',
              lineHeight:   1.6,
            }}>
              This moves {rec.title} back to saved and clears your reaction.
            </div>
            <button
              onClick={handleRemove}
              disabled={saving}
              style={{
                width:         '100%',
                background:    'rgba(244,63,94,0.10)',
                border:        '1px solid rgba(244,63,94,0.30)',
                color:         '#f43f5e',
                fontFamily:    'var(--f-ui)',
                fontWeight:    700,
                fontSize:      '12px',
                letterSpacing: '1.5px',
                padding:       '14px',
                borderRadius:  '13px',
                cursor:        'pointer',
                marginBottom:  '10px',
                textTransform: 'uppercase',
              }}
            >
              Yes, remove
            </button>
            <button
              onClick={() => setShowRemove(false)}
              style={{
                width:         '100%',
                background:    'transparent',
                border:        'none',
                color:         'rgba(255,255,255,0.35)',
                fontFamily:    'var(--f-ui)',
                fontSize:      '11px',
                letterSpacing: '1px',
                padding:       '10px',
                cursor:        'pointer',
                textTransform: 'uppercase',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation sheet */}
      {showDelete && (
        <div
          style={{
            position:   'fixed', inset: 0,
            background: 'rgba(0,0,0,0.90)',
            display:    'flex', alignItems: 'flex-end',
            zIndex:     100,
          }}
          onClick={() => !deleting && setShowDelete(false)}
        >
          <div
            style={{
              width:         '100%',
              maxWidth:      '430px',
              margin:        '0 auto',
              background:    '#161616',
              borderRadius:  '22px 22px 0 0',
              padding:       '28px 24px 40px',
              border:        '1px solid rgba(255,255,255,0.06)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.14)' }} />
            </div>
            <div style={{
              fontFamily:   'var(--f-display)',
              fontStyle:    'italic',
              fontSize:     '22px',
              color:        'rgba(255,255,255,0.92)',
              marginBottom: '8px',
            }}>
              Delete this card?
            </div>
            <div style={{
              fontFamily:   'var(--f-body)',
              fontSize:     '14px',
              fontWeight:   300,
              color:        'rgba(255,255,255,0.42)',
              marginBottom: '28px',
              lineHeight:   1.6,
            }}>
              {rec.title} will be permanently removed from your vault. This cannot be undone.
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                width:         '100%',
                background:    'rgba(244,63,94,0.12)',
                border:        '1px solid rgba(244,63,94,0.35)',
                color:         '#f43f5e',
                fontFamily:    'var(--f-ui)',
                fontWeight:    700,
                fontSize:      '12px',
                letterSpacing: '1.5px',
                padding:       '15px',
                borderRadius:  '13px',
                cursor:        deleting ? 'not-allowed' : 'pointer',
                marginBottom:  '10px',
                textTransform: 'uppercase',
                transition:    'all 160ms ease',
              }}
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setShowDelete(false)}
              disabled={deleting}
              style={{
                width:         '100%',
                background:    'transparent',
                border:        'none',
                color:         'rgba(255,255,255,0.32)',
                fontFamily:    'var(--f-ui)',
                fontSize:      '11px',
                letterSpacing: '1px',
                padding:       '10px',
                cursor:        'pointer',
                textTransform: 'uppercase',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
