// app/layout.tsx
// Root layout — wraps every page in the application.
// Loads Fraunces (display) and DM Sans (body) via next/font/google.
// Sets global metadata, page background, and font CSS variables.

import type { Metadata, Viewport } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'

// Fraunces — variable serif for headings and display text
// Axes omitted intentionally: Next.js 14 font loader is strict about
// variable font axes. We use weight range only — safe and well-supported.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

// DM Sans — geometric humanist sans for body and UI text
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Taareef',
    template: '%s · Taareef',
  },
  description: "Every recommendation you'll ever get. One place.",
  applicationName: 'Taareef',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Taareef',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: 'hsl(40, 20%, 98%)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable}`}
    >
      <body className="bg-neutral-50 text-neutral-900 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
