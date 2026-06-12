// constants/categories.ts
// 6 experience-based categories — design spec locked.
// Every color, gradient, nudge, verb, and empty state lives here.
// Components never hardcode category data.
// Updated: Session 9 — subcategories corrected per product decisions.

import type { Category } from '@/lib/types'

export type CategoryId = Category

export type CategoryConfig = {
  id:            CategoryId
  label:         string
  verb:          string
  verbPast:      string
  infinitive:    string   // base form for the "to ___" vow
  participle:    string   // adjectival past for "Mark as ___" + experienced badge
  vividColor:    string   // pure hex — for borders, glows, badges
  vividRgb:      string   // "r,g,b" — for rgba() in gradient strings
  deepDark:      string   // info zone bg — deepest dark of this color family
  emptyHeadline: string
  emptyBody:     string
  emptyCta:      string
  nudges:        string[] // subcategory labels — filter pills + capture chips; must match saved subtype values (case-insensitive)
  statusOptions: string[]
  notePlaceholders: string[] // rotating micro-prompts for note field
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id:           'watch',
    label:        'Watch',
    verb:         'I watched',
    verbPast:     'watched',
    infinitive:   'watch',
    participle:   'watched',
    vividColor:   '#3C82FF',
    vividRgb:     '60,130,255',
    deepDark:     '#030810',
    emptyHeadline:'Films worth watching',
    emptyBody:    'Every film someone swears by — saved here, ready for the next free evening.',
    emptyCta:     'Save a film or show',
    nudges:       ['Film', 'Series', 'Documentary'],
    statusOptions:['saved', 'experienced', 'dismissed'],
    notePlaceholders: [
      'Watch it knowing nothing…',
      'What made you save this?',
      'Who is this person to you?',
      'What are you hoping to feel?',
      'Best watched alone or with someone?',
    ],
  },
  {
    id:           'listen',
    label:        'Listen',
    verb:         'I listened to',
    verbPast:     'listened to',
    infinitive:   'listen',
    participle:   'listened',
    vividColor:   '#DC3C82',
    vividRgb:     '220,60,130',
    deepDark:     '#090206',
    emptyHeadline:'Music worth remembering',
    emptyBody:    'That album someone played in the car. The artist from the podcast. Save them here.',
    emptyCta:     'Save something to listen to',
    nudges:       ['Album', 'Podcast', 'Audiobook', 'Artist'],
    statusOptions:['saved', 'experienced', 'dismissed'],
    notePlaceholders: [
      'What does this sound like?',
      'When did you first hear this?',
      'What mood does it fit?',
      'What drew you to this?',
      'Who are they, to you?',
    ],
  },
  {
    id:           'read',
    label:        'Read',
    verb:         'I read',
    verbPast:     'read',
    infinitive:   'read',
    participle:   'read',
    vividColor:   '#F09114',
    vividRgb:     '240,145,20',
    deepDark:     '#080401',
    emptyHeadline:'Books worth reading',
    emptyBody:    'Every book that sounds exactly right — saved here until you are ready.',
    emptyCta:     'Save a book',
    nudges:       ['Fiction', 'Non-fiction', 'Poetry'],
    statusOptions:['saved', 'reading', 'finished', 'abandoned', 'dismissed'],
    notePlaceholders: [
      'Why does this feel like the right time?',
      'What made you save this?',
      'What are you hoping to find in it?',
      'Who told you, and why did you trust them?',
      'One line about why this matters.',
    ],
  },
  {
    id:           'dine',
    label:        'Dine',
    verb:         'I went to',
    verbPast:     'went to',
    infinitive:   'dine',
    participle:   'dined',
    vividColor:   '#DA5526',
    vividRgb:     '218,85,38',
    deepDark:     '#090300',
    emptyHeadline:'The next great meal is waiting',
    emptyBody:    'When someone says you have to try this place, save it here in seconds.',
    emptyCta:     'Save a place',
    nudges:       ['Restaurant', 'Café', 'Bar', 'Street food'],
    statusOptions:['saved', 'experienced', 'dismissed'],
    notePlaceholders: [
      'Any occasion in mind?',
      'What did they say about it?',
      'Best time to go?',
      'Who would you take?',
      'What makes this one special?',
    ],
  },
  {
    id:           'do',
    label:        'Do',
    verb:         'I did',
    verbPast:     'did',
    infinitive:   'do',
    participle:   'done',
    vividColor:   '#10C3B6',
    vividRgb:     '16,195,182',
    deepDark:     '#010e0d',
    emptyHeadline:'Things worth doing',
    emptyBody:    'The hike, the trail, the workshop someone keeps telling you about.',
    emptyCta:     'Save an activity',
    nudges:       ['Hike', 'Trail', 'Adventure', 'Workshop', 'Live show'],
    statusOptions:['saved', 'done', 'dismissed'],
    notePlaceholders: [
      'What level of effort does this take?',
      'Who would you do this with?',
      'Why did this catch your attention?',
      'Best season or time for it?',
      'What are you hoping to experience?',
    ],
  },
  {
    id:           'visit',
    label:        'Visit',
    verb:         'I visited',
    verbPast:     'visited',
    infinitive:   'visit',
    participle:   'visited',
    vividColor:   '#1991E1',
    vividRgb:     '25,145,225',
    deepDark:     '#010810',
    emptyHeadline:'Things worth witnessing',
    emptyBody:    'The museum, the gallery, the viewpoint someone says you would love.',
    emptyCta:     'Save something to visit',
    nudges:       ['Museum', 'Gallery', 'Heritage', 'Viewpoint', 'Market'],
    statusOptions:['saved', 'experienced', 'dismissed'],
    notePlaceholders: [
      'Does this have a closing date?',
      'Who would you go with?',
      'What is the urgency here?',
      'What drew you to this?',
      'Would you go alone or with someone?',
    ],
  },
]

// ── LOOKUP ────────────────────────────────────────────────────────

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, CategoryConfig>

export function getCategoryConfig(id: CategoryId): CategoryConfig {
  return CATEGORY_MAP[id]
}

// Tile gradient — vivid left wash dissolving right to matte black
export function getTileGradient(id: CategoryId): string {
  const c = CATEGORY_MAP[id]
  return `linear-gradient(100deg, rgba(${c.vividRgb},0.90) 0%, rgba(${c.vividRgb},0.28) 42%, rgba(17,17,17,0.98) 100%)`
}

// Card image zone gradient — Criterion mode (no poster)
export function getCardGradient(id: CategoryId): string {
  const c = CATEGORY_MAP[id]
  return [
    `radial-gradient(ellipse at 32% 22%, rgba(${c.vividRgb},0.75) 0%, transparent 45%)`,
    `radial-gradient(ellipse at 70% 65%, rgba(${c.vividRgb},0.45) 0%, transparent 42%)`,
    `radial-gradient(ellipse at 50% 90%, rgba(${c.vividRgb},0.30) 0%, transparent 35%)`,
    `linear-gradient(148deg, ${c.deepDark} 0%, #111111 100%)`,
  ].join(', ')
}

// Vignette — dissolves to deepDark for seamless image→info transition
export function getCardVignette(id: CategoryId): string {
  const c = CATEGORY_MAP[id]
  const d = c.deepDark
  const r = parseInt(d.slice(1, 3), 16)
  const g = parseInt(d.slice(3, 5), 16)
  const b = parseInt(d.slice(5, 7), 16)
  return [
    `linear-gradient(to top,`,
    `${d} 0%,`,
    `rgba(${r},${g},${b},0.92) 22%,`,
    `rgba(${r},${g},${b},0.60) 48%,`,
    `rgba(${r},${g},${b},0.15) 75%,`,
    `transparent 100%)`,
  ].join(' ')
}
