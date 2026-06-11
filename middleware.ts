// middleware.ts
//
// Auth protection for all app routes.
// Public routes (no auth required): /, /login, /onboarding/*, /api/auth/*
// Everything else: redirect to / if not logged in.

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Public routes — always accessible ────────────────────────────────────
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/auth')

  // ── Logged-in user visiting landing or onboarding → send to dashboard ────
  if (user && (pathname === '/' || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── Logged-out user visiting protected route → send to landing ────────────
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|examples/|logos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
