'use client'

// app/page.tsx
// Logged-out → landing. Logged-in → middleware sends to /dashboard before this renders.

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function LandingPage() {
  const illustrationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = illustrationRef.current
    if (!el) return
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8
      const y = (e.clientY / window.innerHeight - 0.5) * 8
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <main style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', overflowX: 'hidden' }}>
      <header style={{ width: '100%', maxWidth: 390, paddingTop: 'clamp(28px, 6dvh, 56px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 1.8dvh, 18px)' }}>
        <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(3.5rem, 2.1rem + 7vw, 5.25rem)', color: '#1fce94', letterSpacing: '-0.01em', textShadow: '0 0 24px rgba(31,206,148,0.55), 0 0 64px rgba(31,206,148,0.28), 0 0 120px rgba(31,206,148,0.12)' }}>
          taareef
        </span>
        <h1 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(1.75rem, 1.1rem + 3.2vw, 2.375rem)', lineHeight: 1.18, color: '#F4F3EE', margin: 0, letterSpacing: '-0.01em', textAlign: 'center', textWrap: 'balance' }}>
          Your recommendation journal.
        </h1>
      </header>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(20px, 4dvh, 40px)', paddingTop: 'clamp(12px, 2dvh, 24px)', paddingBottom: 'clamp(12px, 2dvh, 24px)', width: '100%', maxWidth: 390 }}>
        <div ref={illustrationRef} style={{ transition: 'transform 0.12s ease-out', willChange: 'transform' }} aria-hidden="true">
          <ShelfIllustration />
        </div>
        <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(1.125rem, 0.85rem + 1.4vw, 1.375rem)', color: 'rgba(244,243,238,0.60)', margin: 0, lineHeight: 1.3, textAlign: 'center', letterSpacing: '-0.005em' }}>
          Save what you trust.<br />Share what you love.
        </p>
      </section>

      <footer style={{ width: '100%', maxWidth: 390, paddingBottom: 'clamp(24px, 5dvh, 48px)', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1dvh, 12px)' }}>
        <Link href="/onboarding/demo" style={{ display: 'block', width: '100%', padding: '15px 0', background: '#1fce94', borderRadius: 12, textAlign: 'center', fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', textDecoration: 'none' }}>
          Check it out
        </Link>
        <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', minHeight: 48, textAlign: 'center', textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'rgba(244,243,238,0.55)' }}>Already have an account?</span>
          <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1fce94' }}>Sign in</span>
        </Link>
      </footer>
    </main>
  )
}

function ShelfIllustration() {
  // Rebuilt again, Session 15 (2026-07-28), after the first attempt read
  // as clipart. Three things were wrong and are fixed here:
  //
  // 1. THE GLOW WAS A STAIN. A radial gradient behind the objects looked
  //    like a brown smudge, not light. Removed entirely. Light direction
  //    is now implied by stroke opacity — brighter on upper-left edges,
  //    dimmer on lower-right — which is how illustrators actually do it.
  //
  // 2. EVERYTHING WAS THE SAME HEIGHT, evenly spaced, in a straight row.
  //    That is an icon set, not a shelf. Heights now vary substantially
  //    and objects overlap slightly, which is what creates depth.
  //
  // 3. NO INTERIOR DETAIL. Each object is now built in three tiers:
  //    silhouette (reads at 100px), primary detail (reads at 200px),
  //    texture (rewards a closer look) — pages in the book, a film strip
  //    curling off the reel, contour lines and a route on the map, the
  //    liquid line in the glass, the cable on the headphones.
  //
  // Colour still maps to category: book = Read amber, reel = Watch
  // cobalt, map = Visit sky, glass = Dine burnt orange, headphones =
  // Listen rose. Nobody notices consciously; the dashboard simply feels
  // already familiar.
  return (
    <svg
      viewBox="0 0 340 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: 'min(92vw, 360px)', height: 'auto' }}
    >
      <defs>
        <linearGradient id="shelfEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#F4F3EE" stopOpacity="0" />
          <stop offset="18%"  stopColor="#F4F3EE" stopOpacity="0.16" />
          <stop offset="82%"  stopColor="#F4F3EE" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#F4F3EE" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── BOOK — Read, amber. Tallest object, anchors the left. ── */}
      <g>
        <ellipse cx="46" cy="192" rx="27" ry="4" fill="#F09114" fillOpacity="0.10" />
        {/* spine block */}
        <path d="M30 62 L52 56 L52 188 L30 188 Z" fill="#F09114" fillOpacity="0.13"
              stroke="#F09114" strokeWidth="2.3" strokeLinejoin="round" />
        {/* page block — the detail that makes it a book, not a rectangle */}
        <path d="M52 56 L64 60 L64 184 L52 188 Z" fill="#F09114" fillOpacity="0.05"
              stroke="#F09114" strokeWidth="1.7" strokeOpacity="0.6" strokeLinejoin="round" />
        <line x1="55" y1="66"  x2="61" y2="68"  stroke="#F09114" strokeWidth="0.9" strokeOpacity="0.4" />
        <line x1="55" y1="76"  x2="61" y2="78"  stroke="#F09114" strokeWidth="0.9" strokeOpacity="0.4" />
        <line x1="55" y1="86"  x2="61" y2="88"  stroke="#F09114" strokeWidth="0.9" strokeOpacity="0.4" />
        {/* title bands on the spine */}
        <line x1="35" y1="84"  x2="47" y2="81"  stroke="#F09114" strokeWidth="1.3" strokeOpacity="0.85" />
        <line x1="35" y1="93"  x2="44" y2="91"  stroke="#F09114" strokeWidth="1.3" strokeOpacity="0.6" />
        <rect x="35" y="150" width="12" height="16" rx="1"
              stroke="#F09114" strokeWidth="1.1" strokeOpacity="0.5" />
      </g>

      {/* ── FILM REEL — Watch, cobalt. Overlaps the book slightly. ── */}
      <g>
        <ellipse cx="106" cy="192" rx="33" ry="4.5" fill="#3C82FF" fillOpacity="0.10" />
        {/* strip curling away — the tier-3 detail */}
        <path d="M132 150 C150 144 154 162 144 172 C136 180 122 178 118 170"
              fill="none" stroke="#3C82FF" strokeWidth="1.4" strokeOpacity="0.45" />
        <path d="M134 152 C149 147 152 161 144 169" fill="none"
              stroke="#3C82FF" strokeWidth="0.9" strokeOpacity="0.28" />
        <circle cx="106" cy="152" r="37" fill="#3C82FF" fillOpacity="0.09"
                stroke="#3C82FF" strokeWidth="2.3" />
        <circle cx="106" cy="152" r="30" stroke="#3C82FF" strokeWidth="0.9" strokeOpacity="0.35" />
        <circle cx="106" cy="152" r="8.5" fill="#0a0a0a" stroke="#3C82FF" strokeWidth="1.7" />
        {/* spokes, lit from upper-left */}
        <circle cx="106" cy="131" r="6.2" fill="#0a0a0a" stroke="#3C82FF" strokeWidth="1.5" strokeOpacity="0.95" />
        <circle cx="126" cy="145" r="6.2" fill="#0a0a0a" stroke="#3C82FF" strokeWidth="1.5" strokeOpacity="0.7" />
        <circle cx="118" cy="169" r="6.2" fill="#0a0a0a" stroke="#3C82FF" strokeWidth="1.5" strokeOpacity="0.55" />
        <circle cx="94"  cy="169" r="6.2" fill="#0a0a0a" stroke="#3C82FF" strokeWidth="1.5" strokeOpacity="0.6" />
        <circle cx="86"  cy="145" r="6.2" fill="#0a0a0a" stroke="#3C82FF" strokeWidth="1.5" strokeOpacity="0.85" />
      </g>

      {/* ── MAP — Visit, sky. Lowest object; creates the dip. ── */}
      <g>
        <ellipse cx="188" cy="192" rx="38" ry="4" fill="#1991E1" fillOpacity="0.09" />
        <path d="M154 140 L176 132 L200 140 L222 132 L222 184 L200 192 L176 184 L154 192 Z"
              fill="#1991E1" fillOpacity="0.08" stroke="#1991E1" strokeWidth="2.3" strokeLinejoin="round" />
        <path d="M176 132 L176 184" stroke="#1991E1" strokeWidth="1.5" strokeOpacity="0.75" />
        <path d="M200 140 L200 192" stroke="#1991E1" strokeWidth="1.5" strokeOpacity="0.55" />
        {/* contour lines */}
        <path d="M158 168 Q168 162 174 166" fill="none" stroke="#1991E1" strokeWidth="0.8" strokeOpacity="0.32" />
        <path d="M204 158 Q212 152 219 156" fill="none" stroke="#1991E1" strokeWidth="0.8" strokeOpacity="0.32" />
        {/* the route and its destination */}
        <path d="M162 178 Q182 158 206 150" fill="none" stroke="#1991E1" strokeWidth="1.5"
              strokeOpacity="0.9" strokeDasharray="4 4" strokeLinecap="round" />
        <circle cx="206" cy="150" r="3.6" fill="#1991E1" fillOpacity="0.95" />
        <circle cx="206" cy="150" r="7"   stroke="#1991E1" strokeWidth="1" strokeOpacity="0.4" />
      </g>

      {/* ── WINE GLASS — Dine, burnt orange. Tall, slim, breaks the line. ── */}
      <g>
        <ellipse cx="256" cy="192" rx="20" ry="3.5" fill="#DA5526" fillOpacity="0.10" />
        <path d="M239 76 L273 76 L266 118 Q256 130 246 118 Z"
              fill="#DA5526" fillOpacity="0.10" stroke="#DA5526" strokeWidth="2.3" strokeLinejoin="round" />
        {/* liquid line — tier 3 */}
        <path d="M243.4 96 L268.6 96 L266 118 Q256 130 246 118 Z"
              fill="#DA5526" fillOpacity="0.20" stroke="#DA5526" strokeWidth="1.2" strokeOpacity="0.7" />
        <path d="M241 84 L271 84" stroke="#DA5526" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="256" y1="127" x2="256" y2="186" stroke="#DA5526" strokeWidth="2.3" strokeLinecap="round" />
        <path d="M242 188 Q256 183 270 188" fill="none" stroke="#DA5526" strokeWidth="2.3" strokeLinecap="round" />
      </g>

      {/* ── HEADPHONES — Listen, rose. Low and wide, closes the row. ── */}
      <g>
        <ellipse cx="303" cy="192" rx="24" ry="3.5" fill="#DC3C82" fillOpacity="0.09" />
        <path d="M281 162 A23 23 0 0 1 327 162" fill="none" stroke="#DC3C82"
              strokeWidth="2.3" strokeLinecap="round" />
        <path d="M284 162 A20 20 0 0 1 324 162" fill="none" stroke="#DC3C82"
              strokeWidth="0.9" strokeOpacity="0.35" strokeLinecap="round" />
        <rect x="274" y="158" width="14" height="28" rx="7"
              fill="#DC3C82" fillOpacity="0.17" stroke="#DC3C82" strokeWidth="2" />
        <rect x="320" y="158" width="14" height="28" rx="7"
              fill="#DC3C82" fillOpacity="0.12" stroke="#DC3C82" strokeWidth="2" strokeOpacity="0.75" />
        <line x1="281" y1="165" x2="281" y2="179" stroke="#DC3C82" strokeWidth="1.1" strokeOpacity="0.6" />
        {/* cable */}
        <path d="M327 184 Q333 196 326 202" fill="none" stroke="#DC3C82"
              strokeWidth="1.3" strokeOpacity="0.4" strokeLinecap="round" />
      </g>

      {/* Shelf edge — a line, not a surface. Grounds without describing. */}
      <line x1="18" y1="196" x2="322" y2="196" stroke="url(#shelfEdge)" strokeWidth="1.1" />
    </svg>
  )
}
