// constants/categories.ts
// Taareef — 8 experience-based category configurations
// Folk palette on WKW dark canvas

import type { Category } from '@/lib/types'

export type CategoryId = Category

export type CategoryConfig = {
  id: CategoryId
  label: string
  verb: string
  verbPast: string
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  vividColor: string
  wkwFilm: string
  emptyHeadline: string
  emptyBody: string
  emptyCta: string
  statusOptions: string[]
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'watch',
    label: 'Watch',
    verb: 'I watched',
    verbPast: 'watched',
    gradientFrom: '#060e2a',
    gradientVia: '#0e2870',
    gradientTo: '#1a4fad',
    vividColor: '#1a4fad',
    wkwFilm: 'Chungking Express',
    emptyHeadline: 'Films worth watching',
    emptyBody: 'Every film someone swears by — saved here, ready for the next free evening.',
    emptyCta: 'Save a film or show',
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
  {
    id: 'listen',
    label: 'Listen',
    verb: 'I listened to',
    verbPast: 'listened to',
    gradientFrom: '#2a0620',
    gradientVia: '#7a0a48',
    gradientTo: '#c8187a',
    vividColor: '#c8187a',
    wkwFilm: 'Days of Being Wild',
    emptyHeadline: 'Music worth remembering',
    emptyBody: 'That album someone played in the car. The artist from the podcast. Save them here.',
    emptyCta: 'Save something to listen to',
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
  {
    id: 'read',
    label: 'Read',
    verb: 'I read',
    verbPast: 'read',
    gradientFrom: '#1e0a00',
    gradientVia: '#7a3200',
    gradientTo: '#f0860a',
    vividColor: '#f0860a',
    wkwFilm: 'Happy Together',
    emptyHeadline: 'Books you will actually read',
    emptyBody: 'Every book that sounds exactly right — saved here until you are ready.',
    emptyCta: 'Save a book',
    statusOptions: ['saved', 'reading', 'finished', 'abandoned', 'dismissed'],
  },
  {
    id: 'eat',
    label: 'Eat',
    verb: 'I went to',
    verbPast: 'went to',
    gradientFrom: '#1e0006',
    gradientVia: '#820a1c',
    gradientTo: '#d41020',
    vividColor: '#d41020',
    wkwFilm: 'In the Mood for Love',
    emptyHeadline: 'The next great meal is waiting',
    emptyBody: 'When someone says you have to try this place, save it here in seconds.',
    emptyCta: 'Save a restaurant',
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
  {
    id: 'drink',
    label: 'Drink',
    verb: 'I went to',
    verbPast: 'went to',
    gradientFrom: '#0e0620',
    gradientVia: '#3a1480',
    gradientTo: '#4a22a8',
    vividColor: '#4a22a8',
    wkwFilm: '2046',
    emptyHeadline: 'Your next favourite bar',
    emptyBody: 'That rooftop someone mentioned. The cocktail bar from the article. Save them here.',
    emptyCta: 'Save a bar',
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
  {
    id: 'go',
    label: 'Go',
    verb: 'I went to',
    verbPast: 'went to',
    gradientFrom: '#020e08',
    gradientVia: '#065530',
    gradientTo: '#0a9e5a',
    vividColor: '#0a9e5a',
    wkwFilm: 'Ashes of Time',
    emptyHeadline: 'Places worth going',
    emptyBody: 'Every city someone makes sound unmissable — saved here with who told you.',
    emptyCta: 'Save a place',
    statusOptions: ['saved', 'visited', 'dismissed'],
  },
  {
    id: 'do',
    label: 'Do',
    verb: 'I did',
    verbPast: 'did',
    gradientFrom: '#021210',
    gradientVia: '#065550',
    gradientTo: '#0a8a80',
    vividColor: '#0a8a80',
    wkwFilm: 'The Grandmaster',
    emptyHeadline: 'Things worth doing',
    emptyBody: 'The hike, the class, the experience someone keeps telling you about. Save it here.',
    emptyCta: 'Save an activity',
    statusOptions: ['saved', 'done', 'dismissed'],
  },
  {
    id: 'see',
    label: 'See',
    verb: 'I saw',
    verbPast: 'saw',
    gradientFrom: '#020c18',
    gradientVia: '#064870',
    gradientTo: '#0a6fa8',
    vividColor: '#0a6fa8',
    wkwFilm: 'Fallen Angels',
    emptyHeadline: 'Things worth witnessing',
    emptyBody: 'The exhibition, the performance, the concert someone says you would love. Save it here.',
    emptyCta: 'Save something to see',
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, CategoryConfig>

export function getCategoryConfig(id: CategoryId): CategoryConfig {
  return CATEGORY_MAP[id]
}

export function getCategoryGradient(id: CategoryId): string {
  const c = CATEGORY_MAP[id]
  return `linear-gradient(148deg, ${c.gradientFrom} 0%, ${c.gradientVia} 50%, ${c.gradientTo} 100%)`
}

export function getCategoryBloom(id: CategoryId): string {
  const c = CATEGORY_MAP[id]
  return `radial-gradient(ellipse at 25% 20%, ${c.gradientTo}55 0%, transparent 55%),
          radial-gradient(ellipse at 75% 70%, ${c.gradientVia}44 0%, transparent 45%),
          linear-gradient(148deg, ${c.gradientFrom} 0%, ${c.gradientVia} 50%, ${c.gradientTo} 100%)`
}
