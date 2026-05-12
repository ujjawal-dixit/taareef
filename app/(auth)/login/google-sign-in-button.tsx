// app/(auth)/login/google-sign-in-button.tsx
// "use client" — needs browser-side Supabase to initiate OAuth flow.
// Separated from the page so the page stays a Server Component.

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  next?: string
}

export default function GoogleSignInButton({ next }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  async function handleGoogleSignIn() {
    setIsLoading(true)

    try {
      const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback${
        next ? `?next=${encodeURIComponent(next)}` : ''
      }`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            // Request offline access for refresh tokens
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        // OAuth initiation failed — redirect to login with error
        // (Supabase will redirect back to /login?error=auth_failed)
        console.error('OAuth initiation error:', error.message)
        setIsLoading(false)
      }

      // If no error: Supabase redirects the browser to Google.
      // Control returns here only on failure.
    } catch (err) {
      console.error('Unexpected error during sign in:', err)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="
        w-full flex items-center justify-center gap-3
        bg-primary-500 hover:bg-primary-600
        disabled:opacity-60 disabled:cursor-not-allowed
        text-white font-sans font-semibold text-base
        py-3.5 px-6 rounded-xl
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-primary-500 focus-visible:ring-offset-2
      "
      aria-label="Continue with Google"
    >
      {isLoading ? (
        <>
          {/* Simple spinner — not a blocking modal, just button state */}
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Signing in…</span>
        </>
      ) : (
        <>
          {/* Google logo — SVG inline, no external dependency */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          >
            <path
              fill="white"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="white"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="white"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="white"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  )
}
