// components/features/navigation/app-shell.tsx
// Client shell for authenticated pages.
// Manages capture screen state, wraps with ToastProvider.

'use client'

import { useState } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { BottomNav } from './bottom-nav'
import { RadialCaptureScreen } from '@/components/features/capture/radial-capture-screen'

type CaptureMethod = 'audio' | 'screenshot' | 'manual'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCaptureOpen, setIsCaptureOpen]   = useState(false)
  const [, setCaptureMethod] = useState<CaptureMethod | null>(null)

  function handleMethodSelect(method: CaptureMethod) {
    setCaptureMethod(method)
    setIsCaptureOpen(false)
    // TODO Layer 4: route to capture flow for each method
    // audio      → AudioCaptureFlow
    // screenshot → ScreenshotCaptureFlow
    // manual     → ManualCaptureFlow
  }

  return (
    <ToastProvider>
      {/* Page content — padded above nav */}
      <div className="pb-safe">
        {children}
      </div>

      {/* Bottom navigation + FAB */}
      <BottomNav onCaptureTap={() => setIsCaptureOpen(true)} />

      {/* Capture screen — full viewport overlay */}
      <RadialCaptureScreen
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onMethodSelect={handleMethodSelect}
      />
    </ToastProvider>
  )
}
