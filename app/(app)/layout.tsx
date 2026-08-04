import type { ReactNode } from 'react'
import { AppProviders }   from '@/components/features/navigation/app-providers'

// app/(app)/layout.tsx
//
// A layout survives navigation between the pages beneath it. Anything
// that must outlive a single screen — the capture sheet, toasts, and
// saves still waiting on enrichment — is mounted here, once.
//
// Previously this was an empty passthrough and all of that lived inside
// each page, so it was destroyed and rebuilt on every screen change.

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}
