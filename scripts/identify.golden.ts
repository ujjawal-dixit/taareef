// scripts/identify.golden.ts
//
//   npx tsx scripts/identify.golden.ts
//
// Deterministic half only: drift measurement, corroboration, and the decision
// rule. The model call is not tested here and cannot be — it needs a network
// and returns different text each time. That split is deliberate and is the
// same one the judge suite uses: everything that can silently write a wrong
// poster lives on THIS side of the line.
//
// The model itself is measured separately, by scripts/identify.eval.ts, which
// is an instrument rather than a gate.

import {
  letterKey, soundKey, editDistance, isSmallLeap,
  corroborate, decide, parseIdentification,
  isSuspectedHallucination, isSuspectedFabrication,
  verifyNamedPeople, effectivePeople,
  type IdentifyInput, type Identification,
} from '../lib/enrichment/identify'

let failures = 0
function check(name: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  console.log(`${ok ? '✓' : '✗ FAIL'}  ${name}  →  ${String(actual)} (want ${String(expected)})`)
  if (!ok) failures++
}

// ── Sound keys: the transliteration failures we actually hit ────────────────

check('sound: Jawaan and Jawan collapse together',
  soundKey('Jawaan') === soundKey('Jawan'), true)
check('sound: Javan collapses too (the v/w confusion)',
  soundKey('Javan') === soundKey('Jawan'), true)
check('sound: Jawaan and Pathaan do NOT collapse',
  soundKey('Jawaan') === soundKey('Pathaan'), false)
check('sound: different films with similar shapes stay distinct',
  soundKey('Jawan') === soundKey('Jaane'), false)

check('letters: punctuation and case are ignored',
  letterKey('Jawan!') === letterKey('jawan'), true)

check('edit: identical strings', editDistance('jawan', 'jawan'), 0)
check('edit: one substitution', editDistance('javan', 'jawan'), 1)
check('edit: one insertion',    editDistance('jawaan', 'jawan'), 1)

// ── Leap size ───────────────────────────────────────────────────────────────

check('leap: Jawaan → Jawan is small (typed)',   isSmallLeap('Jawaan', 'Jawan', 'type'), true)
check('leap: Javan → Jawan is small (typed)',    isSmallLeap('Javan', 'Jawan', 'type'), true)
check('leap: Javan → Jawan is small (spoken)',   isSmallLeap('Javan', 'Jawan', 'speak'), true)
check('leap: Gully Boy → Gali Boy is small',     isSmallLeap('Gali Boy', 'Gully Boy', 'type'), true)
check('leap: Jawaan → Pathaan is LARGE',         isSmallLeap('Jawaan', 'Pathaan', 'type'), false)
check('leap: Jawaan → Dilwale is LARGE',         isSmallLeap('Jawaan', 'Dilwale', 'type'), false)
check('leap: speech gets more room than typing',
  isSmallLeap('Vikaram Veda', 'Vikram Vedha', 'speak'), true)
check('leap: empty input is never a small leap',  isSmallLeap('', 'Jawan', 'type'), false)

// ── Fixtures ────────────────────────────────────────────────────────────────

const jawaanTyped: IdentifyInput = {
  title: 'Jawaan', people: ['Shah Rukh Khan'], year: 2024,
  modality: 'type', medium: 'film',
}

const identJawan: Identification = {
  known: true, title: 'Jawan', year: 2023, creator: 'Atlee',
  people: ['Shah Rukh Khan', 'Nayanthara'], namedPeople: [], reason: '',
}

const realJawan = {
  year: 2023, creator: 'Atlee',
  credits: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi'],
}

// ── The Jawaan case, end to end ─────────────────────────────────────────────

const corrJawan = corroborate(jawaanTyped, identJawan, realJawan)

check('jawaan: the named person IS found in real credits', corrJawan.userPersonFound, true)
check('jawaan: the model\'s claimed cast agrees',           corrJawan.peopleAgree, true)
check('jawaan: year agrees within a year (2024 vs 2023)',   corrJawan.yearAgrees, true)
check('jawaan: DECISION is confirm — no question asked',
  decide(jawaanTyped, identJawan, true, corrJawan), 'confirm')

// ── The famous-over-obscure trap: a LARGE leap with no corroboration ────────
// A model asked what someone meant gravitates to the well-known work. This
// must never happen silently.

const identPathaan: Identification = {
  known: true, title: 'Pathaan', year: 2023, creator: 'Siddharth Anand',
  people: ['Shah Rukh Khan'], namedPeople: [], reason: '',
}
const realPathaan = { year: 2023, creator: 'Siddharth Anand', credits: ['Shah Rukh Khan', 'Deepika Padukone'] }

check('trap: a large leap CORROBORATED by the named person still confirms',
  decide(jawaanTyped, identPathaan, true, corroborate(jawaanTyped, identPathaan, realPathaan)), 'confirm')

const noPeople: IdentifyInput = { title: 'Jawaan', modality: 'type', medium: 'film' }
const realOther = { year: 2019, creator: 'Someone Else', credits: ['Nobody Relevant'] }

check('trap: a large leap with NOTHING corroborating it must ASK',
  decide(noPeople, identPathaan, true, corroborate(noPeople, identPathaan, realOther)), 'show_and_ask')

// ── The morning bug: identical spelling, wrong film ─────────────────────────
// "Jawaan" scored 100/100 against the 2017 Telugu film and auto-confirmed.
// A small leap ALONE must never be enough.

const identTelugu: Identification = {
  known: true, title: 'Jawaan', year: 2017, creator: 'B. V. S. Ravi',
  people: ['Sai Durgha Tej'], namedPeople: [], reason: '',
}
const realTelugu = { year: 2017, creator: 'B. V. S. Ravi', credits: ['Sai Durgha Tej', 'Mehreen Pirzada'] }
const corrTelugu = corroborate(jawaanTyped, identTelugu, realTelugu)

check('telugu: the user\'s named person is NOT in these credits', corrTelugu.userPersonFound, false)
check('telugu: an exact-spelling match that CONTRADICTS the named person must ASK',
  decide(jawaanTyped, identTelugu, true, corrTelugu), 'show_and_ask')

// ── Credits unavailable must never be read as contradiction ────────────────

const noCredits = { year: 2023, creator: 'Atlee', credits: null }
const corrNoCredits = corroborate(jawaanTyped, identJawan, noCredits)

check('credits: unavailable is flagged, not silently empty', corrNoCredits.creditsAvailable, false)
check('credits: unavailable does not count as the person being found', corrNoCredits.userPersonFound, false)
check('credits: a small leap + agreeing year still confirms without credits',
  decide(jawaanTyped, identJawan, true, corrNoCredits), 'confirm')

// ── Not found / abstention ──────────────────────────────────────────────────

const unknown: Identification = { known: false, title: null, year: null, creator: null, people: [], namedPeople: [], reason: '' }

check('abstain: known:false is not_found',
  decide(jawaanTyped, unknown, false, corrJawan), 'not_found')
check('abstain: known:true but no catalogue record is not_found',
  decide(jawaanTyped, identJawan, false, corrJawan), 'not_found')

// ── Hallucination and fabrication detection ─────────────────────────────────

check('hallucination: confident claim + no record',
  isSuspectedHallucination(identJawan, false), true)
check('hallucination: honest known:false is NOT a hallucination',
  isSuspectedHallucination(unknown, false), false)
check('hallucination: confident claim WITH a record is not one',
  isSuspectedHallucination(identJawan, true), false)

check('fabrication: claimed cast absent from real credits',
  isSuspectedFabrication(identJawan, corroborate(jawaanTyped, identJawan, realTelugu)), true)
check('fabrication: claimed cast present is not fabrication',
  isSuspectedFabrication(identJawan, corrJawan), false)
check('fabrication: unreadable credits are never called fabrication',
  isSuspectedFabrication(identJawan, corrNoCredits), false)

// ── Parsing ─────────────────────────────────────────────────────────────────

check('parse: director key is read into creator',
  parseIdentification('{"known":true,"title":"Jawan","year":2023,"director":"Atlee","people":[],"reason":""}')?.creator, 'Atlee')
check('parse: author key when the medium is a book',
  parseIdentification('{"known":true,"title":"X","year":1981,"author":"Rushdie","people":[],"reason":""}', 'author')?.creator, 'Rushdie')
check('parse: known:false survives',
  parseIdentification('{"known":false,"title":null,"year":null,"director":null,"people":[],"reason":"too recent"}')?.known, false)
check('parse: fenced JSON',
  parseIdentification('```json\n{"known":true,"title":"Jawan","year":2023,"director":"Atlee","people":[],"reason":""}\n```')?.title, 'Jawan')
check('parse: missing known field is rejected outright',
  parseIdentification('{"title":"Jawan"}'), null)
check('parse: absurd year is discarded, not trusted',
  parseIdentification('{"known":true,"title":"X","year":99999,"director":null,"people":[],"reason":""}')?.year, null)
check('parse: prose reply degrades to null',
  parseIdentification('I think this is Jawan!'), null)

// ── Finding M: evidence on the typed path ───────────────────────────────────
// isInputClear() skips the extraction LLM whenever the form is filled, so
// capture_people is empty for the COMMON case. The corroboration rule — the
// thing that lets a large title leap confirm silently — could therefore never
// fire for anyone who typed properly. identify() now reports whom it read the
// person as naming, and these guard that reading.
//
// The threat model is specific: named_people feeds the rule that permits a
// LARGE leap. A model free to invent a name could manufacture the evidence for
// its own answer. So nothing survives that is not literally in the user's text.

const wroteIt = 'Jawaan — starring Shah Rukh Khan, Ali told me'

check('named: a name present in the note is kept',
  verifyNamedPeople(['Shah Rukh Khan'], wroteIt).length, 1)

check('named: an INVENTED name is discarded',
  verifyNamedPeople(['Deepika Padukone'], wroteIt).length, 0)

check('named: a partly-invented list keeps only the real one',
  verifyNamedPeople(['Shah Rukh Khan', 'Salman Khan'], wroteIt).length, 1)

check('named: matching is case-insensitive',
  verifyNamedPeople(['shah rukh khan'], wroteIt).length, 1)

check('named: a surname alone is too common to count',
  verifyNamedPeople(['Khan'], 'Jawaan').length, 0)

check('named: empty user text can corroborate nothing',
  verifyNamedPeople(['Shah Rukh Khan'], '').length, 0)

check('named: model expanding a name beyond what was written is rejected',
  verifyNamedPeople(['Shah Rukh Khan'], 'Jawaan — the shah rukh one').length, 0)

// effectivePeople: structural field, plus verified reading, deduplicated
const typedInput: IdentifyInput = {
  title: 'Jawaan', note: 'starring Shah Rukh Khan', modality: 'type', medium: 'film',
}
const readIdent: Identification = {
  known: true, title: 'Jawan', year: 2023, creator: 'Atlee',
  people: ['Shah Rukh Khan'], namedPeople: ['Shah Rukh Khan'], reason: '',
}

check('effective: the typed path now has someone to corroborate against',
  effectivePeople(typedInput, readIdent).length, 1)

check('effective: with no identification, only structural people count',
  effectivePeople({ ...typedInput, people: ['Atlee'] }, null).length, 1)

check('effective: duplicates across both sources collapse',
  effectivePeople({ ...typedInput, people: ['shah rukh khan'] }, readIdent).length, 1)

check('effective: an invented reading adds nobody',
  effectivePeople(typedInput, { ...readIdent, namedPeople: ['Aamir Khan'] }).length, 0)

// End to end: the typed Jawaan save must now CONFIRM rather than ask.
const realJawanRec = { year: 2023, creator: 'Atlee', credits: ['Shah Rukh Khan', 'Nayanthara'] }
const typedCorrob  = corroborate(typedInput, readIdent, realJawanRec)

check('typed path: the named person is found via the note',
  typedCorrob.userPersonFound, true)
check('typed path: DECISION is confirm, not ask',
  decide(typedInput, readIdent, true, typedCorrob), 'confirm')

// And the inverse must still hold: an invented reading must not confirm.
const inventedIdent = { ...readIdent, title: 'Pathaan', namedPeople: ['Deepika Padukone'] }
check('typed path: an invented name cannot manufacture corroboration',
  decide(typedInput, inventedIdent, true,
         corroborate(typedInput, inventedIdent, { year: 2023, creator: 'x', credits: ['Deepika Padukone'] })),
  'show_and_ask')

check('parse: named_people is read from the model reply',
  parseIdentification('{"known":true,"title":"Jawan","year":2023,"director":"Atlee","people":[],"named_people":["Shah Rukh"],"reason":""}')?.namedPeople[0], 'Shah Rukh')

check('parse: a missing named_people degrades to empty, not undefined',
  parseIdentification('{"known":true,"title":"Jawan","year":2023,"director":"Atlee","people":[],"reason":""}')?.namedPeople.length, 0)

console.log('')
if (failures > 0) {
  console.log(`${failures} IDENTIFY GOLDEN CASE(S) FAILED`)
  process.exit(1)
}
console.log('ALL IDENTIFY GOLDEN CASES PASS')
