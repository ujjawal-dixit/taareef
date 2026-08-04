'use client'

// components/features/navigation/app-frame.tsx
//
// The centred container every signed-in screen sits inside.
//
// WHY THIS EXISTS (Session 15, 2026-07-29):
// The same container chrome was written four times, and had drifted:
//
//   dashboard / category  430px cap · 100dvh · #111111 · nav
//   card detail           no cap    · 100vh  · #111111 · no nav
//   edit                  inner cap · 100dvh · #111111 · no nav
//   profile               nothing at all
//
// So on any viewport wider than 430px the dashboard was a centred
// column while the card detail sprawled edge to edge — an unexplained
// inconsistency, which T1 treats as a defect rather than a style.
//
// One frame, defined once, applied by the layout.
//
// WHY THE NAV IS ROUTE-DRIVEN RATHER THAN A PROP:
// "Does this screen have a nav?" is a property of the route, not of the
// component tree. Deciding it in one place means the frame's bottom
// padding can never disagree with whether a nav is actually present —
// the two were previously set independently and could drift.

import { usePathname } from 'next/navigation'
import { BottomNav }   from './bottom-nav'
import { useSave }     from './app-providers'
import type { ReactNode } from 'react'

/** Width of the centred column. Single source of truth. */
export const FRAME_MAX_WIDTH = '430px'

/**
 * Routes that show the bottom navigation.
 *
 * Deliberately matches today's behaviour exactly: the dashboard and the
 * category lists. Card detail, edit and profile have never shown a nav.
 *
 * Note that bottom-nav.tsx already computes `isVault` for `/rec/`
 * routes, which suggests the nav was originally intended to appear
 * there too. Extending it is a visual change to three screens, so it is
 * a decision to make deliberately rather than a side effect of this
 * refactor.
 */
function routeHasNav(pathname: string): boolean {
  if (pathname === '/dashboard') return true
  return /^\/dashboard\/[^/]+$/.test(pathname)
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname       = usePathname()
  const { openCapture } = useSave()
  const withNav        = routeHasNav(pathname)

  return (
    <div style={{
      maxWidth:   FRAME_MAX_WIDTH,
      margin:     '0 auto',
      minHeight:  '100dvh',
      background: '#111111',
      position:   'relative',
      overflowX:  'hidden',
    }}>
      <main style={{
        // Only reserve space for the nav on routes that actually have
        // one. Previously this padding was applied by AppShell whether
        // or not a nav followed it.
        paddingBottom: withNav
          ? 'calc(64px + 48px + env(safe-area-inset-bottom, 0px))'
          : 'env(safe-area-inset-bottom, 0px)',
      }}>
        {children}
      </main>

      {withNav && <BottomNav onFabTap={openCapture} />}
    </div>
  )
}
