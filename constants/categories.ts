// constants/categories.ts
// Single source of truth for all category configuration.
// Icons, colours, verbs, empty states, depth bar filters.
// Import from here — never hardcode category config in components.

import type { Category } from '@/lib/types'

// ============================================================
// CATEGORY CONFIG
// ============================================================

export type CategoryConfig = {
  id: Category
  label: string           // display name
  labelPlural: string     // plural display name
  icon: string            // emoji icon
  colour: string          // Tailwind CSS class — category accent colour
  colourHex: string       // HSL value for dynamic styles
  verb: string            // "I went" / "I watched" — for experienced flow
  cardVariant: 'poster' | 'split'  // visual vs physical place
  emptyState: {
    headline: string
    body: string
    cta: string
  }
  depthFilters: {         // secondary sort options in the depth bar
    label: string
    key: string
  }[]
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {

  restaurant: {
    id: 'restaurant',
    label: 'Restaurant',
    labelPlural: 'Restaurants',
    icon: '🍽',
    colour: 'bg-category-restaurant',
    colourHex: 'hsl(12, 72%, 45%)',
    verb: 'I went to',
    cardVariant: 'split',
    emptyState: {
      headline: 'The next great meal is waiting',
      body: 'When someone says "you have to try this place," save it here in seconds.',
      cta: 'Save a restaurant',
    },
    depthFilters: [
      { label: 'Neighbourhood', key: 'neighbourhood' },
      { label: 'Cuisine', key: 'cuisine' },
    ],
  },

  bar: {
    id: 'bar',
    label: 'Bar',
    labelPlural: 'Bars',
    icon: '🍸',
    colour: 'bg-category-bar',
    colourHex: 'hsl(272, 45%, 35%)',
    verb: 'I went to',
    cardVariant: 'split',
    emptyState: {
      headline: 'Your next favourite bar',
      body: 'That rooftop someone mentioned. The cocktail bar from the article. Save them here.',
      cta: 'Save a bar',
    },
    depthFilters: [
      { label: 'Neighbourhood', key: 'neighbourhood' },
      { label: 'Type', key: 'type' },
    ],
  },

  film: {
    id: 'film',
    label: 'Film',
    labelPlural: 'Films',
    icon: '🎬',
    colour: 'bg-category-film',
    colourHex: 'hsl(228, 60%, 35%)',
    verb: 'I watched',
    cardVariant: 'poster',
    emptyState: {
      headline: 'Films worth watching',
      body: 'Every film someone swears by — saved here, ready for the next free evening.',
      cta: 'Save a film',
    },
    depthFilters: [
      { label: 'Where to watch', key: 'streaming' },
      { label: 'Genre', key: 'genre' },
    ],
  },

  tv: {
    id: 'tv',
    label: 'TV',
    labelPlural: 'Shows',
    icon: '📺',
    colour: 'bg-category-tv',
    colourHex: 'hsl(198, 65%, 35%)',
    verb: 'I watched',
    cardVariant: 'poster',
    emptyState: {
      headline: 'Your next obsession',
      body: 'When someone says "just start it" — save it here so you actually do.',
      cta: 'Save a show',
    },
    depthFilters: [
      { label: 'Where to watch', key: 'streaming' },
      { label: 'Genre', key: 'genre' },
    ],
  },

  music: {
    id: 'music',
    label: 'Music',
    labelPlural: 'Music',
    icon: '🎵',
    colour: 'bg-category-music',
    colourHex: 'hsl(338, 58%, 38%)',
    verb: 'I listened to',
    cardVariant: 'poster',
    emptyState: {
      headline: 'Music worth remembering',
      body: 'That album someone played in the car. The artist from the podcast. Save them here.',
      cta: 'Save something to listen to',
    },
    depthFilters: [
      { label: 'Song', key: 'song' },
      { label: 'Album', key: 'album' },
      { label: 'Artist', key: 'artist' },
    ],
  },

  book: {
    id: 'book',
    label: 'Book',
    labelPlural: 'Books',
    icon: '📚',
    colour: 'bg-category-book',
    colourHex: 'hsl(32, 68%, 35%)',
    verb: 'I read',
    cardVariant: 'poster',
    emptyState: {
      headline: "Books you'll actually read",
      body: 'Every book that sounds exactly right — saved here until you\'re ready.',
      cta: 'Save a book',
    },
    depthFilters: [
      { label: 'Genre', key: 'genre' },
    ],
  },

  city: {
    id: 'city',
    label: 'City',
    labelPlural: 'Places',
    icon: '🏙',
    colour: 'bg-category-city',
    colourHex: 'hsl(158, 48%, 30%)',
    verb: 'I visited',
    cardVariant: 'poster',
    emptyState: {
      headline: 'Places worth going',
      body: 'Every city someone makes sound unmissable — saved here with who told you.',
      cta: 'Save a place',
    },
    depthFilters: [
      { label: 'Type', key: 'type' },
      { label: 'Season', key: 'season' },
    ],
  },

  activity: {
    id: 'activity',
    label: 'Activity',
    labelPlural: 'Activities',
    icon: '🎯',
    colour: 'bg-category-activity',
    colourHex: 'hsl(178, 52%, 28%)',
    verb: 'I did',
    cardVariant: 'split',
    emptyState: {
      headline: 'Things worth doing',
      body: 'The hike, the class, the experience someone keeps telling you about. Save it here.',
      cta: 'Save an activity',
    },
    depthFilters: [
      { label: 'Type', key: 'type' },
      { label: 'Location', key: 'location' },
    ],
  },

  podcast: {
    id: 'podcast',
    label: 'Podcast',
    labelPlural: 'Podcasts',
    icon: '🎧',
    colour: 'bg-category-podcast',
    colourHex: 'hsl(262, 52%, 38%)',
    verb: 'I listened to',
    cardVariant: 'poster',
    emptyState: {
      headline: 'Episodes worth hearing',
      body: 'When someone says "you have to listen to this episode" — save it before you forget.',
      cta: 'Save a podcast',
    },
    depthFilters: [
      { label: 'Topic', key: 'topic' },
    ],
  },

  person: {
    id: 'person',
    label: 'Person',
    labelPlural: 'People',
    icon: '👤',
    colour: 'bg-category-person',
    colourHex: 'hsl(22, 62%, 38%)',
    verb: 'I followed',
    cardVariant: 'poster',
    emptyState: {
      headline: 'People worth following',
      body: 'The chef, the writer, the filmmaker someone says you\'d love. Save them here.',
      cta: 'Save a person',
    },
    depthFilters: [
      { label: 'Platform', key: 'platform' },
      { label: 'Specialty', key: 'specialty' },
    ],
  },
}

// ============================================================
// ORDERED LIST — for category bar rendering
// Order: most universally recommended categories first
// ============================================================

export const CATEGORY_ORDER: Category[] = [
  'restaurant',
  'film',
  'music',
  'bar',
  'book',
  'tv',
  'city',
  'podcast',
  'activity',
  'person',
]

export const CATEGORIES = CATEGORY_ORDER.map(id => CATEGORY_CONFIG[id])

// ============================================================
// HELPERS
// ============================================================

export function getCategoryConfig(category: Category): CategoryConfig {
  return CATEGORY_CONFIG[category]
}

export function getCategoryVerb(category: Category): string {
  return CATEGORY_CONFIG[category].verb
}

export function getCategoryColour(category: Category): string {
  return CATEGORY_CONFIG[category].colourHex
}

export function isVisualCategory(category: Category): boolean {
  return CATEGORY_CONFIG[category].cardVariant === 'poster'
}

export function isPhysicalCategory(category: Category): boolean {
  return CATEGORY_CONFIG[category].cardVariant === 'split'
}

// Music subcategory type
export type MusicSubcategory = 'song' | 'album' | 'artist'

export const MUSIC_SUBCATEGORIES: { id: MusicSubcategory; label: string; icon: string }[] = [
  { id: 'song',   label: 'Song',   icon: '♪' },
  { id: 'album',  label: 'Album',  icon: '◉' },
  { id: 'artist', label: 'Artist', icon: '♫' },
]
