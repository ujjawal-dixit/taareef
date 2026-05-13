// components/features/navigation/app-shell.tsx
// Client shell for authenticated pages.
// Manages: capture screen state, bottom nav, toast provider.
// Keeps the layout.tsx as a Server Component — only this is "use client".

'use client'

import { useState } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { BottomNav } from './bottom-nav'
import { RadialCaptureScreen } from '@/components/features/capture/radial-capture-screen'

type CaptureMethod = 'audio' | 'screenshot' | 'manual'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCaptureOpen, setIsCaptureOpen] = useState(false)
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod | null>(null)

  function handleCaptureTap() {
    setIsCaptureOpen(true)
  }

  function handleCaptureClose() {
    setIsCaptureOpen(false)
    setCaptureMethod(null)
  }

  function handleMethodSelect(method: CaptureMethod) {
    setCaptureMethod(method)
    setIsCaptureOpen(false)
    // TODO Layer 4: route to the appropriate capture flow
    // audio → AudioCaptureFlow
    // screenshot → ScreenshotCaptureFlow
    // manual → ManualCaptureFlow
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-neutral-50">

        {/* Page content */}
        <main className="pb-safe">
          {children}
        </main>

        {/* Bottom navigation + FAB */}
        <BottomNav onCaptureTap={handleCaptureTap} />

        {/* Radial capture screen */}
        <RadialCaptureScreen
          isOpen={isCaptureOpen}
          onClose={handleCaptureClose}
          onMethodSelect={handleMethodSelect}
        />

      </div>
    </ToastProvider>
  )
}
