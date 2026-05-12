// lib/supabase/middleware.ts
// Supabase client for Next.js middleware.
// Uses NextRequest/NextResponse for cookie management — Edge Runtime compatible.
// Do NOT use lib/supabase/server.ts in middleware — different cookie API.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — must not be removed.
  // This call is what keeps the user's auth session alive.
  // Without it, server-side auth will fail after the token expires.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all routes under /(app) — redirect to login if not authenticated
  const isAppRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/add') ||
    request.nextUrl.pathname.startsWith('/rec')

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and hits /login, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Allow: API routes, onboarding routes, auth routes, public routes
  return supabaseResponse
}
