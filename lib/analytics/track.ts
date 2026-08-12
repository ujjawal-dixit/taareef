// lib/analytics/track.ts
//
// THE SINGLE WRITER. No route, component, or hook inserts into `events`
// directly. This is the one constraint that stops the table becoming a junk
// drawer — schema-on-read rots when every caller invents its own shape.
//
// Contract (KB-MEASUREMENT_SPEC.md §8):
//   · Never throws. Never rejects. Never blocks a user action.
//   · Never awaited in a user path.
//   · Never carries user content — no titles, no notes, no coordinates.
//   · local_date and part_of_day are computed HERE, from the user's timezone.

import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

// ── Types ───────────────────────────────────────────────────────────────────

export type EventKind =
  | 'app_opened'
  | 'category_viewed'
  | 'card_opened'
  | 'save_started'
  | 'save_completed'
  | 'save_abandoned'
  | 'status_changed'
  | 'search_performed'
  | 'search_result_opened'
  | 'enrichment_shown'
  | 'enrichment_resolved'
  | 'source_browsed'

export type EventSurface =
  | 'dashboard'
  | 'category_list'
  | 'card_detail'
  | 'capture_sheet'
  | 'save_peek'
  | 'search'
  | 'source_list'
  | 'taareef_folder'
  | 'onboarding'
  | 'profile'
  | 'other'

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night'
export type EnrichmentBand = 'sure' | 'fairly_sure' | 'not_sure'
export type EnrichmentOutcome = 'accepted' | 'corrected' | 'untouched'

export type FoundVia =
  | 'search'
  | 'category_browse'
  | 'source_list'
  | 'taareef_folder'
  | 'save_peek'
  | 'direct_link'
  | 'unknown'

export type CompletionTrigger =
  | 'reminded'
  | 'was_nearby'
  | 'planned'
  | 'stumbled_here'
  | 'skipped'

interface EventRow {
  user_id: string | null
  session_id: string
  kind: EventKind
  surface: EventSurface
  occurred_at: string
  local_date: string
  part_of_day: DayPart
  category: Category | null
  card_id: string | null
  correlation_id: string | null
  payload: Record<string, unknown>
}

// ── Session identity ────────────────────────────────────────────────────────
// A session is one visit. Without it, order within a visit is unrecoverable —
// and every retrieval metric we care about is about order.

const SESSION_KEY = 'taareef_session_id'

function getSessionId(): string {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000000'
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const fresh = crypto.randomUUID()
    window.sessionStorage.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    return crypto.randomUUID()
  }
}

// ── Local time ──────────────────────────────────────────────────────────────
// IST is UTC+5:30. Grouping by UTC date would scatter every evening session
// onto the following day — for a product where "did I open it today" is the
// question, that is not a rounding error.

function localDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function partOfDay(d: Date): DayPart {
  const h = d.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

// ── Failure counter ─────────────────────────────────────────────────────────
// Analytics failing must be invisible. A nervous system that can kill the body
// is worse than no nervous system.

let failureCount = 0
export function analyticsFailureCount(): number {
  return failureCount
}

// ── Core writer ─────────────────────────────────────────────────────────────

interface TrackOptions {
  surface?: EventSurface
  category?: Category | null
  cardId?: string | null
  correlationId?: string | null
  payload?: Record<string, unknown>
}

/**
 * Fire-and-forget. Deliberately not async from the caller's perspective:
 * awaiting this in a user path is the mistake this signature prevents.
 */
export function track(kind: EventKind, options: TrackOptions = {}): void {
  void writeEvent(kind, options)
}

async function writeEvent(kind: EventKind, options: TrackOptions): Promise<void> {
  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    const userId = data?.user?.id ?? null

    // No identity means no row. Anonymous users DO have an id (signInAnonymously
    // fires on first save tap), so this only skips genuinely identity-less states.
    if (!userId) return

    const now = new Date()

    const row: EventRow = {
      user_id:        userId,
      session_id:     getSessionId(),
      kind,
      surface:        options.surface ?? 'other',
      occurred_at:    now.toISOString(),
      local_date:     localDate(now),
      part_of_day:    partOfDay(now),
      category:       options.category ?? null,
      card_id:        options.cardId ?? null,
      correlation_id: options.correlationId ?? null,
      payload:        options.payload ?? {},
    }

    const { error } = await supabase.from('events').insert(row)
    if (error) failureCount += 1
  } catch {
    failureCount += 1
  }
}

// ── Typed helpers, one per kind ─────────────────────────────────────────────
// Each exists to answer a stated question (spec §5). No kind without a question.

/** Q: Is the vault ever opened without something being saved? */
export function trackAppOpened(surface: EventSurface = 'dashboard'): void {
  track('app_opened', { surface })
}

/** Q: Which categories are alive and which are inert? */
export function trackCategoryViewed(category: Category): void {
  track('category_viewed', { surface: 'category_list', category })
}

/** Q: What actually gets looked at? Also feeds recommendations.last_opened_at. */
export function trackCardOpened(
  cardId: string,
  category: Category,
  surface: EventSurface = 'card_detail',
): void {
  track('card_opened', { surface, category, cardId })
}

/** Q: How many saves are begun? Gap against completed = abandonment. */
export function trackSaveStarted(method: 'type' | 'speak' | 'scan'): void {
  track('save_started', { surface: 'capture_sheet', payload: { method } })
}

export function trackSaveCompleted(
  cardId: string,
  category: Category,
  method: 'type' | 'speak' | 'scan',
): void {
  track('save_completed', { surface: 'capture_sheet', category, cardId, payload: { method } })
}

/** Q: WHERE in the flow do people give up? Stage, not just failure. */
export function trackSaveAbandoned(
  stage: 'uploaded' | 'extracted' | 'confirmed',
  method: 'type' | 'speak' | 'scan',
): void {
  track('save_abandoned', { surface: 'capture_sheet', payload: { stage, method } })
}

/**
 * The North Star.
 * `foundVia` is observed, never asked — the app knows which screen you came
 * from, and it is IMPOSSIBLE to reconstruct after the fact.
 * `daysSinceSave` is frozen here rather than derived later, so the row survives
 * the recommendation being edited or deleted.
 */
export function trackStatusChanged(
  cardId: string,
  category: Category,
  from: string,
  to: string,
  foundVia: FoundVia,
  daysSinceSave: number,
  trigger?: CompletionTrigger,
): void {
  track('status_changed', {
    surface: 'card_detail',
    category,
    cardId,
    payload: {
      from,
      to,
      found_via: foundVia,
      days_since_save: daysSinceSave,
      ...(trigger ? { trigger } : {}),
    },
  })
}

/** Q: Did retrieval work? Mirrors search_log for timeline continuity. */
export function trackSearchPerformed(resultCount: number, latencyMs: number): void {
  track('search_performed', {
    surface: 'search',
    payload: { result_count: resultCount, latency_ms: latencyMs },
  })
}

export function trackSearchResultOpened(cardId: string, rank: number): void {
  track('search_result_opened', { surface: 'search', cardId, payload: { rank } })
}

/**
 * Q: Is "fairly sure" telling the truth?
 * correlationId is the ticket number a later correction quotes — without it a
 * correction arriving four days later can never be matched to its score.
 */
export function trackEnrichmentShown(
  correlationId: string,
  cardId: string,
  category: Category,
  band: EnrichmentBand,
  score: number,
): void {
  track('enrichment_shown', {
    surface: 'save_peek',
    category,
    cardId,
    correlationId,
    payload: { band, score },
  })
}

/** Three outcomes. `untouched` is NOT `accepted` — the user may not have noticed. */
export function trackEnrichmentResolved(
  correlationId: string,
  cardId: string,
  outcome: EnrichmentOutcome,
  chosenIndex?: number,
): void {
  track('enrichment_resolved', {
    surface: 'card_detail',
    cardId,
    correlationId,
    payload: { outcome, ...(chosenIndex !== undefined ? { chosen_index: chosenIndex } : {}) },
  })
}

/** Q: Is the differentiator actually used, once it exists? */
export function trackSourceBrowsed(sourceName: string): void {
  // Length only — never the name. Source names are user content.
  track('source_browsed', {
    surface: 'source_list',
    payload: { source_name_length: sourceName.length },
  })
}

// ── search_log ──────────────────────────────────────────────────────────────
// Separate table, separate lifetime. Query text IS the data here — this is the
// one deliberate exception to "no user content in the log", because these are
// the user's own words about their own vault, and the zero-result queries are
// the most honest feature requests we will ever receive.

export function logSearch(
  queryText: string,
  resultCount: number,
  latencyMs: number,
  wasReformulation: boolean,
): void {
  void (async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const userId = data?.user?.id ?? null
      if (!userId) return

      const now = new Date()
      const { error } = await supabase.from('search_log').insert({
        user_id:           userId,
        session_id:        getSessionId(),
        query_text:        queryText,
        result_count:      resultCount,
        latency_ms:        latencyMs,
        was_reformulation: wasReformulation,
        local_date:        localDate(now),
      })
      if (error) failureCount += 1
    } catch {
      failureCount += 1
    }
  })()
}
