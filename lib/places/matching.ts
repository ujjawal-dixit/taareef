// lib/places/matching.ts
// The pure logic of place matching — extracted from the enrich route so
// it can be tested in isolation. Every function here is deterministic:
// strings in, verdicts out, no I/O. The golden test file
// (scripts/matching.golden.ts) runs these against every real-world case
// we have ever debugged; run it before touching any dial in this file.

// ── Types (structured address data from Google Places API New) ──────
export interface GoogleAddressComponent {
  longText:  string
  shortText: string
  types:     string[]
}

// ── String distance ─────────────────────────────────────────────────
export function levenshtein(a: string, b: string): number {
  const m: number[][] = []
  for (let i = 0; i <= b.length; i++) m[i] = [i]
  for (let j = 0; j <= a.length; j++) m[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1)
    }
  }
  return m[b.length][a.length]
}

/** 0–100 similarity between two strings (case-insensitive). */
export function calculateConfidence(query: string, result: string): number {
  const a = query.toLowerCase()
  const b = result.toLowerCase()
  const dist = levenshtein(a, b)
  const len  = Math.max(a.length, b.length)
  return len === 0 ? 0 : Math.round((1 - dist / len) * 100)
}

// ── Plausibility (Layer 2) ──────────────────────────────────────────
// Asks: "is this candidate plausibly related to the user's title?"
// Deliberately loose — venue-type words are noise here, because
// 'Gokul Bite' IS plausible for 'Gokul Bar'.
export const NOISE_WORDS = new Set([
  'bar', 'restaurant', 'cafe', 'café', 'hotel', 'house',
  'the', 'and', 'or', 'of', 'at', 'in', 'by', 'new',
])

export function tokenise(name: string): Set<string> {
  return new Set(
    name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !NOISE_WORDS.has(w))
  )
}

export function hasNameOverlap(userTitle: string, candidateName: string): boolean {
  const titleTokens     = tokenise(userTitle)
  const candidateTokens = tokenise(candidateName)
  for (const word of titleTokens) {
    if (candidateTokens.has(word)) return true
  }
  const titleLower     = userTitle.toLowerCase()
  const candidateLower = candidateName.toLowerCase()
  if (candidateLower.includes(titleLower) || titleLower.includes(candidateLower)) return true
  return calculateConfidence(userTitle, candidateName) >= 55
}

// ── Strict exactness (Layer 5a) ─────────────────────────────────────
// Asks: "is this the SAME place?" — a different question with a
// different word set. 'bar' is significant here: it distinguishes
// Bar from Bite. Only pure articles are ignored.
// Plausible ≠ exact — that distinction is the Gokul Bite lesson.
export const ARTICLES = new Set(['the', 'and', 'or', 'of', 'at', 'in', 'by', 'a', 'an'])

/** Strip diacritics so Café === Cafe (protects real matches, e.g. Leopold). */
export function normalise(w: string): string {
  return w.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function significantTokens(name: string): string[] {
  return normalise(name.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !ARTICLES.has(w))
}

/**
 * Every significant word of the user's title must be accounted for.
 * A word is accounted for when it appears in the venue NAME (exactly,
 * as a substring, or as a close ≥80% variant — handles plurals and
 * spellings), OR appears as an exact token in the venue ADDRESS.
 *
 * The address rule absorbs location words users naturally append
 * ("Imagicaa World Khopoli" — 'khopoli' lives in the address), while
 * staying strict where it matters: address matching is exact-token
 * only, so 'bar' can never be accounted for by 'Bandra' or 'Barrack
 * Road', and Gokul Bar vs Gokul Bite stays demoted.
 */
export function isStrictExact(
  userTitle:     string,
  candidateName: string,
  candidateAddress?: string | null,
): boolean {
  const titleTokens = significantTokens(userTitle)
  const candTokens  = significantTokens(candidateName)
  if (titleTokens.length === 0) return false

  const addressTokens = candidateAddress
    ? new Set(significantTokens(candidateAddress))
    : new Set<string>()

  return titleTokens.every(t =>
    candTokens.some(c => c === t || c.includes(t) || t.includes(c) ||
      calculateConfidence(t, c) >= 80)
    || addressTokens.has(t)
  )
}

// ── Structured locality (Layer 3) ───────────────────────────────────
// Reads Google's labelled address segments — no comma-counting, no
// regex fragility, no "Maharashtra 400001" leaking into the card.
export function extractLocality(
  components: GoogleAddressComponent[] | undefined,
  fallback:   string | null,
): string | null {
  if (!components?.length) return fallback
  const priority = [
    'sublocality_level_1',
    'sublocality_level_2',
    'sublocality',
    'neighborhood',
    'locality',
  ]
  for (const type of priority) {
    const match = components.find(c => c.types.includes(type))
    if (match) return match.longText
  }
  return fallback
}

// ── Geographic consistency (Layer 5b) ───────────────────────────────
// Users think in cities; Google answers in neighbourhoods. The hint
// must be tested against the WHOLE address — every labelled component
// plus the formatted string — not just the finest-grained locality.
// "Mumbai" matches Gateway of India even though its locality is
// "Apollo Bandar". (This was the Gateway of India lesson.)
export function hintMatchesAddress(
  locationHint:     string,
  components:       GoogleAddressComponent[] | undefined,
  formattedAddress: string | null | undefined,
): boolean {
  const haystack = [
    ...(components ?? []).flatMap(c => [c.longText, c.shortText]),
    formattedAddress ?? '',
  ].join(' ').toLowerCase()

  const hintWords = locationHint.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2)
  if (hintWords.length === 0) return true   // nothing meaningful to contradict
  return hintWords.some(w => haystack.includes(w))
}

// ── Display formatting ──────────────────────────────────────────────
/** "indian_restaurant" → "Indian Restaurant" */
export function formatPrimaryType(primaryType: string | undefined): string | null {
  if (!primaryType) return null
  return primaryType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}
