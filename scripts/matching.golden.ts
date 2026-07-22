// scripts/matching.golden.ts
// Golden regression tests for lib/places/matching.ts — every real-world
// case we have debugged, encoded permanently. Run before touching any
// dial in the matching module:
//
//   npx tsx scripts/matching.golden.ts
//
// Exit code 0 = all pass. Any failure prints the case and exits 1.

import {
  hasNameOverlap, isStrictExact, extractLocality, hintMatchesAddress,
  type GoogleAddressComponent,
} from '../lib/places/matching'

let failures = 0
function check(name: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  console.log(`${ok ? '✓' : '✗ FAIL'}  ${name}  →  ${String(actual)} (want ${String(expected)})`)
  if (!ok) failures++
}

// ── Plausibility (Layer 2) — loose on purpose ──────────────────────
check('plausible: Gokul Bar ~ Gokul Bite',        hasNameOverlap('Gokul Bar', 'Gokul Bite'), true)
check('plausible: Gokul Bar ~ Bademiya rejected', hasNameOverlap('Gokul Bar', 'Bademiya'), false)

// ── Strict exactness (Layer 5a) — the Gokul Bite lesson ────────────
const colabaAddr  = '12, Colaba Causeway, Colaba, Mumbai, Maharashtra 400001, India'
const khopoliAddr = 'Khopoli-Pali Road, Khopoli, Maharashtra 410203, India'

check('exact: Gokul Bar vs Gokul Bite DEMOTED (name)',
  isStrictExact('Gokul Bar', 'Gokul Bite'), false)
check('exact: Gokul Bar vs Gokul Bite DEMOTED even with address',
  isStrictExact('Gokul Bar', 'Gokul Bite', colabaAddr), false)
check('exact: Gokul Bar vs Bademiya DEMOTED',
  isStrictExact('Gokul Bar', 'Bademiya', colabaAddr), false)
check('exact: Leopold Cafe vs Leopold Café & Bar KEPT (diacritics)',
  isStrictExact('Leopold Cafe', 'Leopold Café & Bar'), true)
check('exact: Dishoom vs Dishoom Carnaby KEPT',
  isStrictExact('Dishoom', 'Dishoom Carnaby'), true)
check('exact: Old Street Bar vs Old Street Café & Bar KEPT',
  isStrictExact('Old Street Bar', 'Old Street Café & Bar'), true)
check('exact: Gateway of India KEPT (articles ignored)',
  isStrictExact('Gateway of India', 'Gateway of India'), true)
// The Imagicaa lesson: user-appended location words are absorbed by the ADDRESS
check('exact: Imagicaa Khopoli vs Imagicaa + address KEPT',
  isStrictExact('Imagicaa Khopoli', 'Imagicaa', khopoliAddr), true)
check('exact: Imagicaa Khopoli vs Imagicaa, NO address DEMOTED',
  isStrictExact('Imagicaa Khopoli', 'Imagicaa', null), false)

// ── Structured locality (Layer 3) ──────────────────────────────────
const gatewayComponents: GoogleAddressComponent[] = [
  { longText: 'Apollo Bandar', shortText: 'Apollo Bandar', types: ['sublocality_level_1', 'sublocality'] },
  { longText: 'Colaba',        shortText: 'Colaba',        types: ['sublocality_level_2'] },
  { longText: 'Mumbai',        shortText: 'Mumbai',        types: ['locality'] },
  { longText: 'Maharashtra',   shortText: 'MH',            types: ['administrative_area_level_1'] },
  { longText: 'India',         shortText: 'IN',            types: ['country'] },
]
check('locality: finest-grained wins (Apollo Bandar)',
  extractLocality(gatewayComponents, null), 'Apollo Bandar')
check('locality: falls back to hint when no components',
  extractLocality(undefined, 'Colaba'), 'Colaba')

// ── Geographic consistency (Layer 5b) — the Gateway lesson ─────────
check('geo: hint "Mumbai" matches Gateway (city in components)',
  hintMatchesAddress('Mumbai', gatewayComponents, 'Apollo Bandar, Colaba, Mumbai, India'), true)
check('geo: hint "Colaba" matches Gateway',
  hintMatchesAddress('Colaba', gatewayComponents, 'Apollo Bandar, Colaba, Mumbai, India'), true)
check('geo: hint "Bandra" does NOT match Gateway',
  hintMatchesAddress('Bandra', gatewayComponents, 'Apollo Bandar, Colaba, Mumbai, India'), false)

console.log(failures === 0 ? '\nALL GOLDEN CASES PASS' : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
