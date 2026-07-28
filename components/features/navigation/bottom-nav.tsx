'use client'

// components/features/navigation/bottom-nav.tsx
//
// FAB POSITIONING FIX:
// The FAB was invisible because position:fixed + bottom:76px gets
// clipped by mobile browser chrome (address bar, tab bar).
// 
// Solution: The FAB lives INSIDE the nav bar as a centred element,
// not as a separate fixed element. The nav bar itself is fixed and
// correctly respects safe-area-inset-bottom. The FAB is rendered
// at the nav level, raised above it with a negative top margin.
// This is the pattern used by Instagram, Airbnb, and Linear mobile.

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// One-time tooltip pointing at the FAB.
//
// WHY (Session 15, 2026-07-28): after signing in, someone landed on the
// dashboard with no indication of how to save anything else. The demo
// taught them to save, then the real product offered no next step. This
// is the single piece of hand-holding in the entire app — it appears
// once, for four seconds, and never again.
const TOOLTIP_KEY = 'taareef_fab_tooltip_shown'

const NEON = '#1fce94'

type Props = { onFabTap: () => void }

function useFabTooltip(enabled: boolean) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!enabled) return
    try {
      if (localStorage.getItem(TOOLTIP_KEY)) return
    } catch { return }

    const appear = setTimeout(() => {
      setShow(true)
      try { localStorage.setItem(TOOLTIP_KEY, '1') } catch { /* private mode */ }
    }, 500)
    const vanish = setTimeout(() => setShow(false), 4500)

    return () => { clearTimeout(appear); clearTimeout(vanish) }
  }, [enabled])

  return show
}

export function BottomNav({ onFabTap }: Props) {
  const pathname  = usePathname()
  const isVault   = pathname === '/dashboard' || pathname.startsWith('/rec/')
  const isProfile = pathname.startsWith('/profile')
  const showTip   = useFabTooltip(pathname === '/dashboard')

  return (
    <div
      style={{
        position:             'fixed',
        bottom:               0,
        left:                 '50%',
        transform:            'translateX(-50%)',
        width:                '100%',
        maxWidth:             '430px',
        zIndex:               100,
        // The container holds both the FAB (above) and nav bar (below)
        display:              'flex',
        flexDirection:        'column',
        alignItems:           'center',
      }}
    >
      {/* ── FAB ─────────────────────────────────────────────────
          Rendered here, above the nav bar.
          Negative margin pulls the nav bar up to overlap slightly,
          creating the "floating above nav" effect.
          This approach is immune to mobile browser chrome issues
          because the FAB moves with the fixed nav container.
      ──────────────────────────────────────────────────────── */}
      {isVault && showTip && (
        <div
          role="status"
          style={{
            position:      'absolute',
            bottom:        '100%',
            left:          '50%',
            transform:     'translateX(-50%)',
            marginBottom:  '12px',
            padding:       '10px 15px',
            borderRadius:  '12px',
            background:    'rgba(20,24,22,0.97)',
            border:        `0.5px solid ${NEON}44`,
            boxShadow:     '0 8px 28px rgba(0,0,0,0.55)',
            fontFamily:    'var(--f-body)',
            fontSize:      '13px',
            lineHeight:    1.45,
            color:         'rgba(244,243,238,0.88)',
            whiteSpace:    'nowrap',
            pointerEvents: 'none',
            animation:     'taareefTipIn 220ms ease-out',
            zIndex:        60,
          }}
        >
          Tap <span style={{ color: NEON, fontWeight: 700 }}>+</span> any time to save something
          <span
            style={{
              position:   'absolute',
              top:        '100%',
              left:       '50%',
              width:      0,
              height:     0,
              marginLeft: '-6px',
              borderLeft:  '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop:   `6px solid rgba(20,24,22,0.97)`,
            }}
          />
        </div>
      )}

      {isVault && (
        <button
          onClick={onFabTap}
          data-fab="true"
          aria-label="Save a recommendation"
          style={{
            width:                   '64px',
            height:                  '64px',
            borderRadius:            '50%',
            background:              'radial-gradient(circle at 38% 32%, #0f3826 0%, #0a2018 55%, #071510 100%)',
            border:                  `1.5px solid ${NEON}55`,
            display:                 'flex',
            alignItems:              'center',
            justifyContent:          'center',
            cursor:                  'pointer',
            WebkitTapHighlightColor: 'transparent',
            marginBottom:            '-20px', // overlaps the nav bar top edge
            position:                'relative',
            zIndex:                  101,
            flexShrink:              0,
            // Neon heartbeat — breathing, not frantic
            animation:               'fabPulse 3.2s ease-in-out infinite',
            boxShadow:               `0 0 0 0 rgba(31,206,148,0), 0 6px 28px rgba(31,206,148,0.38)`,
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke={NEON}
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="12" y1="4" x2="12" y2="20"/>
            <line x1="4"  y1="12" x2="20" y2="12"/>
          </svg>
        </button>
      )}

      {/* ── NAV BAR ─────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        style={{
          width:                '100%',
          height:               '64px',
          background:           'rgba(8,15,10,0.97)',
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop:            '0.5px solid rgba(240,230,200,0.07)',
          display:              'flex',
          alignItems:           'center',
          justifyContent:       'space-between',
          padding:              `0 52px env(safe-area-inset-bottom, 16px)`,
        }}
      >
        <NavBtn
          href="/dashboard"
          label="Vault"
          isActive={isVault}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <rect x="3"  y="3"  width="7" height="7" rx="1.2"/>
              <rect x="14" y="3"  width="7" height="7" rx="1.2"/>
              <rect x="3"  y="14" width="7" height="7" rx="1.2"/>
              <rect x="14" y="14" width="7" height="7" rx="1.2"/>
            </svg>
          }
        />

        {/* Centre spacer so nav items sit left and right of FAB */}
        <div style={{ width: '64px' }} aria-hidden="true" />

        <NavBtn
          href="/profile"
          label="Profile"
          isActive={isProfile}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          }
        />
      </nav>

      <style>{`
        @keyframes fabPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(31,206,148,0), 0 6px 28px rgba(31,206,148,0.38); }
          50%      { box-shadow: 0 0 0 8px rgba(31,206,148,0.07), 0 8px 36px rgba(31,206,148,0.58); }
        }
      `}</style>
    </div>
  )
}

type NavBtnProps = {
  href:     string
  label:    string
  isActive: boolean
  icon:     React.ReactNode
}

function NavBtn({ href, label, isActive, icon }: NavBtnProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display:                 'flex',
        flexDirection:           'column',
        alignItems:              'center',
        gap:                     '3px',
        color:                   isActive ? NEON : 'rgba(240,230,200,0.32)',
        textDecoration:          'none',
        minWidth:                '44px',
        minHeight:               '44px',
        justifyContent:          'center',
        WebkitTapHighlightColor: 'transparent',
        transition:              'color 160ms ease',
      }}
    >
      {icon}
      <span style={{
        fontFamily:    'var(--f-ui)',
        fontSize:      '9px',
        fontWeight:    700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </Link>
  )
}
