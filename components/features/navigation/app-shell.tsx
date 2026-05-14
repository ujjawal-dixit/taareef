'use client'

// components/features/navigation/app-shell.tsx
// Client shell for all authenticated pages.
// Manages capture screen state. Wraps with ToastProvider.
// Every authenticated page is wrapped in this.

import { useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { BottomNav }      from './bottom-nav'
import { CaptureScreen }  from '@/components/features/capture/capture-screen'
import type { CreateRecommendationInput } from '@/lib/types'

type AppShellProps = {
  children: ReactNode
  onSaveRecommendation: (input: CreateRecommendationInput) => Promise<void>
}

export function AppShell({ children, onSaveRecommendation }: AppShellProps) {
  const [isCaptureOpen, setIsCaptureOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="app-shell grain">
        {/* Page content — padded above nav */}
        <main className="page-content" id="main-content">
          {children}
        </main>

        {/* Bottom navigation + FAB */}
        <BottomNav onFabTap={() => setIsCaptureOpen(true)} />

        {/* Capture screen — full viewport overlay */}
        <CaptureScreen
          isOpen={isCaptureOpen}
          onClose={() => setIsCaptureOpen(false)}
          onSaved={async (input) => {
            await onSaveRecommendation(input)
            setIsCaptureOpen(false)
          }}
        />
      </div>
    </ToastProvider>
  )
}
