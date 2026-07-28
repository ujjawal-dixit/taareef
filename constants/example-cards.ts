// constants/example-cards.ts
// Seeded example cards shown during onboarding demo vault.
// These are read-only — never written to Supabase.
// Dismissed automatically after 3 real saves (taareef_example_save_count in localStorage).
// Can be individually dismissed via the example chip × button.

export interface ExampleCard {
  id: string
  title: string
  category: 'watch' | 'listen' | 'read' | 'dine' | 'do' | 'visit'
  source_type: 'friend' | 'family' | 'colleague' | 'instagram' | 'twitter' | 'youtube' | 'article' | 'newsletter' | 'podcast' | 'self'
  source_name: string
  notes: string
  image_url: string | null
  status: 'saved'
  reaction: null
  metadata: Record<string, unknown>
}

export const EXAMPLE_CARDS: ExampleCard[] = [
  {
    id: 'example-parasite',
    title: 'Parasite',
    category: 'watch',
    source_type: 'friend',
    source_name: 'Ahmed',
    notes: 'Watch it knowing nothing',
    image_url: '/examples/parasite.jpg',
    status: 'saved',
    reaction: null,
    metadata: {
      subtype: 'film',
      director: 'Bong Joon-ho',
      release_year: 2019,
      genres: ['Drama', 'Thriller'],
      runtime_minutes: 132,
    },
  },
  {
    id: 'example-pali-village',
    title: 'Pali Village Café',
    category: 'dine',
    source_type: 'friend',
    source_name: 'Rohit',
    notes: 'Try the eggs benedict',
    image_url: null,
    status: 'saved',
    reaction: null,
    metadata: {
      subtype: 'café',
      city: 'Mumbai',
      neighbourhood: 'Bandra',
    },
  },
  {
    id: 'example-currents',
    title: 'Currents',
    category: 'listen',
    source_type: 'self',
    source_name: 'that drive home',
    notes: 'Best album for a long drive',
    image_url: '/examples/currents.jpg',
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'album', artist: 'Tame Impala', release_year: 2015, genres: ['Psychedelic rock'] },
  },
  {
    id: 'example-midnights-children',
    title: 'Midnight\u2019s Children',
    category: 'read',
    source_type: 'family',
    source_name: 'Amma',
    notes: 'Take your time with it',
    image_url: '/examples/midnights-children.jpg',
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'fiction', author: 'Salman Rushdie', release_year: 1981 },
  },
  {
    id: 'example-kalsubai',
    title: 'Kalsubai Trek',
    category: 'do',
    source_type: 'friend',
    source_name: 'Nikhil',
    notes: 'Start at 4am, catch the sunrise',
    image_url: null,
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'trail', difficulty: 'Moderate', city: 'Ahmednagar' },
  },
  {
    id: 'example-csmvs',
    title: 'Chhatrapati Shivaji Museum',
    category: 'visit',
    source_type: 'friend',
    source_name: 'Sara',
    notes: 'The miniature paintings upstairs',
    image_url: null,
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'museum', city: 'Mumbai', neighbourhood: 'Fort' },
  },
]

export const EXAMPLE_CARD_IDS = EXAMPLE_CARDS.map((c) => c.id)

export function isExampleCard(id: string): boolean {
  return EXAMPLE_CARD_IDS.includes(id)
}

// localStorage key tracking how many real saves the user has made
export const EXAMPLE_SAVE_COUNT_KEY = 'taareef_example_save_count'
// localStorage key tracking individually dismissed example card ids
export const EXAMPLE_DISMISSED_KEY = 'taareef_examples_dismissed'
// Number of real saves after which all example cards auto-disappear
export const EXAMPLE_AUTO_DISMISS_AFTER = 3
