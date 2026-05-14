// app/(app)/layout.tsx
// Layout for all authenticated pages.
// Auth verification happens in middleware — safe to assume user here.

import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
