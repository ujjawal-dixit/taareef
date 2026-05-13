// app/page.tsx
// Root route — redirects all visitors to the login page.
// Authenticated users are caught by middleware and sent to /dashboard instead.

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
