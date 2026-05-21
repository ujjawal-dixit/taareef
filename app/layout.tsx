import type { Metadata, Viewport } from 'next'
import {
  Cormorant_Garamond,
  Rajdhani,
  DM_Sans,
  Plus_Jakarta_Sans,
} from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets:  ['latin'],
  variable: '--font-cormorant',
  weight:   ['300', '400', '500'],
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

// Plus Jakarta Sans — replaces Rajdhani for card titles and category names.
// Humanist, warm, editorial. Carries cultural content without feeling mechanical.
const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  variable: '--font-jakarta',
  weight:   ['400', '500', '600', '700'],
  display:  'swap',
})

export const metadata: Metadata = {
  title:           { default: 'taareef', template: '%s · taareef' },
  description:     "Every recommendation you'll ever get. One place.",
  applicationName: 'taareef',
  appleWebApp:     { capable: true, statusBarStyle: 'black-translucent', title: 'taareef' },
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
      className={`${cormorant.variable} ${rajdhani.variable} ${dmSans.variable} ${jakarta.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
