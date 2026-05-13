// components/features/capture/radial-capture-screen.tsx
// The capture screen — full screen, three equal options.
// Speak it, Share it, Jot it down.
// They co-exist like colours of the Indian flag — no hierarchy.
// Slides over the vault when the + button is tapped.

'use client'

import { useEffect, useCallback } from 'react'

type CaptureMethod = 'audio' | 'screenshot' | 'manual'

type RadialCaptureScreenProps = {
  isOpen: boolean
  onClose: () => void
  onMethodSelect: (method: CaptureMethod) => void
}

export function RadialCaptureScreen({
  isOpen,
  onClose,
  onMethodSelect,
}: RadialCaptureScreenProps) {

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className={[
        'fixed inset-0 z-50',
        'max-w-[480px] mx-auto',
        'flex flex-col',
        'animate-fade-in gpu',
      ].join(' ')}
      style={{ backgroundColor: 'hsl(35, 25%, 97%)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Save a recommendation"
    >

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-8">
        <div>
          <h1 className="font-display text-page text-neutral-900">
            Save a recommendation
          </h1>
          <p className="font-sans text-meta text-neutral-400 mt-1">
            Choose how you want to capture it
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className={[
            'w-11 h-11 rounded-full',
            'bg-neutral-100 text-neutral-500',
            'flex items-center justify-center',
            'transition-colors duration-150',
            'hover:bg-neutral-200',
            'no-tap-highlight focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-neutral-400',
          ].join(' ')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Three capture options — equal, balanced, no hierarchy */}
      <div className="flex-1 flex flex-col gap-4 px-6 pb-12">

        <CaptureOption
          method="audio"
          icon="🎙"
          label="Speak it"
          description="Tap and say what was recommended and who told you"
          colourHex="hsl(338, 58%, 38%)"
          onClick={() => onMethodSelect('audio')}
          delay={0}
        />

        <CaptureOption
          method="screenshot"
          icon="📸"
          label="Share a screenshot"
          description="Upload a screenshot and we'll read it for you"
          colourHex="hsl(228, 60%, 35%)"
          onClick={() => onMethodSelect('screenshot')}
          delay={50}
        />

        <CaptureOption
          method="manual"
          icon="✏️"
          label="Jot it down"
          description="Tell us what it is and who recommended it"
          colourHex="hsl(158, 48%, 30%)"
          onClick={() => onMethodSelect('manual')}
          delay={100}
        />

      </div>
    </div>
  )
}

// ============================================================
// CAPTURE OPTION
// ============================================================

type CaptureOptionProps = {
  method: CaptureMethod
  icon: string
  label: string
  description: string
  colourHex: string
  onClick: () => void
  delay: number
}

function CaptureOption({
  icon,
  label,
  description,
  colourHex,
  onClick,
  delay,
}: CaptureOptionProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left',
        'bg-white rounded-2xl',
        'border border-surface-border',
        'shadow-card',
        'p-5',
        'flex items-center gap-4',
        'transition-all duration-150',
        'hover:shadow-card-hover hover:-translate-y-0.5',
        'active:scale-[0.98] active:shadow-card',
        'no-tap-highlight focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-400',
        'animate-radial-bloom gpu',
      ].join(' ')}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: `${colourHex}18` }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-display text-card text-neutral-900 mb-0.5">
          {label}
        </p>
        <p className="font-sans text-meta text-neutral-400 leading-snug">
          {description}
        </p>
      </div>

      {/* Arrow */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-neutral-300 flex-shrink-0"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
