// app/layout.tsx
// Root layout.
// Cormorant Garamond: wordmark only — intimate, cinematic, WKW.
// Rajdhani: all UI — condensed, architectural, readable at 9px.
// DM Sans: body copy — warm, legible at 11px on dark.

import type { Metadata, Viewport } from 'next'
import { Rajdhani, DM_Sans, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets:  ['latin'],
  variable: '--font-cormorant',
  // Light italic only — this is the wordmark weight.
  // Heavy Cormorant reads as Victorian, not cinematic.
  weight:   ['300', '400'],
  style:    ['normal', 'italic'],
  display:  'swap',
})

const rajdhani = Rajdhani({
  subsets:  ['latin'],
  variable: '--font-rajdhani',
  weight:   ['400', '500', '600', '700'],
  display:  'swap',
})

const dmSans = DM_Sans({
  subsets:  ['latin'],
  variable: '--font-dm-sans',
  weight:   ['300', '400', '500', '600'],
  display:  'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'taareef',
    template: '%s · taareef',
  },
  description: "Every recommendation you'll ever get. One place.",
  applicationName: 'taareef',
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'black-translucent',
    title:           'taareef',
  },
}

export const viewport: Viewport = {
  width:         'device-width',
  initialScale:  1,
  maximumScale:  1,
  userScalable:  false,
  themeColor:    '#080f0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${rajdhani.variable} ${dmSans.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  )
}
