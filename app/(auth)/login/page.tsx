// app/(auth)/login/page.tsx
// The Taareef login page.
// Google OAuth only in V1. Privacy statement visible per locked product decision.
// Server Component — GoogleSignInButton is a separate Client Component.

import type { Metadata } from 'next'
import GoogleSignInButton from './google-sign-in-button'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Taareef vault.',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string }
}) {
  const hasError = searchParams.error === 'auth_failed'

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
      {/* Main card */}
      <div className="w-full max-w-sm">

        {/* Brand mark */}
        <div className="text-center mb-10">
          {/* Wordmark in Fraunces */}
          <h1 className="font-display text-4xl font-bold text-neutral-900 tracking-tight mb-2">
            Taareef
          </h1>
          <p className="text-neutral-500 text-base leading-relaxed">
            Every recommendation you&rsquo;ll ever get.<br />
            One place.
          </p>
        </div>

        {/* Sign in card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">

          {/* Error message */}
          {hasError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600">
                Couldn&rsquo;t sign in — please try again.
              </p>
            </div>
          )}

          {/* Sign in prompt */}
          <p className="text-neutral-700 text-sm text-center mb-5 leading-relaxed">
            Your vault is private. Only you can see it.
          </p>

          {/* Google OAuth button — Client Component */}
          <GoogleSignInButton next={searchParams.next} />

        </div>

        {/* Privacy statement — locked product decision */}
        <p className="mt-6 text-center text-xs text-neutral-400 leading-relaxed px-2">
          No ads. No tracking. No data selling. Ever.<br />
          Your recommendations are yours.
        </p>

      </div>
    </div>
  )
}
