// constants/categories.ts
// 8 categories — reduced from 10 per product decision.
// Removed: podcast (collapsed into Go/Do spirit), person (V2).
// Renamed: bar → clubs (more honest about what it contains).
// 
// Layout: horizontal scroll strip, not 5×2 grid.
// Each category is a room in the vault — cards stack beneath it.
// Colour philosophy: WKW film palette, one dominant hue per film.

export type CategoryId =
  | 'film' | 'book' | 'tv' | 'music'
  | 'restaurant' | 'bar' | 'city' | 'activity'

export type CategoryConfig = {
  id:          CategoryId
  label:       string        // display label — "Films", "Clubs" etc
  labelPlural: string
  shortLabel:  string        // strip label — compact
  colourHex:   string
  verb:        string
  badgeBg:     string
  badgeBorder: string
  isVisual:    boolean       // true → poster card. false → split card
  emptyState: {
    headline: string
    body:     string
    cta:      string
  }
}

// The 8 categories in vault display order
export const CATEGORIES: CategoryConfig[] = [
  {
    id:          'film',
    label:       'Films',
    labelPlural: 'Films',
    shortLabel:  'Films',
    colourHex:   '#1a52c8',   // Chungking Express — deep blue
    verb:        'watched',
    badgeBg:     'rgba(26,82,200,0.75)',
    badgeBorder: 'rgba(26,82,200,0.55)',
    isVisual:    true,
    emptyState: {
      headline: 'Films worth watching',
      body:     'Every film someone swears by — saved here, ready for the next free evening.',
      cta:      'Save a film',
    },
  },
  {
    id:          'book',
    label:       'Books',
    labelPlural: 'Books',
    shortLabel:  'Books',
    colourHex:   '#b87820',   // Happy Together — warm amber
    verb:        'read',
    badgeBg:     'rgba(184,120,32,0.75)',
    badgeBorder: 'rgba(184,120,32,0.55)',
    isVisual:    true,
    emptyState: {
      headline: "Books you'll actually read",
      body:     'Every book that sounds exactly right — saved here until you\'re ready.',
      cta:      'Save a book',
    },
  },
  {
    id:          'tv',
    label:       'TV Shows',
    labelPlural: 'TV Shows',
    shortLabel:  'TV',
    colourHex:   '#155a8a',   // Fallen Angels — steel blue
    verb:        'watched',
    badgeBg:     'rgba(21,90,138,0.75)',
    badgeBorder: 'rgba(21,90,138,0.55)',
    isVisual:    true,
    emptyState: {
      headline: 'Your next obsession',
      body:     'When someone says "just start it" — save it here so you actually do.',
      cta:      'Save a show',
    },
  },
  {
    id:          'music',
    label:       'Music',
    labelPlural: 'Music',
    shortLabel:  'Music',
    colourHex:   '#9a1572',   // Days of Being Wild — deep magenta
    verb:        'listened to',
    badgeBg:     'rgba(154,21,114,0.75)',
    badgeBorder: 'rgba(154,21,114,0.55)',
    isVisual:    true,
    emptyState: {
      headline: 'Music worth remembering',
      body:     'That album someone played in the car. The artist from the podcast. Save them here.',
      cta:      'Save something to listen to',
    },
  },
  {
    id:          'restaurant',
    label:       'Food',
    labelPlural: 'Food',
    shortLabel:  'Food',
    colourHex:   '#c8151e',   // In the Mood for Love — cheongsam crimson
    verb:        'went to',
    badgeBg:     'rgba(200,21,30,0.75)',
    badgeBorder: 'rgba(200,21,30,0.55)',
    isVisual:    false,
    emptyState: {
      headline: 'The next great meal is waiting',
      body:     'When someone says "you have to try this place," save it here in seconds.',
      cta:      'Save a place to eat',
    },
  },
  {
    id:          'bar',
    label:       'Clubs',
    labelPlural: 'Clubs',
    shortLabel:  'Clubs',
    colourHex:   '#6a15c8',   // 2046 — deep violet
    verb:        'went to',
    badgeBg:     'rgba(106,21,200,0.75)',
    badgeBorder: 'rgba(106,21,200,0.55)',
    isVisual:    false,
    emptyState: {
      headline: 'Your next favourite spot',
      body:     'That rooftop someone mentioned. The bar from the article. Save them here.',
      cta:      'Save a bar or club',
    },
  },
  {
    id:          'city',
    label:       'City',
    labelPlural: 'Cities',
    shortLabel:  'City',
    colourHex:   '#1fce94',   // Ashes of Time — the neon, same as brand
    verb:        'visited',
    badgeBg:     'rgba(31,206,148,0.75)',
    badgeBorder: 'rgba(31,206,148,0.55)',
    isVisual:    true,
    emptyState: {
      headline: 'Places worth going',
      body:     'Every city someone makes sound unmissable — saved here with who told you.',
      cta:      'Save a place',
    },
  },
  {
    id:          'activity',
    label:       'Go & Do',
    labelPlural: 'Go & Do',
    shortLabel:  'Go & Do',
    colourHex:   '#158a6a',   // teal — the doing colour
    verb:        'did',
    badgeBg:     'rgba(21,138,106,0.75)',
    badgeBorder: 'rgba(21,138,106,0.55)',
    isVisual:    false,
    emptyState: {
      headline: 'Things worth doing',
      body:     'The hike, the class, the experience someone keeps telling you about.',
      cta:      'Save something to do',
    },
  },
]

export function getCategoryConfig(id: CategoryId | string): CategoryConfig {
  const config = CATEGORIES.find(c => c.id === id)
  // Graceful fallback — never throw, return first category
  return config ?? CATEGORIES[0]
}

// Visual categories get poster cards (image-led)
// Non-visual get split cards (text-led with colour bar)
export function isVisualCategory(id: CategoryId | string): boolean {
  return CATEGORIES.find(c => c.id === id)?.isVisual ?? false
}

// For backwards compatibility — physical = non-visual in new system
export function isPhysicalCategory(id: CategoryId | string): boolean {
  return !isVisualCategory(id)
}
