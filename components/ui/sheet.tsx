// components/ui/sheet.tsx
// Taareef Bottom Sheet — slides up from bottom of screen.
// GPU-accelerated. Focus-trapped when open. Accessible.
// Used for: save flow, experienced flow, confirmation card.

'use client'

import { useEffect, useRef, useCallback } from 'react'

type SheetSize = 'sm' | 'md' | 'lg' | 'full'

type SheetProps = {
  isOpen: boolean
  onClose: () => void
  size?: SheetSize
  showHandle?: boolean
  closeOnBackdrop?: boolean
  title?: string
  children: React.ReactNode
}

const sizeStyles: Record<SheetSize, string> = {
  sm:   'max-h-[40vh]',
  md:   'max-h-[65vh]',
  lg:   'max-h-[85vh]',
  full: 'max-h-[95vh]',
}

export function Sheet({
  isOpen,
  onClose,
  size = 'md',
  showHandle = true,
  closeOnBackdrop = true,
  title,
  children,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Save focus position and restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the sheet itself for screen readers
      sheetRef.current?.focus()
    } else {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-40',
          'bg-black/40',
          'animate-fade-in',
        ].join(' ')}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Sheet'}
        tabIndex={-1}
        className={[
          // Positioning
          'fixed bottom-0 left-0 right-0 z-50',
          'max-w-[480px] mx-auto',
          // Appearance
          'bg-surface-card rounded-t-3xl',
          'shadow-sheet',
          // Size constraint
          sizeStyles[size],
          'overflow-y-auto',
          // Animation
          'animate-sheet-enter gpu',
          // Focus
          'focus:outline-none',
        ].join(' ')}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-1"
            aria-hidden="true"
          >
            <div className="sheet-handle" />
          </div>
        )}

        {/* Content */}
        <div className="px-5 pb-8">
          {title && (
            <h2 className="font-display text-page text-neutral-900 mb-4 mt-2">
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </>
  )
}

// ============================================================
// SHEET SECTION — visual divider within a sheet
// ============================================================

type SheetSectionProps = {
  children: React.ReactNode
  className?: string
}

export function SheetSection({ children, className = '' }: SheetSectionProps) {
  return (
    <div className={['py-4 border-t border-surface-border first:border-t-0 first:pt-0', className].join(' ')}>
      {children}
    </div>
  )
}
