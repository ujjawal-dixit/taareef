// lib/supabase/client.ts
// Browser-side Supabase client.
// Use ONLY in Client Components ('use client').
// Never use in Server Components or API routes.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
