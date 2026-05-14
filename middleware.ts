// middleware.ts — Next.js root middleware
// Handles auth session refresh and route protection.
// /api/auth is EXCLUDED from matcher — never intercept OAuth callback.

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
     * - _next/image (image optimization)
     * - favicon.ico
     * - manifest.json
     * - /api/auth (OAuth callback — must never be intercepted)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|api/auth).*)',
  ],
}
