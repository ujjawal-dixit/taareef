// middleware.ts — Next.js root middleware
// Runs on every matched request before the page loads.
// Handles session refresh and route protection via Supabase auth.
// Keep this file lean — all logic lives in lib/supabase/middleware.ts.

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api/auth (OAuth callback must never be intercepted)
     * - Public asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
