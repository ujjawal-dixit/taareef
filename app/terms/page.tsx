// app/terms/page.tsx

import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/features/legal/legal-page'

export const metadata: Metadata = {
  title:       'Terms · taareef',
  description: 'The terms of using Taareef.',
}

const SECTIONS: LegalSection[] = [
  {
    heading: 'What Taareef is',
    body: [
      'Taareef is a private place to keep recommendations people give you — films, books, albums, restaurants, places and things to do — with a record of who recommended each one.',
      'It is an early-stage product built by one person. Things may change, and occasionally break.',
    ],
  },
  {
    heading: 'Your account',
    body: [
      'You sign in with Google. You are responsible for keeping access to that Google account secure, since anyone with it can reach your vault.',
      'One person, one account. Please do not share an account with someone else — the whole point is that a vault belongs to one person.',
    ],
  },
  {
    heading: 'What you save',
    body: [
      'What you save is yours. We claim no ownership of your notes, your saves, or the connections you record between people and recommendations.',
      'Please do not use Taareef to store content that is illegal, or that you do not have the right to keep.',
    ],
  },
  {
    heading: 'Information from other services',
    body: [
      'Cards are enriched with details from services like TMDB, Spotify, Google Books, Watchmode and Google Places — posters, authors, addresses, photos.',
      'That information belongs to those services and is shown under their terms. It can be wrong or out of date. Check anything that matters before acting on it, particularly opening hours and addresses.',
    ],
  },
  {
    heading: 'Availability',
    body: [
      'Taareef is provided as it is, with no guarantee of uptime. It runs on free-tier infrastructure and may be slow, briefly unavailable, or interrupted while being worked on.',
      'Keep your own copy of anything you cannot afford to lose. We take care with your data, but we cannot promise it is impossible to lose.',
    ],
  },
  {
    heading: 'Ending it',
    body: [
      'You can stop using Taareef whenever you like, and ask us to delete your account and everything in it — see the privacy page.',
      'We may suspend an account that is being used to abuse the service or to harm other people.',
    ],
  },
  {
    heading: 'Changes',
    body: [
      'These terms will change as the product develops. Significant changes will be noted here with an updated date.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      'udsrkian@gmail.com',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="27 July 2026"
      intro="Short, and in plain language. Taareef is an early-stage product made by one person — these terms try to be honest about what that means rather than pretend otherwise."
      sections={SECTIONS}
    />
  )
}
