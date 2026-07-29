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
    id: 'example-leopold',
    title: 'Leopold Cafe & Bar',
    category: 'dine',
    source_type: 'friend',
    source_name: 'Rohit',
    notes: 'Sit upstairs, order the beer',
    image_url: null, // TODO: set to '/examples/leopold.jpeg' once the file is uploaded
    status: 'saved',
    reaction: null,
    metadata: {
      subtype: 'café',
      city: 'Mumbai',
      neighbourhood: 'Bandra',
    },
  },
  {
    id: 'example-the-fall-off',
    title: 'The Fall Off',
    category: 'listen',
    source_type: 'friend',
    source_name: 'Zaid',
    notes: 'Worth the wait',
    image_url: null, // TODO: set to '/examples/the-fall-off.jpeg' once the file is uploaded
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'album', artist: 'J. Cole' },
  },
  {
    id: 'example-midnights-children',
    title: 'Midnight\u2019s Children',
    category: 'read',
    source_type: 'family',
    source_name: 'Amma',
    notes: 'Take your time with it',
    image_url: null, // TODO: set to '/examples/midnights-children.jpeg' once the file is uploaded
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'fiction', author: 'Salman Rushdie', release_year: 1981 },
  },
  {
    id: 'example-annapurna',
    title: 'Annapurna Circuit',
    category: 'do',
    source_type: 'friend',
    source_name: 'Nikhil',
    notes: 'Go in October, before the snow',
    image_url: null,
    status: 'saved',
    reaction: null,
    metadata: { subtype: 'trail', difficulty: 'Hard', city: 'Nepal' },
  },
  {
    id: 'example-shivaji-museum',
    title: 'Shivaji Museum',
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
