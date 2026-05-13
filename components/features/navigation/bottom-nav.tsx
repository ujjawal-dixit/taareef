// components/features/navigation/bottom-nav.tsx
// Fixed bottom navigation + FAB.
// All styles inline — no dependency on Tailwind custom tokens.
// FAB shows only on vault screens.

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type BottomNavProps = {
  onCaptureTap: () => void
}

export function BottomNav({ onCaptureTap }: BottomNavProps) {
  const pathname = usePathname()

  if (pathname.startsWith('/onboarding')) return null

  const isVaultScreen =
    pathname === '/dashboard' ||
    pathname.startsWith('/rec/')

  return (
    <>
      {/* Nav bar */}
      <nav
        aria-label="Main navigation"
        className="bottom-nav"
      >
        <NavItem
          href="/dashboard"
          label="Vault"
          isActive={pathname === '/dashboard'}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          }
        />

        {/* Centre spacer for FAB */}
        <div style={{ width: '56px' }} aria-hidden="true" />

        <NavItem
          href="/dashboard"
          label="Profile"
          isActive={false}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          }
        />
      </nav>

      {/* FAB */}
      {isVaultScreen && (
        <button
          onClick={onCaptureTap}
          aria-label="Save a recommendation"
          className="fab"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </>
  )
}

type NavItemProps = {
  href:     string
  label:    string
  isActive: boolean
  icon:     React.ReactNode
}

function NavItem({ href, label, isActive, icon }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '3px',
        minWidth:       '44px',
        minHeight:      '44px',
        justifyContent: 'center',
        color:          isActive ? '#c44a28' : '#b0a396',
        textDecoration: 'none',
        transition:     'color 150ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
      <span style={{
        fontSize:      '10px',
        fontWeight:    '600',
        fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
        letterSpacing: '0.03em',
      }}>
        {label}
      </span>
    </Link>
  )
}
