// app/(onboarding)/layout.tsx
//
// WHY THIS FILE EXISTS (Session 15, 2026-07-27):
// Supabase warns that Next.js static rendering can cache user metadata
// across unique anonymous users. Their guidance is to use dynamic
// rendering on any route that touches an anonymous session.
//
// Today the onboarding pages are all client components, so they render
// an empty shell and fetch on the client — there is no user data in the
// static HTML and therefore nothing to leak. This layout is a guard
// rail, not a fix: if any onboarding page is ever converted to a server
// component, this ensures it cannot silently start caching one visitor's
// session for the next.
//
// Route segment config only works in server components, which is why it
// lives in a layout rather than in the pages themselves.

export const dynamic = 'force-dynamic'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
