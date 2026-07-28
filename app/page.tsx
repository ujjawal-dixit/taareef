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
  // Rebuilt Session 15 (2026-07-28).
  //
  // Every object carries its category's own colour, so the shelf quietly
  // teaches the palette before the dashboard is ever seen: book = Read
  // amber, reel = Watch cobalt, map = Visit sky, glass = Dine burnt
  // orange, headphones = Listen rose. Nobody notices consciously; the
  // dashboard simply feels already familiar.
  //
  // Depth comes from contrast, not shadow — the brief is minimalism as a
  // deliberate choice, so strokes are confident and saturated against
  // pure black rather than softly lit.
  //
  // Stroke hierarchy is the difference between drawing and clipart:
  // outer contours 2.4px, interior detail 1.1px. Fills sit low so the
  // line does the work.
  //
  // Sized to be read at 320px wide, not scaled down from desktop.
  return (
    <svg
      viewBox="0 0 340 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: 'min(88vw, 340px)', height: 'auto' }}
    >
      <defs>
        <radialGradient id="shelfGlow" cx="38%" cy="34%" r="72%">
          <stop offset="0%"   stopColor="#F09114" stopOpacity="0.13" />
          <stop offset="55%"  stopColor="#DA5526" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shelfLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#F4F3EE" stopOpacity="0.02" />
          <stop offset="50%"  stopColor="#F4F3EE" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F4F3EE" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <ellipse cx="150" cy="112" rx="185" ry="128" fill="url(#shelfGlow)" />

      {/* BOOK — Read, amber */}
      <g>
        <ellipse cx="44" cy="196" rx="26" ry="4.5" fill="#F09114" fillOpacity="0.16" />
        <rect x="28" y="96" width="30" height="98" rx="3"
              fill="#F09114" fillOpacity="0.14" stroke="#F09114" strokeWidth="2.4" />
        <line x1="50" y1="98" x2="50" y2="192" stroke="#F09114" strokeWidth="1.1" strokeOpacity="0.75" />
        <line x1="34" y1="116" x2="45" y2="116" stroke="#F09114" strokeWidth="1.1" strokeOpacity="0.85" />
        <line x1="34" y1="126" x2="45" y2="126" stroke="#F09114" strokeWidth="1.1" strokeOpacity="0.85" />
        <line x1="34" y1="136" x2="41" y2="136" stroke="#F09114" strokeWidth="1.1" strokeOpacity="0.6" />
      </g>

      {/* FILM REEL — Watch, cobalt */}
      <g>
        <ellipse cx="106" cy="196" rx="34" ry="5" fill="#3C82FF" fillOpacity="0.16" />
        <circle cx="106" cy="156" r="36" fill="#3C82FF" fillOpacity="0.11" stroke="#3C82FF" strokeWidth="2.4" />
        <circle cx="106" cy="156" r="9"  fill="#0a0a0a" stroke="#3C82FF" strokeWidth="1.6" />
        <circle cx="106" cy="135" r="6.5" fill="#3C82FF" fillOpacity="0.42" stroke="#3C82FF" strokeWidth="1.1" />
        <circle cx="125" cy="149" r="6.5" fill="#3C82FF" fillOpacity="0.42" stroke="#3C82FF" strokeWidth="1.1" />
        <circle cx="118" cy="172" r="6.5" fill="#3C82FF" fillOpacity="0.42" stroke="#3C82FF" strokeWidth="1.1" />
        <circle cx="94"  cy="172" r="6.5" fill="#3C82FF" fillOpacity="0.42" stroke="#3C82FF" strokeWidth="1.1" />
        <circle cx="87"  cy="149" r="6.5" fill="#3C82FF" fillOpacity="0.42" stroke="#3C82FF" strokeWidth="1.1" />
      </g>

      {/* FOLDED MAP — Visit, sky */}
      <g>
        <ellipse cx="184" cy="196" rx="36" ry="4.5" fill="#1991E1" fillOpacity="0.14" />
        <path d="M152 128 L173 121 L195 128 L216 121 L216 186 L195 193 L173 186 L152 193 Z"
              fill="#1991E1" fillOpacity="0.10" stroke="#1991E1" strokeWidth="2.4" strokeLinejoin="round" />
        <line x1="173" y1="121" x2="173" y2="186" stroke="#1991E1" strokeWidth="1.1" strokeOpacity="0.7" />
        <line x1="195" y1="128" x2="195" y2="193" stroke="#1991E1" strokeWidth="1.1" strokeOpacity="0.7" />
        <path d="M160 168 Q180 150 209 158" fill="none" stroke="#1991E1" strokeWidth="1.3"
              strokeOpacity="0.85" strokeDasharray="4 4" strokeLinecap="round" />
        <circle cx="209" cy="158" r="3.4" fill="#1991E1" fillOpacity="0.9" />
      </g>

      {/* WINE GLASS — Dine, burnt orange */}
      <g>
        <ellipse cx="253" cy="196" rx="22" ry="4" fill="#DA5526" fillOpacity="0.16" />
        <path d="M236 112 L270 112 L263 146 Q253 156 243 146 Z"
              fill="#DA5526" fillOpacity="0.17" stroke="#DA5526" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M238 121 L268 121" stroke="#DA5526" strokeWidth="1.1" strokeOpacity="0.8" />
        <line x1="253" y1="153" x2="253" y2="188" stroke="#DA5526" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="239" y1="190" x2="267" y2="190" stroke="#DA5526" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* HEADPHONES — Listen, rose */}
      <g>
        <ellipse cx="303" cy="196" rx="24" ry="4" fill="#DC3C82" fillOpacity="0.14" />
        <path d="M282 168 A22 22 0 0 1 324 168" fill="none" stroke="#DC3C82"
              strokeWidth="2.4" strokeLinecap="round" />
        <rect x="276" y="164" width="13" height="26" rx="6.5"
              fill="#DC3C82" fillOpacity="0.20" stroke="#DC3C82" strokeWidth="2" />
        <rect x="317" y="164" width="13" height="26" rx="6.5"
              fill="#DC3C82" fillOpacity="0.20" stroke="#DC3C82" strokeWidth="2" />
        <line x1="282" y1="170" x2="282" y2="184" stroke="#DC3C82" strokeWidth="1.1" strokeOpacity="0.7" />
        <line x1="324" y1="170" x2="324" y2="184" stroke="#DC3C82" strokeWidth="1.1" strokeOpacity="0.7" />
      </g>

      {/* Shelf line — grounds the objects without a literal surface */}
      <line x1="14" y1="200" x2="326" y2="200" stroke="url(#shelfLine)" strokeWidth="1.2" />
    </svg>
  )
}
