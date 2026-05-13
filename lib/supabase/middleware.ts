// lib/supabase/middleware.ts
// Supabase client for Next.js middleware context.
// Edge Runtime compatible — uses NextRequest/NextResponse for cookie management.
// Do NOT use lib/supabase/server.ts here — it uses next/headers which is Node-only.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // First: write to the request so downstream code sees the updated cookies
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          // Recreate the response so we can write Set-Cookie headers
          supabaseResponse = NextResponse.next({ request })

          // Then: write to the response so the browser receives the updated cookies
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Do not remove this call.
  // It refreshes the user session on every request.
  // Without it, the session expires and server-side auth breaks silently.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Routes that require authentication
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/rec') ||
    pathname.startsWith('/onboarding')

  // Routes only for unauthenticated users
  const isAuthRoute = pathname.startsWith('/login')

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
