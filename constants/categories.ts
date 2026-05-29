// constants/categories.ts
// 6 experience-based categories — design spec locked.
// Color system: Albers/Itten. Each category has a vivid color family.
// The vividColor is full saturation — no compromises.
// The gradient starts at 100% vivid and dissolves to matte black.

import type { Category } from '@/lib/types'

export type CategoryId = Category

export type CategoryConfig = {
  id: CategoryId
  label: string
  verb: string
  verbPast: string
  vividColor: string   // pure hex — full saturation, no alpha
  vividRgb: string     // "r,g,b" — for rgba() construction
  deepDark: string     // card info zone background — same hue family, near-black
  emptyHeadline: string
  emptyBody: string
  emptyCta: string
  nudges: string[]     // max 3 — subcategory pills on tile
  statusOptions: string[]
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'watch',
    label: 'Watch',
    verb: 'I watched',
    verbPast: 'watched',
    vividColor: '#4A8FFF',   // cobalt — saturated, readable on dark
    vividRgb: '74,143,255',
    deepDark: '#030810',
    emptyHeadline: 'Films worth watching',
    emptyBody: 'Every film someone swears by — saved here, ready for the next free evening.',
    emptyCta: 'Save a film or show',
    nudges: ['Film', 'Series', 'Doc'],
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
  {
    id: 'listen',
    label: 'Listen',
    verb: 'I listened to',
    verbPast: 'listened to',
    vividColor: '#E8449A',   // rani pink — vivid magenta, unmistakable
    vividRgb: '232,68,154',
    deepDark: '#090206',
    emptyHeadline: 'Music worth remembering',
    emptyBody: 'That album someone played in the car. The artist from the podcast.',
    emptyCta: 'Save something to listen to',
    nudges: ['Album', 'Song', 'Podcast'],
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
  {
    id: 'read',
    label: 'Read',
    verb: 'I read',
    verbPast: 'read',
    vividColor: '#F59B1E',   // saffron — warm amber, the most Indian color
    vividRgb: '245,155,30',
    deepDark: '#080401',
    emptyHeadline: 'Books you will actually read',
    emptyBody: 'Every book that sounds exactly right — saved here until you are ready.',
    emptyCta: 'Save a book',
    nudges: ['Fiction', 'Non-fiction', 'Poetry'],
    statusOptions: ['saved', 'reading', 'finished', 'abandoned', 'dismissed'],
  },
  {
    id: 'dine',
    label: 'Dine',
    verb: 'I went to',
    verbPast: 'went to',
    vividColor: '#E05C2A',   // terracotta — warm, earthy, appetizing
    vividRgb: '224,92,42',
    deepDark: '#090300',
    emptyHeadline: 'The next great meal is waiting',
    emptyBody: 'When someone says you have to try this place, save it here in seconds.',
    emptyCta: 'Save a place',
    nudges: ['Restaurant', 'Bar', 'Café'],
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
  {
    id: 'do',
    label: 'Do',
    verb: 'I did',
    verbPast: 'did',
    vividColor: '#12CEC0',   // jaipur teal — clear, energetic, outdoors
    vividRgb: '18,206,192',
    deepDark: '#010e0d',
    emptyHeadline: 'Things worth doing',
    emptyBody: 'The hike, the class, the experience someone keeps telling you about.',
    emptyCta: 'Save an activity',
    nudges: ['Hike', 'Adventure', 'Ride'],
    statusOptions: ['saved', 'done', 'dismissed'],
  },
  {
    id: 'visit',
    label: 'Visit',
    verb: 'I visited',
    verbPast: 'visited',
    vividColor: '#1E9FEB',   // cerulean — considered, cultural, Mughal blue
    vividRgb: '30,159,235',
    deepDark: '#010810',
    emptyHeadline: 'Things worth witnessing',
    emptyBody: 'The exhibition, the concert, the performance someone says you would love.',
    emptyCta: 'Save something to visit',
    nudges: ['Exhibition', 'Concert', 'Theatre'],
    statusOptions: ['saved', 'experienced', 'dismissed'],
  },
]

// ── LOOKUP ────────────────────────────────────────────────────────

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, CategoryConfig>

export function getCategoryConfig(id: CategoryId): CategoryConfig {
  return CATEGORY_MAP[id]
}

// Tile gradient — vivid floods left, dissolves right to matte black
// Left edge: full opacity. Vivid holds to 55% before dissolving.
export function getTileGradient(id: CategoryId): string {
  const c = CATEGORY_MAP[id]
  return `linear-gradient(105deg,
    rgba(${c.vividRgb},1.0)  0%,
    rgba(${c.vividRgb},0.80) 30%,
    rgba(${c.vividRgb},0.35) 55%,
    rgba(${c.vividRgb},0.08) 75%,
    rgba(17,17,17,1)          100%)`
}

// Card image zone gradient — Criterion mode (no poster)
// WKW radial bloom from top-left corner, dissolves to deepDark
export function getCardGradient(id: CategoryId): string {
  const c = CATEGORY_MAP[id]
  return [
    `radial-gradient(ellipse at 28% 20%, rgba(${c.vividRgb},0.80) 0%, transparent 48%)`,
    `radial-gradient(ellipse at 72% 65%, rgba(${c.vividRgb},0.50) 0%, transparent 44%)`,
    `radial-gradient(ellipse at 50% 95%, rgba(${c.vividRgb},0.35) 0%, transparent 38%)`,
    `linear-gradient(150deg, ${c.deepDark} 0%, #111111 100%)`,
  ].join(', ')
}

// Vignette — dissolves from poster/gradient to deepDark
// Shared hue family = no hard edge, organic transition
export function getCardVignette(id: CategoryId): string {
  const c = CATEGORY_MAP[id]
  const d = c.deepDark
  const r = parseInt(d.slice(1, 3), 16)
  const g = parseInt(d.slice(3, 5), 16)
  const b = parseInt(d.slice(5, 7), 16)
  return [
    `linear-gradient(to top,`,
    `${d} 0%,`,
    `rgba(${r},${g},${b},0.95) 18%,`,
    `rgba(${r},${g},${b},0.75) 40%,`,
    `rgba(${r},${g},${b},0.30) 65%,`,
    `rgba(${r},${g},${b},0.05) 85%,`,
    `transparent 100%)`,
  ].join(' ')
}
