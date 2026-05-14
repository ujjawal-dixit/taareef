// constants/categories.ts
// Single source of truth for all category configuration.
// Colour values traced to WKW film palette.
// Every category has: id, label, labelPlural, icon SVG path, colourHex, verb, emptyState

export type CategoryId =
  | 'restaurant' | 'bar' | 'film' | 'tv'
  | 'music' | 'book' | 'city' | 'activity'
  | 'podcast' | 'person'

export type CategoryConfig = {
  id:          CategoryId
  label:       string
  labelPlural: string
  shortLabel:  string
  colourHex:   string
  verb:        string            // "went" / "watched" etc
  badgeBg:     string            // card badge background
  badgeBorder: string            // card badge border
  emptyState:  {
    headline: string
    body:     string
    cta:      string
  }
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'restaurant',
    label: 'Restaurant',
    labelPlural: 'Restaurants',
    shortLabel: 'Food',
    colourHex: '#c8151e',   // ITMFL crimson
    verb: 'went to',
    badgeBg: 'rgba(200,21,30,0.75)',
    badgeBorder: 'rgba(200,21,30,0.55)',
    emptyState: {
      headline: 'The next great meal is waiting',
      body: 'When someone says "you have to try this place," save it here in seconds.',
      cta: 'Save a restaurant',
    },
  },
  {
    id: 'film',
    label: 'Film',
    labelPlural: 'Films',
    shortLabel: 'Film',
    colourHex: '#1a52c8',   // Chungking Express blue
    verb: 'watched',
    badgeBg: 'rgba(26,82,200,0.75)',
    badgeBorder: 'rgba(26,82,200,0.55)',
    emptyState: {
      headline: 'Films worth watching',
      body: 'Every film someone swears by — saved here, ready for the next free evening.',
      cta: 'Save a film',
    },
  },
  {
    id: 'music',
    label: 'Music',
    labelPlural: 'Music',
    shortLabel: 'Music',
    colourHex: '#9a1572',   // Days of Being Wild magenta
    verb: 'listened to',
    badgeBg: 'rgba(154,21,114,0.75)',
    badgeBorder: 'rgba(154,21,114,0.55)',
    emptyState: {
      headline: 'Music worth remembering',
      body: 'That album someone played in the car. The artist from the podcast. Save them here.',
      cta: 'Save something to listen to',
    },
  },
  {
    id: 'bar',
    label: 'Bar',
    labelPlural: 'Bars',
    shortLabel: 'Bar',
    colourHex: '#6a15c8',   // 2046 violet
    verb: 'went to',
    badgeBg: 'rgba(106,21,200,0.75)',
    badgeBorder: 'rgba(106,21,200,0.55)',
    emptyState: {
      headline: 'Your next favourite bar',
      body: 'That rooftop someone mentioned. The cocktail bar from the article. Save them here.',
      cta: 'Save a bar',
    },
  },
  {
    id: 'book',
    label: 'Book',
    labelPlural: 'Books',
    shortLabel: 'Book',
    colourHex: '#b87820',   // Happy Together amber
    verb: 'read',
    badgeBg: 'rgba(184,120,32,0.75)',
    badgeBorder: 'rgba(184,120,32,0.55)',
    emptyState: {
      headline: 'Books you\'ll actually read',
      body: 'Every book that sounds exactly right — saved here until you\'re ready.',
      cta: 'Save a book',
    },
  },
  {
    id: 'tv',
    label: 'TV',
    labelPlural: 'TV Shows',
    shortLabel: 'TV',
    colourHex: '#155a8a',   // Fallen Angels steel
    verb: 'watched',
    badgeBg: 'rgba(21,90,138,0.75)',
    badgeBorder: 'rgba(21,90,138,0.55)',
    emptyState: {
      headline: 'Your next obsession',
      body: 'When someone says "just start it" — save it here so you actually do.',
      cta: 'Save a show',
    },
  },
  {
    id: 'city',
    label: 'City',
    labelPlural: 'Cities',
    shortLabel: 'City',
    colourHex: '#1fce94',   // Ashes of Time — neon, same as brand
    verb: 'visited',
    badgeBg: 'rgba(31,206,148,0.75)',
    badgeBorder: 'rgba(31,206,148,0.55)',
    emptyState: {
      headline: 'Places worth going',
      body: 'Every city someone makes sound unmissable — saved here with who told you.',
      cta: 'Save a place',
    },
  },
  {
    id: 'podcast',
    label: 'Podcast',
    labelPlural: 'Podcasts',
    shortLabel: 'Pod',
    colourHex: '#3315c8',   // 2046 deep indigo
    verb: 'listened to',
    badgeBg: 'rgba(51,21,200,0.75)',
    badgeBorder: 'rgba(51,21,200,0.55)',
    emptyState: {
      headline: 'Episodes worth hearing',
      body: 'When someone says "you have to listen to this" — save it before you forget.',
      cta: 'Save a podcast',
    },
  },
  {
    id: 'activity',
    label: 'Activity',
    labelPlural: 'Activities',
    shortLabel: 'Do',
    colourHex: '#158a6a',   // teal
    verb: 'did',
    badgeBg: 'rgba(21,138,106,0.75)',
    badgeBorder: 'rgba(21,138,106,0.55)',
    emptyState: {
      headline: 'Things worth doing',
      body: 'The hike, the class, the experience someone keeps telling you about. Save it here.',
      cta: 'Save an activity',
    },
  },
  {
    id: 'person',
    label: 'Person',
    labelPlural: 'People',
    shortLabel: 'Person',
    colourHex: '#c84515',   // cinnabar
    verb: 'followed',
    badgeBg: 'rgba(200,69,21,0.75)',
    badgeBorder: 'rgba(200,69,21,0.55)',
    emptyState: {
      headline: 'People worth following',
      body: 'The chef, the writer, the filmmaker someone says you\'d love. Save them here.',
      cta: 'Save a person',
    },
  },
]

export function getCategoryConfig(id: CategoryId): CategoryConfig {
  const config = CATEGORIES.find(c => c.id === id)
  if (!config) throw new Error(`Unknown category: ${id}`)
  return config
}

// Physical place categories — use split card layout
export const PHYSICAL_CATEGORIES: CategoryId[] = ['restaurant', 'bar', 'activity']

export function isPhysicalCategory(id: CategoryId): boolean {
  return PHYSICAL_CATEGORIES.includes(id)
}

// SVG path data for each category icon
// All designed on a 24×24 viewbox, stroke-based, fill:none
export const CATEGORY_ICONS: Record<CategoryId, string> = {
  restaurant: 'M3 2v7c0 2.2 1.8 4 4 4v9M17 2v20M12 2v4c0 1.1-.9 2-2 2H8',
  film:       'M2 4h20v16H2zM7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5',
  music:      'M11 18V8l10-2v10 M8 18a3 3 0 1 1 0-0.001 M18 16a3 3 0 1 1 0-0.001',
  bar:        'M8 22h8M12 11v11M3 3h18l-7 9.5V18',
  book:       'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  tv:         'M2 7h20v13H2z rx2 M8 2l4 5 4-5',
  city:       'M3 21h18M5 21V7l7-4 7 4v14M9 21V12h6v9',
  podcast:    'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
  activity:   'M12 3a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM10 22l2-8 2 8M12 14l-4-6h8l-4 6',
  person:     'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
}
