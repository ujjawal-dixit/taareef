// app/layout.tsx
// Root layout — 3 fonts only: Cormorant Garamond, Rajdhani, DM Sans.
// Plus Jakarta Sans deliberately removed (Session 11) — dead import, unused in design system.

import type { Metadata } from 'next'
import { Cormorant_Garamond, Rajdhani, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const rajdhani = Rajdhani({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Taareef — Your recommendation vault',
  description: 'Every recommendation you\'ll ever get. One place.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Taareef',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${rajdhani.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
