// lib/analytics/track-server.ts
//
// SERVER-SIDE writer. Companion to lib/analytics/track.ts, which is
// browser-only.
//
// WHY A SECOND WRITER:
// Enrichment happens in a route handler, not in the browser. The browser
// writer's Supabase client has no session there, so those events would be
// silently dropped — and enrichment is precisely the thing we most need to
// measure, because the confidence bands in Phase 2 rest on knowing whether
// "fairly sure" is telling the truth.
//
// The one-writer rule (KB-MEASUREMENT_SPEC.md §8) still holds: these are the
// only two modules that insert into `events`. No route inserts directly.
//
// Contract, identical to the browser writer:
//   · Never throws. Never blocks. Never fails a user action.
//   · Never carries user content.

import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/types'
import type {
  EventKind,
  EventSurface,
  DayPart,
  EnrichmentBand,
  EnrichmentOutcome,
} from './track'

// ── Local time ──────────────────────────────────────────────────────────────
// The server runs in UTC; the user is in IST. Rolling up by UTC date would
// scatter every evening session onto the following day, so the user's local
// date is computed explicitly rather than inherited from the server clock.
//
// Fixed to IST for now. When the app has users in other timezones this must
// read a stored per-user timezone — recorded as G12 in GAPS.md.
const USER_TZ = 'Asia/Kolkata'

function localParts(d: Date): { localDate: string; partOfDay: DayPart } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: USER_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const get = (t: string): string => parts.find(p => p.type === t)?.value ?? '00'
  const localDate = `${get('year')}-${get('month')}-${get('day')}`
  const h = parseInt(get('hour'), 10)

  let partOfDay: DayPart = 'night'
  if (h >= 5 && h < 12)       partOfDay = 'morning'
  else if (h >= 12 && h < 17) partOfDay = 'afternoon'
  else if (h >= 17 && h < 22) partOfDay = 'evening'

  return { localDate, partOfDay }
}

interface ServerTrackOptions {
  surface?:       EventSurface
  category?:      Category | null
  cardId?:        string | null
  correlationId?: string | null
  payload?:       Record<string, unknown>
}

/**
 * Fire-and-forget from the caller's perspective. Awaiting is allowed (route
 * handlers are already async) but a failure can never propagate.
 */
export async function trackServer(
  userId: string,
  kind: EventKind,
  options: ServerTrackOptions = {},
): Promise<void> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const { localDate, partOfDay } = localParts(now)

    // Server-side events have no browser session, so session_id is derived
    // from the user. Timeline order within a visit comes from the client
    // events either side of this one.
    const { error } = await supabase.from('events').insert({
      user_id:        userId,
      session_id:     userId,
      kind,
      surface:        options.surface ?? 'other',
      occurred_at:    now.toISOString(),
      local_date:     localDate,
      part_of_day:    partOfDay,
      category:       options.category ?? null,
      card_id:        options.cardId ?? null,
      correlation_id: options.correlationId ?? null,
      payload:        options.payload ?? {},
    })
    if (error) console.warn('[track-server] insert failed:', error.message)
  } catch (err) {
    console.warn('[track-server] threw:', err)
  }
}

// ── Confidence bands ────────────────────────────────────────────────────────
//
// SESSION 17 CORRECTION. The previous version of this function read:
//     if (score >= 92) return 'sure'
//     if (score >= 75) return 'fairly_sure'
//     return 'not_sure'
//
// Both numbers were wrong to have here, for different reasons:
//
//   · 92 was inherited from the enrich route's auto-confirm rule, where it
//     was tuned by a real failure. It belongs there, not duplicated here.
//   · 75 was invented. There was no derivation behind it.
//
// The deeper problem: `score` is calculateConfidence(), which is Levenshtein
// string similarity — it compares LETTERS. It does not know what a film or a
// restaurant is. "Gokul Bar" vs "Gokul Bite" scores ~80 and is the WRONG
// venue; "Chungking Express" vs its Chinese title scores ~0 and is CORRECT.
//
// Meanwhile the enrich route already computes five layers of real evidence
// (strict exactness, name overlap, popularity gap, address components,
// geographic hint) and then discards those verdicts, keeping only the string
// score. Calibrating bands on the score would mean tuning the weakest signal
// in the stack with great precision.
//
// So the band is now derived from the DECISION the layers reached, not from
// a threshold on a spelling test:
//
//   sure         — auto-confirmed: survived every layer, user never asked
//   needs_review — the candidate strip was shown: the machine deferred
//
// Two honest states beat three invented ones. Thresholds can be re-derived
// from real correction data once enough enrichments have been logged —
// which is what `shouldReview` and the layer verdicts below make possible.

/**
 * Session 18 — the middle band finally exists.
 *
 * The comment above stands: two honest states beat three invented ones, and
 * that was the right call while the only input was a spelling score. It is no
 * longer the only input. lib/enrichment/judge.ts returns a VERDICT reached by
 * weighing named people, years and what the person actually said — so a third
 * state is now a thing the system genuinely knows, not a threshold someone
 * picked.
 *
 * `verdict` is preferred when present. The boolean path remains for the
 * providers that have not been moved onto the judgement layer yet (listen,
 * read, and the places pipeline), so nothing silently changes shape while
 * they are migrated one at a time.
 */
export function bandFromDecision(
  autoConfirmed: boolean,
  band?:         EnrichmentBand | null,
): EnrichmentBand {
  if (band) return band
  return autoConfirmed ? 'sure' : 'not_sure'
}

/**
 * The layer verdicts, captured as they were actually decided.
 *
 * This is the point of A4: `match_type` and `demoted_by` say WHY the system
 * believed what it believed. A restaurant matched on address components is a
 * different kind of confident from a film matched on title spelling, and only
 * this shape can tell those apart later.
 */
export interface EnrichmentEvidence {
  /** Raw Levenshtein score. Kept for continuity — NOT the basis of the band. */
  score?:         number
  /** 'exact' | 'likely' | 'possible' | 'none' — the layered verdict. */
  matchType?:     string
  /** Which layer demoted the match, if one did. The most diagnostic field here. */
  demotedBy?:     string
  /** Was a location hint supplied and checked? */
  hadLocationHint?: boolean
  /** How many candidates Google returned. */
  candidateCount?: number
  /** Which enrichment source produced this — tmdb | places | spotify | books. */
  provider?:      string
  /** The judgement layer's band, when this provider uses it. */
  band?:          EnrichmentBand | null
  /** 'llm' | 'fallback' — how the verdict was reached. Separates a real
   *  judgement from a degraded one, so the two are never averaged together. */
  judgeMethod?:   string
  /** The verdict's one-line reason. Calibration evidence, never shown. */
  judgeReason?:   string
}

/**
 * Q: When the app was SURE, was it right?
 *
 * Previously this only fired when the candidate strip was shown — so every
 * confident enrichment went unrecorded. That is precisely the band where the
 * user is never asked, so a wrong match there is silent and permanent: a card
 * quietly acquires the wrong film's poster and nobody sees the moment it
 * happened. Measuring only the uncertain cases left the expensive failure
 * mode invisible.
 *
 * Now every enrichment is logged, with `auto_confirmed` distinguishing them.
 *
 * `correlationId` is the ticket number a later correction quotes. It is
 * persisted in metadata.enrichment_id because a correction may arrive days
 * later, long after this request is gone.
 */
export async function trackEnrichmentShownServer(
  userId:        string,
  correlationId: string,
  cardId:        string,
  category:      Category,
  autoConfirmed: boolean,
  evidence:      EnrichmentEvidence = {},
): Promise<void> {
  await trackServer(userId, 'enrichment_shown', {
    surface:       autoConfirmed ? 'save_peek' : 'card_detail',
    category,
    cardId,
    correlationId,
    payload: {
      band:           bandFromDecision(autoConfirmed, evidence.band),
      auto_confirmed: autoConfirmed,
      ...evidence,
    },
  })
}

/**
 * Three outcomes, never two. `untouched` is NOT `accepted` — the user may
 * simply not have noticed. Collapsing them would flatter the bands, which is
 * the exact failure this measurement exists to catch.
 */
export async function trackEnrichmentResolvedServer(
  userId: string,
  correlationId: string,
  cardId: string,
  outcome: EnrichmentOutcome,
  chosenIndex?: number,
): Promise<void> {
  await trackServer(userId, 'enrichment_resolved', {
    surface:       'card_detail',
    cardId,
    correlationId,
    payload: {
      outcome,
      ...(chosenIndex !== undefined ? { chosen_index: chosenIndex } : {}),
    },
  })
}
