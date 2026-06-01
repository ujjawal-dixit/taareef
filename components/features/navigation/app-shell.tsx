'use client'

// components/features/navigation/app-shell.tsx
// Session 9 — no functional changes, but the CaptureScreen now renders
// a bottom sheet (not full-screen overlay) so we no longer lock body scroll
// on the choose-method state. The AppShell itself is unchanged in structure.
// Max-width container ensures consistent centering on all screen sizes.

import { useState, useCallback, type ReactNode } from 'react'
import { ToastProvider }  from '@/components/ui/toast'
import { BottomNav }      from './bottom-nav'
import { CaptureScreen }  from '@/components/features/capture/capture-screen'
import type { CreateRecommendationInput } from '@/lib/types'

type Props = {
  children:             ReactNode
  onSaveRecommendation: (input: CreateRecommendationInput) => Promise<void>
}

export function AppShell({ children, onSaveRecommendation }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const open  = useCallback(() => setIsOpen(true),  [])
  const close = useCallback(() => setIsOpen(false), [])

  const handleSaved = useCallback(async (input: CreateRecommendationInput) => {
    await onSaveRecommendation(input)
    close()
  }, [onSaveRecommendation, close])

  return (
    <ToastProvider>
      <div style={{
        maxWidth:   '430px',
        margin:     '0 auto',
        minHeight:  '100dvh',
        background: '#111111',
        position:   'relative',
        overflowX:  'hidden',
      }}>
        <main style={{
          paddingBottom: 'calc(64px + 48px + env(safe-area-inset-bottom, 0px))',
        }}>
          {children}
        </main>
        <BottomNav onFabTap={open} />
        <CaptureScreen isOpen={isOpen} onClose={close} onSaved={handleSaved} />
      </div>
    </ToastProvider>
  )
}
