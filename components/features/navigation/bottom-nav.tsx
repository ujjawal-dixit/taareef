'use client'

// components/features/navigation/bottom-nav.tsx
// Fixed bottom nav. FAB centred above it.
// FAB: dark green fill, neon border, neon plus stroke.
// Same neon as brand name — Von Restorff: two elements, one identity.
// Circle + plus. Always. Non-negotiable.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type BottomNavProps = {
  onFabTap: () => void
}

export function BottomNav({ onFabTap }: BottomNavProps) {
  const pathname = usePathname()

  const isVault   = pathname === '/dashboard' || pathname.startsWith('/rec/')
  const isProfile = pathname.startsWith('/profile')

  return (
    <>
      {/* Navigation bar */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {/* Vault */}
        <Link
          href="/dashboard"
          className={`nav-btn${isVault ? ' active' : ''}`}
          aria-label="Vault"
          aria-current={isVault ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.2"/>
            <rect x="14" y="3" width="7" height="7" rx="1.2"/>
            <rect x="3" y="14" width="7" height="7" rx="1.2"/>
            <rect x="14" y="14" width="7" height="7" rx="1.2"/>
          </svg>
          <span className="nav-label">Vault</span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={`nav-btn${isProfile ? ' active' : ''}`}
          aria-label="Profile"
          aria-current={isProfile ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span className="nav-label">Profile</span>
        </Link>
      </nav>

      {/* FAB — circle + plus, centred above nav */}
      {/* Dark green fill, neon border, neon plus — matches brand name */}
      {isVault && (
        <button
          className="fab"
          onClick={onFabTap}
          aria-label="Save a recommendation"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      )}
    </>
  )
}
