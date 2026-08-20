// scripts/judge.golden.ts
//
// Golden regression tests for lib/enrichment/judge.ts.
//
//   npx tsx scripts/judge.golden.ts
//
// Exit code 0 = all pass. Any failure prints the case and exits 1.
//
// These test the DETERMINISTIC half only — the decision rules, the vetoes and
// the parser. The LLM call itself is not tested here and cannot be: it is a
// network call to a model that may be replaced. That split is the design.
// Everything that can silently ruin a card lives on this side of the line.
//
// The first case is the one that caused this module to exist.

import {
  bandFromVerdict, mayAutoConfirm, contradictsNamedPeople, applyVetoes,
  parseJudgement, fallbackJudgement,
  type JudgeSubject, type JudgeCandidate, type Judgement,
} from '../lib/enrichment/judge'
import {
  normaliseQuery, selectExtraQueries, parseQueries, dedupeById,
} from '../lib/enrichment/query-shaper'

let failures = 0
function check(name: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  console.log(`${ok ? '✓' : '✗ FAIL'}  ${name}  →  ${String(actual)} (want ${String(expected)})`)
  if (!ok) failures++
}

// ── The Jawaan case (Session 18) ────────────────────────────────────────────
// "Jawaan, starring Shah Rukh, 2024". TMDB's top hit is a 2017 Telugu film
// whose title is spelled EXACTLY that way, so Levenshtein scored it 100/100
// and it was auto-confirmed. The wrongest answer, maximum confidence, silent.

const jawaanSubject: JudgeSubject = {
  title:       'Jawaan',
  year:        2024,
  people:      ['Shah Rukh'],
  captureText: 'Jawaan, the one starring Shah Rukh, 2024 I think',
}

const telugu2017: JudgeCandidate = {
  index:      0,
  title:      'Jawaan',
  year:       2017,
  people:     ['Sai Durgha Tej', 'Mehreen Pirzada', 'Prasanna'],
  overview:   'Jai is a patriotic man for whom the nation always comes first.',
  popularity: 8.4,
}

const srk2023: JudgeCandidate = {
  index:      1,
  title:      'Jawan',
  year:       2023,
  people:     ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi'],
  overview:   'A man is driven by a personal vendetta to rectify wrongs in society.',
  popularity: 61.2,
}

check('Jawaan: identical spelling does NOT survive a cast contradiction',
  contradictsNamedPeople(jawaanSubject, telugu2017), true)

check('Jawaan: the SRK film is not contradicted (partial name match)',
  contradictsNamedPeople(jawaanSubject, srk2023), false)

check('Jawaan: an LLM picking the 2017 film is vetoed to none',
  applyVetoes(
    { verdict: 'match', index: 0, reason: 'exact title', method: 'llm' },
    jawaanSubject, [telugu2017, srk2023],
  ).verdict, 'none')

check('Jawaan: a vetoed judgement carries no index',
  applyVetoes(
    { verdict: 'match', index: 0, reason: 'exact title', method: 'llm' },
    jawaanSubject, [telugu2017, srk2023],
  ).index, null)

check('Jawaan: the correct film survives the veto',
  applyVetoes(
    { verdict: 'match', index: 1, reason: 'cast and year agree', method: 'llm' },
    jawaanSubject, [telugu2017, srk2023],
  ).verdict, 'match')

// ── Named-people veto: boundaries ───────────────────────────────────────────

check('veto: no people named → never vetoes',
  contradictsNamedPeople({ title: 'Jawaan' }, telugu2017), false)

check('veto: candidate has no cast listed → never vetoes',
  contradictsNamedPeople(jawaanSubject, { ...telugu2017, people: [] }), false)

check('veto: surname alone matches the full name',
  contradictsNamedPeople(
    { title: "Midnight's Children", people: ['Rushdie'] },
    { index: 0, title: "Midnight's Children", year: 1981, people: ['Salman Rushdie'], overview: null, popularity: null },
  ), false)

check('veto: one-token noise is ignored, not treated as a name',
  contradictsNamedPeople(
    { title: 'Dune', people: ['a'] },
    { index: 0, title: 'Dune', year: 2021, people: ['Timothée Chalamet'], overview: null, popularity: null },
  ), false)

// ── Bands — the middle band exists here for the first time ──────────────────

check('band: match → sure',           bandFromVerdict('match'),    'sure')
check('band: probably → fairly_sure', bandFromVerdict('probably'), 'fairly_sure')
check('band: unsure → not_sure',      bandFromVerdict('unsure'),   'not_sure')
check('band: none → none',            bandFromVerdict('none'),     'none')

// ── Auto-confirm: what a verdict is ALLOWED to do ───────────────────────────

const llm = (verdict: Judgement['verdict'], index: number | null): Judgement =>
  ({ verdict, index, reason: '', method: 'llm' })

check('auto-confirm: match may',            mayAutoConfirm(llm('match', 0)),    true)
check('auto-confirm: probably may NOT',     mayAutoConfirm(llm('probably', 0)), false)
check('auto-confirm: unsure may NOT',       mayAutoConfirm(llm('unsure', 0)),   false)
check('auto-confirm: none may NOT',         mayAutoConfirm(llm('none', null)),  false)
check('auto-confirm: match without an index may NOT',
  mayAutoConfirm(llm('match', null)), false)
check('auto-confirm: a FALLBACK match may NOT (this was the Jawaan bug)',
  mayAutoConfirm({ verdict: 'match', index: 0, reason: '', method: 'fallback' }), false)

// ── Fallback: degraded, never silently confident ────────────────────────────

check('fallback: never returns match',
  fallbackJudgement({ title: 'x' }, [telugu2017]).verdict !== 'match', true)

check('fallback: with no candidates returns none',
  fallbackJudgement({ title: 'x' }, []).verdict, 'none')

check('fallback: is labelled as fallback',
  fallbackJudgement({ title: 'x' }, [telugu2017]).method, 'fallback')

// ── Parser: models do not always obey "JSON only" ───────────────────────────

check('parse: plain JSON',
  parseJudgement('{"verdict":"match","index":1,"reason":"ok"}')?.index, 1)

check('parse: fenced JSON',
  parseJudgement('```json\n{"verdict":"none","index":null,"reason":"no"}\n```')?.verdict, 'none')

check('parse: preamble before the JSON',
  parseJudgement('Sure! Here you go: {"verdict":"probably","index":0,"reason":"y"}')?.verdict, 'probably')

check('parse: unknown verdict is rejected outright',
  parseJudgement('{"verdict":"maybe","index":0,"reason":"y"}'), null)

check('parse: malformed returns null rather than throwing',
  parseJudgement('not json at all'), null)

check('parse: none always drops the index, even if one is supplied',
  parseJudgement('{"verdict":"none","index":2,"reason":"y"}')?.index, null)

check('parse: negative index is discarded',
  parseJudgement('{"verdict":"match","index":-1,"reason":"y"}')?.index, null)

// ── Out-of-range index from the model ───────────────────────────────────────

check('veto: index beyond the candidate list becomes none',
  applyVetoes(llm('match', 9), { title: 'x' }, [telugu2017]).verdict, 'none')

// ── Query shaping (Session 18, the SECOND Jawaan failure) ───────────────────
// The judge said "none of these" and was right — but TMDB never returned the
// 2023 film for the spelling "Jawaan", so the correct answer was never in the
// list. These guard the deterministic half: what gets searched, and how often.

check('shape: an alternative spelling is worth searching',
  selectExtraQueries(['Jawan'], 'Jawaan')[0], 'Jawan')

check('shape: the user\'s own title is never re-searched',
  selectExtraQueries(['Jawaan'], 'Jawaan').length, 0)

check('shape: case and punctuation alone are not a new query',
  selectExtraQueries(['JAWAAN!', 'jawaan'], 'Jawaan').length, 0)

check('shape: near-duplicates among proposals collapse',
  selectExtraQueries(['Jawan', 'JAWAN', 'jawan '], 'Jawaan').length, 1)

check('shape: capped at two extra queries',
  selectExtraQueries(['a1', 'b2', 'c3', 'd4'], 'zzz').length, 2)

check('shape: one-character proposals are discarded',
  selectExtraQueries(['x', 'Jawan'], 'Jawaan').length, 1)

check('shape: a sentence is not a title',
  selectExtraQueries(['the one where Shah Rukh Khan plays a jailer and also his own father'], 'Jawaan').length, 0)

check('shape: non-array input is survivable',
  selectExtraQueries('Jawan', 'Jawaan').length, 0)

check('shape: non-string members are skipped',
  selectExtraQueries([42, null, 'Jawan'], 'Jawaan').length, 1)

check('normalise: transliteration differences survive normalisation',
  normaliseQuery('Jawaan') === normaliseQuery('Jawan'), false)

check('parse: fenced query JSON',
  (parseQueries('```json\n{"queries":["Jawan"]}\n```') as string[])[0], 'Jawan')

check('parse: empty array when the model recognises nothing',
  (parseQueries('{"queries":[]}') as string[]).length, 0)

check('parse: malformed query reply degrades to empty',
  (parseQueries('sorry, I cannot help') as unknown[]).length, 0)

// dedupe — the user's own results must always lead
const pageA = [{ id: 1 }, { id: 2 }]
const pageB = [{ id: 2 }, { id: 3 }]

check('dedupe: union size', dedupeById([pageA, pageB]).length, 3)
check('dedupe: the user\'s own results keep first position',
  dedupeById([pageA, pageB])[0].id, 1)
check('dedupe: a repeated id is not searched twice into the pool',
  dedupeById([pageA, pageB]).filter(x => x.id === 2).length, 1)
check('dedupe: empty pages are harmless', dedupeById([[], pageA]).length, 2)

console.log('')
if (failures > 0) {
  console.log(`${failures} JUDGE GOLDEN CASE(S) FAILED`)
  process.exit(1)
}
console.log('ALL JUDGE GOLDEN CASES PASS')
