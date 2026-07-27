// app/privacy/page.tsx

import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/features/legal/legal-page'

export const metadata: Metadata = {
  title:       'Privacy · taareef',
  description: 'What Taareef stores, what it never does, and how to delete everything.',
}

const SECTIONS: LegalSection[] = [
  {
    heading: 'What we store',
    body: [
      'Your name and email address, received from Google when you sign in. We do not receive or store your Google password.',
      'The recommendations you save: the title, category, who recommended it, your notes, and any photo attached to the card.',
      'Which categories you told us you care about during setup.',
      'That is the complete list. There is no tracking, no advertising identifier, and no behavioural profile.',
    ],
  },
  {
    heading: 'What we never do',
    body: [
      'We never show your vault to another person. There are no public profiles, no followers, no feed, and no way for anyone else to see what you have saved.',
      'We never sell your data, and we never share it with advertisers.',
      'We do not read your vault to build recommendations for other people. Nothing you save influences what anyone else sees.',
    ],
  },
  {
    heading: 'Services that process your data',
    body: [
      'Taareef uses a small number of services to work. Each receives only what it needs.',
      'Supabase stores your account and your recommendations, on servers in Mumbai, India. Vercel hosts and serves the application.',
      'Google provides sign-in. Google Places is sent the name of a restaurant or place you save, so the card can show a photo and address.',
      'Groq processes captures: if you record a voice note it is transcribed, if you upload a screenshot it is read, and typed text is interpreted to work out what you are saving. This is processing, not training — your content is not used to train models.',
      'TMDB, Spotify, Google Books and Watchmode are sent the title of a film, album or book so the card can show its poster, artist or author.',
      'Resend delivers email if you send feedback.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: [
      'Your recommendations stay until you delete them or delete your account. We do not expire or archive them on your behalf.',
      'Voice recordings and screenshots are processed to extract text and are not stored afterwards. Only the resulting card is kept.',
    ],
  },
  {
    heading: 'Deleting your data',
    body: [
      'You can delete any individual recommendation from within the app at any time.',
      'To delete your account and everything in it, email the address below. We will remove it and confirm when it is done.',
    ],
  },
  {
    heading: 'Your rights',
    body: [
      'Under India\u2019s Digital Personal Data Protection Act, and equivalent laws elsewhere, you can ask what we hold about you, ask us to correct it, and ask us to delete it. Email us and we will respond.',
    ],
  },
  {
    heading: 'Changes',
    body: [
      'If this policy changes in a way that affects how your data is handled, we will say so here and update the date at the top.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      'Questions about privacy, or a deletion request: udsrkian@gmail.com',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="27 July 2026"
      intro="Taareef is a private vault. What you save is yours, it is shown to nobody else, and it is never sold. This page explains exactly what is stored and why, in plain language rather than legal boilerplate."
      sections={SECTIONS}
    />
  )
}
