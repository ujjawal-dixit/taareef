'use client'

// app/page.tsx
// Route: /
// Logged-out visitors → this landing page.
// Logged-in users → middleware redirects to /dashboard before this renders.

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function LandingPage() {
  const illustrationRef = useRef<HTMLDivElement>(null)

  // Subtle parallax on the illustration as user scrolls / moves
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
    <main
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        overflowX: 'hidden',
      }}
    >
      {/* Top wordmark */}
      <header
        style={{
          width: '100%',
          maxWidth: 390,
          paddingTop: 52,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 18,
            color: '#1fce94',
            letterSpacing: '0.01em',
          }}
        >
          taareef
        </span>
      </header>

      {/* Centre — illustration + headline */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          paddingTop: 24,
          paddingBottom: 24,
          width: '100%',
          maxWidth: 390,
        }}
      >
        {/* Illustration — folk-art shelf scene as SVG */}
        <div
          ref={illustrationRef}
          style={{ transition: 'transform 0.12s ease-out', willChange: 'transform' }}
          aria-hidden="true"
        >
          <ShelfIllustration />
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--f-display)',
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 32,
              lineHeight: 1.15,
              color: '#F4F3EE',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Every recommendation
            <br />
            you&rsquo;ll ever get.
            <br />
            One place.
          </h1>
          <p
            style={{
              fontFamily: 'var(--f-body)',
              fontSize: 14,
              color: 'rgba(244,243,238,0.45)',
              marginTop: 14,
              lineHeight: 1.55,
            }}
          >
            From friends. From newsletters. From that DM
            <br />
            you&rsquo;ll definitely forget about tomorrow.
          </p>
        </div>
      </section>

      {/* Bottom — CTAs */}
      <footer
        style={{
          width: '100%',
          maxWidth: 390,
          paddingBottom: 48,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Link
          href="/onboarding/demo"
          style={{
            display: 'block',
            width: '100%',
            padding: '15px 0',
            background: '#1fce94',
            borderRadius: 12,
            textAlign: 'center',
            fontFamily: 'var(--f-ui)',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#0a0a0a',
            textDecoration: 'none',
          }}
        >
          See how it works
        </Link>

        <Link
          href="/login"
          style={{
            display: 'block',
            width: '100%',
            padding: '15px 0',
            textAlign: 'center',
            fontFamily: 'var(--f-body)',
            fontSize: 14,
            color: 'rgba(244,243,238,0.40)',
            textDecoration: 'none',
          }}
        >
          Already have an account? Sign in
        </Link>
      </footer>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shelf illustration — folk-art inspired SVG
// Objects: a book spine, film reel, folded map, wine glass, headphones
// Palette: terracotta, sage, gold, cream — warm and hand-drawn in feel
// ─────────────────────────────────────────────────────────────────────────────
function ShelfIllustration() {
  return (
    <svg
      width="280"
      height="220"
      viewBox="0 0 280 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Ambient glow behind objects */}
      <ellipse cx="140" cy="160" rx="120" ry="40" fill="rgba(31,206,148,0.04)" />

      {/* Shelf surface */}
      <rect x="20" y="168" width="240" height="6" rx="3" fill="#1e1e1c" />
      <rect x="20" y="174" width="240" height="2" rx="1" fill="rgba(255,255,255,0.04)" />

      {/* ── Book spine (left) ── */}
      <rect x="38" y="110" width="22" height="58" rx="3" fill="#C4603A" />
      <rect x="40" y="112" width="18" height="54" rx="2" fill="#D4724A" />
      {/* spine lines */}
      <line x1="42" y1="122" x2="56" y2="122" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="42" y1="126" x2="56" y2="126" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
      <line x1="42" y1="130" x2="56" y2="130" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
      {/* Madhubani-style dot motif on book */}
      <circle cx="49" cy="148" r="4" fill="rgba(255,255,255,0.12)" />
      <circle cx="49" cy="148" r="2" fill="rgba(255,255,255,0.20)" />
      <circle cx="49" cy="148" r="0.8" fill="rgba(255,255,255,0.35)" />

      {/* ── Film reel (centre-left) ── */}
      <circle cx="95" cy="138" r="26" fill="#1a1a18" stroke="#2e2e2a" strokeWidth="1.5" />
      <circle cx="95" cy="138" r="20" fill="none" stroke="#3C82FF" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="95" cy="138" r="8" fill="#0a0a0a" stroke="#3C82FF" strokeWidth="1.5" strokeOpacity="0.7" />
      <circle cx="95" cy="138" r="3" fill="#3C82FF" fillOpacity="0.6" />
      {/* Warli-style spokes */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const r = Math.PI * deg / 180
        const x1 = 95 + Math.cos(r) * 9
        const y1 = 138 + Math.sin(r) * 9
        const x2 = 95 + Math.cos(r) * 18
        const y2 = 138 + Math.sin(r) * 18
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#3C82FF"
            strokeWidth="1.2"
            strokeOpacity="0.45"
          />
        )
      })}
      {/* Sprocket holes */}
      {[30, 90, 150, 210, 270, 330].map((deg, i) => {
        const r = Math.PI * deg / 180
        const cx = 95 + Math.cos(r) * 14
        const cy = 138 + Math.sin(r) * 14
        return <circle key={i} cx={cx} cy={cy} r="1.8" fill="#3C82FF" fillOpacity="0.3" />
      })}

      {/* ── Folded map (centre) ── */}
      <g transform="translate(128, 118) rotate(-4)">
        <rect width="42" height="50" rx="2" fill="#2a2822" />
        <rect x="1" y="1" width="40" height="48" rx="1.5" fill="#1E1C18" />
        {/* map fold lines */}
        <line x1="14" y1="1" x2="14" y2="49" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
        <line x1="28" y1="1" x2="28" y2="49" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
        <line x1="1" y1="17" x2="41" y2="17" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
        <line x1="1" y1="33" x2="41" y2="33" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
        {/* Kalamkari-style map dot */}
        <circle cx="21" cy="25" r="3.5" fill="none" stroke="#1991E1" strokeWidth="1" strokeOpacity="0.6" />
        <circle cx="21" cy="25" r="1.5" fill="#1991E1" fillOpacity="0.5" />
        {/* Route line */}
        <path
          d="M8 40 Q14 30 21 25 Q28 20 34 12"
          stroke="#1991E1"
          strokeWidth="1"
          strokeOpacity="0.35"
          fill="none"
          strokeDasharray="2 2"
        />
      </g>

      {/* ── Wine glass (centre-right) ── */}
      <g transform="translate(185, 105)">
        {/* bowl */}
        <path
          d="M6 0 Q0 18 4 32 Q10 40 16 40 Q22 40 28 32 Q32 18 26 0 Z"
          fill="rgba(220,60,130,0.08)"
          stroke="rgba(220,60,130,0.25)"
          strokeWidth="1"
        />
        {/* wine level */}
        <path
          d="M7 22 Q10 30 16 31 Q22 30 25 22"
          fill="rgba(220,60,130,0.18)"
        />
        {/* stem */}
        <line x1="16" y1="40" x2="16" y2="58" stroke="rgba(220,60,130,0.22)" strokeWidth="1.5" />
        {/* base */}
        <line x1="8" y1="58" x2="24" y2="58" stroke="rgba(220,60,130,0.22)" strokeWidth="2" />
        {/* highlight */}
        <path
          d="M10 6 Q8 14 9 22"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          fill="none"
        />
      </g>

      {/* ── Headphones (right) ── */}
      <g transform="translate(222, 115)">
        {/* arc */}
        <path
          d="M4 30 Q4 5 20 5 Q36 5 36 30"
          stroke="#F09114"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        {/* left ear cup */}
        <rect x="0" y="27" width="8" height="14" rx="4" fill="#F09114" fillOpacity="0.55" />
        {/* right ear cup */}
        <rect x="32" y="27" width="8" height="14" rx="4" fill="#F09114" fillOpacity="0.55" />
        {/* Gond-style dot accent on cups */}
        <circle cx="4" cy="34" r="1.5" fill="rgba(255,255,255,0.3)" />
        <circle cx="36" cy="34" r="1.5" fill="rgba(255,255,255,0.3)" />
      </g>

      {/* Floor shadows */}
      <ellipse cx="49" cy="172" rx="14" ry="3" fill="rgba(0,0,0,0.4)" />
      <ellipse cx="95" cy="172" rx="20" ry="4" fill="rgba(0,0,0,0.35)" />
      <ellipse cx="149" cy="172" rx="18" ry="3.5" fill="rgba(0,0,0,0.3)" />
      <ellipse cx="201" cy="172" rx="10" ry="2.5" fill="rgba(0,0,0,0.3)" />
      <ellipse cx="240" cy="172" rx="16" ry="3" fill="rgba(0,0,0,0.35)" />

      {/* Ambient dust / grain dots */}
      {[
        [30, 90], [70, 75], [110, 65], [155, 58], [200, 70],
        [250, 85], [45, 145], [180, 50], [230, 140],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="0.8"
          fill="rgba(244,243,238,0.08)"
        />
      ))}
    </svg>
  )
}
