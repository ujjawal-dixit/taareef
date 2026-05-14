// app/layout.tsx
// Root layout. Loads Rajdhani + DM Sans via next/font.
// Sets CSS variables on <html>. Film grain applied here.

import type { Metadata, Viewport } from 'next'
import { Rajdhani, DM_Sans } from 'next/font/google'
import './globals.css'

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'taareef',
    template: '%s · taareef',
  },
  description: "Every recommendation you'll ever get. One place.",
  applicationName: 'taareef',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'taareef',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Canvas colour — tells browser to paint chrome in same tone
  themeColor: '#080f0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${dmSans.variable}`}
    >
      <body className="grain">
        {children}
      </body>
    </html>
  )
}
