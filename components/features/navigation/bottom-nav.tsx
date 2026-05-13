// components/features/navigation/bottom-nav.tsx
// Fixed bottom navigation with FAB.
// Context-sensitive — FAB only visible on vault screens.
// Settings route not yet built — nav has two items only for now.

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type BottomNavProps = {
  onCaptureTap: () => void
}

export function BottomNav({ onCaptureTap }: BottomNavProps) {
  const pathname = usePathname()

  // Never show nav during onboarding
  if (pathname.startsWith('/onboarding')) return null

  const isVaultScreen = pathname === '/dashboard' || pathname.startsWith('/rec/')

  return (
    <>
      {/* Bottom bar */}
      <nav
        aria-label="Main navigation"
        className={[
          'fixed bottom-0 left-0 right-0 z-30',
          'max-w-[480px] mx-auto',
          'bg-surface-card/90 backdrop-blur-md',
          'border-t border-surface-border shadow-nav',
          'h-16 flex items-center justify-around px-8',
          'pb-safe',
        ].join(' ')}
      >
        {/* Vault */}
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

        {/* Centre spacer — FAB sits here */}
        <div className="w-14" aria-hidden="true" />

        {/* Profile — placeholder until settings page exists */}
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

      {/* FAB — only on vault screens */}
      {isVaultScreen && (
        <button
          onClick={onCaptureTap}
          aria-label="Save a recommendation"
          className={[
            'fixed z-40 bottom-10',
            'left-1/2 -translate-x-1/2',
            'w-14 h-14 rounded-full',
            'bg-primary-500 text-white',
            'flex items-center justify-center',
            'shadow-fab',
            'transition-transform duration-150',
            'active:scale-95 hover:bg-primary-600',
            'no-tap-highlight gpu',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          ].join(' ')}
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
  href: string
  label: string
  isActive: boolean
  icon: React.ReactNode
}

function NavItem({ href, label, isActive, icon }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex flex-col items-center gap-1',
        'min-w-11 min-h-11 justify-center',
        'transition-colors duration-150 no-tap-highlight',
        isActive
          ? 'text-primary-500'
          : 'text-neutral-400 hover:text-neutral-600',
      ].join(' ')}
    >
      {icon}
      <span className="text-[10px] font-sans font-semibold tracking-wide">
        {label}
      </span>
    </Link>
  )
}
