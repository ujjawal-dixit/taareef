// app/layout.tsx
// Root layout. Loads Fraunces + DM Sans via next/font.
// Sets CSS variables on <html> — all components inherit from here.

import type { Metadata, Viewport } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  // Optical size and weight axes — gives Fraunces its warmth at large sizes
  weight: ['300', '400', '500', '600', '700'],
})

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
  // Wong Kar-wai warm cream — matches the page background
  themeColor: '#faf8f5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      // Apply both font CSS variables to the root element
      // All children can now use var(--font-fraunces) and var(--font-dm-sans)
      className={`${fraunces.variable} ${dmSans.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  )
}
