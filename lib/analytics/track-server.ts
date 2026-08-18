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
// PROVENANCE, stated plainly (Session 17):
//   92 — INHERITED from the enrich route's existing auto-confirm rule, which an
//        earlier session raised from 88 after a real wrong match. Load-bearing.
//   75 — INVENTED. It has no derivation. It sits between 92 and 50 because 50
//        felt too low to call "fairly sure". That is the entire reasoning.
//
// These are therefore NOT a finding and must not be shown to a user as though
// they were. They exist only so rollup_enrichment has a grouping key. The real
// answer comes from EnrichmentSignals above, once correction data exists.
//
// Do not tune these by intuition. Tune them when the data says so.

export function confidenceBand(score: number): EnrichmentBand {
  if (score >= 92) return 'sure'
  if (score >= 75) return 'fairly_sure'
  return 'not_sure'
}

/**
 * The raw evidence behind one enrichment decision.
 *
 * WHY SIGNALS AND NOT A VERDICT (Session 17):
 * A band is a collapse — several layers of reasoning squeezed into one word.
 * Store the word and the reasoning is gone forever. Store the signals and any
 * band can be re-derived later, retroactively, over historical data, as many
 * times as it takes to get one right.
 *
 * This matters here specifically because `score` is Levenshtein string
 * similarity — it compares spelling, not meaning. "Gokul Bar" vs "Gokul Bite"
 * scores ~80 and is the WRONG venue; "Chungking Express" vs its Chinese title
 * scores ~0 and is the RIGHT film. Calibrating thresholds on that number alone
 * would be tuning the weakest signal in the stack.
 */
export interface EnrichmentSignals {
  /** Levenshtein similarity 0-100. Spelling only. Not a confidence. */
  score?:          number
  /** Did a stricter layer confirm it — exact match, address, popularity gap? */
  strict_exact?:   boolean
  name_overlap?:   boolean
  /** TMDB popularity of top vs runner-up. A clear gap is real evidence. */
  top_popularity?: number
  second_popularity?: number
  /** How many candidates the provider returned. 1 is very different from 3. */
  result_count?:   number
  /** Which layer actually made the call, in the provider's own words. */
  match_type?:     string
  reason?:         string
  provider?:       'tmdb' | 'places' | 'spotify' | 'books'
}

/**
 * Q: When enrichment was confident, was it right?
 *
 * Logged on EVERY enrichment, not only the uncertain ones. The confident path
 * auto-confirms without asking the user, so being wrong there is the most
 * expensive kind of wrong — the card silently gets the wrong poster and the
 * moment it happened is never seen.
 *
 * `correlationId` is the ticket number a later correction quotes. It must be
 * persisted alongside the candidates, or a correction arriving four days later
 * can never be matched back to the decision that produced it.
 */
export async function trackEnrichmentShownServer(
  userId:        string,
  correlationId: string,
  cardId:        string,
  category:      Category,
  signals:       EnrichmentSignals,
  autoConfirmed: boolean,
): Promise<void> {
  await trackServer(userId, 'enrichment_shown', {
    surface:       autoConfirmed ? 'capture_sheet' : 'save_peek',
    category,
    cardId,
    correlationId,
    payload: {
      // Derived for convenience only. The signals below are the source of
      // truth; this label is disposable and can be recomputed at any time.
      band: signals.score !== undefined ? confidenceBand(signals.score) : 'not_sure',
      auto_confirmed: autoConfirmed,
      ...signals,
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
