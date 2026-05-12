// app/layout.tsx
// Root layout — wraps every page.
// Loads Fraunces (display) and DM Sans (body) via next/font.
// Sets global metadata, background colour, and font classes.

import type { Metadata, Viewport } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  // Variable font — axes: optical size, weight, slant, softness
  axes: ['SOFT', 'WONK'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Taareef',
    template: '%s · Taareef',
  },
  description: 'Every recommendation you\'ll ever get. One place.',
  // PWA metadata (used in V2 when manifest.json is added)
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
  // Prevents double-tap zoom on mobile — important for 2-tap save flow
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
