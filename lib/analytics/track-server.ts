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
// Thresholds mirror the existing auto-confirm rule in the enrich route
// (confidence >= 92). They are a STARTING POINT, not a finding: the whole
// purpose of rollup_enrichment is to discover whether they are honest.
//
// Do not tune these by intuition. Tune them when the calibration data says so.

export function confidenceBand(score: number): EnrichmentBand {
  if (score >= 92) return 'sure'
  if (score >= 75) return 'fairly_sure'
  return 'not_sure'
}

/**
 * Q: Of everything we called "fairly sure", what share was actually right?
 *
 * `correlationId` is the ticket number a later correction quotes. It must be
 * persisted alongside the candidates, or a correction arriving four days later
 * can never be matched back to the score that produced it.
 */
export async function trackEnrichmentShownServer(
  userId: string,
  correlationId: string,
  cardId: string,
  category: Category,
  score: number,
  autoConfirmed: boolean,
): Promise<void> {
  await trackServer(userId, 'enrichment_shown', {
    surface:       'save_peek',
    category,
    cardId,
    correlationId,
    payload: {
      band:  confidenceBand(score),
      score,
      auto_confirmed: autoConfirmed,
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
