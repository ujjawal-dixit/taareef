// constants/example-cards.ts
// The 5 seeded example cards shown during onboarding.
// These are the user's first glimpse of what Taareef feels like.
// Carefully chosen — culturally specific, warm, real-feeling.

import type { ExampleCard } from '@/lib/types'

export const EXAMPLE_CARDS: ExampleCard[] = [
  {
    id: 'example-parasite',
    title: 'Parasite',
    category: 'film',
    source_type: 'friend',
    source_name: 'Ahmed',
    notes: 'Watch it knowing nothing',
    image_url: '/examples/parasite.jpg',
    status: 'saved',
    priority: 'medium',
    reaction: null,
    metadata: {
      genre: 'Thriller · Drama',
      streaming: 'Mubi',
      year: 2019,
      director: 'Bong Joon-ho',
      runtime_minutes: 132,
    },
  },
  {
    id: 'example-old-street',
    title: 'Old Street Bar',
    category: 'bar',
    source_type: 'friend',
    source_name: 'Rohit',
    notes: 'Go on a weekday, sit outside',
    image_url: '/examples/old-street-bar.jpg',
    status: 'saved',
    priority: 'medium',
    reaction: null,
    location: {
      city: 'Mumbai',
      country: 'India',
      address: 'Bandra West, Mumbai',
    },
    metadata: {
      neighbourhood: 'Bandra',
      type: 'Cocktail bar',
    },
  },
  {
    id: 'example-mans-search',
    title: "Man's Search For Meaning",
    category: 'book',
    source_type: 'friend',
    source_name: 'Priya',
    notes: 'Read it slowly',
    image_url: '/examples/mans-search.jpg',
    status: 'saved',
    priority: 'medium',
    reaction: null,
    metadata: {
      author: 'Viktor Frankl',
      genre: 'Philosophy · Psychology',
      year: 1946,
    },
  },
  {
    id: 'example-weightless',
    title: 'Weightless',
    category: 'music',
    source_type: 'self',
    source_name: 'that long drive',
    notes: 'Best for late nights',
    image_url: '/examples/weightless.jpg',
    status: 'saved',
    priority: 'medium',
    reaction: null,
    metadata: {
      artist: 'Arijit Singh & Martin Garrix',
      music_subcategory: 'song',
    },
  },
  {
    id: 'example-kitab-khana',
    title: 'Kitab Khana',
    category: 'restaurant',
    source_type: 'friend',
    source_name: 'someone',
    notes: 'Best place to read and eat',
    image_url: '/examples/kitab-khana.jpg',
    status: 'saved',
    priority: 'medium',
    reaction: null,
    location: {
      city: 'Mumbai',
      country: 'India',
      address: 'Colaba, Mumbai',
    },
    metadata: {
      neighbourhood: 'Colaba',
      cuisine: 'Café',
    },
  },
]

export const EXAMPLE_CARD_IDS = new Set(EXAMPLE_CARDS.map(c => c.id))

export function isExampleCard(id: string): boolean {
  return EXAMPLE_CARD_IDS.has(id)
}

// The first card — used as the hero in Screen 1's mixed grid
export const HERO_EXAMPLE_CARD = EXAMPLE_CARDS[0]

// The remaining cards — shown in the 2-column grid below the hero
export const SUPPORTING_EXAMPLE_CARDS = EXAMPLE_CARDS.slice(1)
