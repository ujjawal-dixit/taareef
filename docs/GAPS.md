# GAPS.md — Taareef Open Gaps Register

> **Primary reader:** both (planning Claude and Claude Code).
>
> A living list of known gaps: things that are missing, wrong, unverified, or
> deliberately deferred. **A gap is not a feature request.** Features live in
> `BACKLOG.md`. A gap is something that is *already broken, already unknown, or
> already inconsistent* in what exists.
>
> **How to use this file**
> · Add a gap the moment it is found, even if there's no plan to fix it
> · Never delete a gap — move it to §RESOLVED with the date and the resolution
> · Every gap has an owner-question: *what would we know if this were closed?*
>
> Last updated: Session 19 · 2026-09-02 — G06 and G08 closed (files deleted 2026-08-13; docs corrected)

### G19 · The chain that took four attempts — **closed S18**
Four consecutive failures in one evening, each fix correct and each leaving the
outcome identical:

1. **Levenshtein 100 on the wrong film.** "Jawaan" is the exact title of a 2017
   Telugu film. Auto-confirmed silently.
2. **Retrieval filtered by year.** Fixed the filter; never asked whether the
   *query* was right.
3. **The shaped query's results were discarded.** Concatenate-then-truncate
   filled a pool of ten with twenty results from the user's spelling.
4. **The judge was blind to cast.** Candidates arrived with `people: []` and
   the prompt rejected anything missing a named person — so naming an actor
   guaranteed a "none" verdict.

**The shared cause:** each stage was verified by inspecting the change, not the
outcome. Nothing logged what a stage actually passed downstream, so three
rounds of diagnosis were reasoning about what *should* have been passed.

**Closed by** replacing the chain with identify-then-verify (T23) — and by
logging `decision`, `personFound`, `creditsRead`, `hallucinated` and
`fabricated`, so the next failure is one query away rather than three rounds.

### G21 · The eval corpus is nearly empty — **C**
`identify.golden.ts` covers the deterministic rules and is a real gate. The
MODEL is unmeasured: no corpus, no hallucination rate, no fabrication rate.
Roughly ten known cases exist (Jawaan, Dune 3, Stutz, Chungking Express).
**That is enough to catch a regression and not enough to claim a rate** — any
accuracy figure quoted off ten cases is noise.
**Closes when** the ledger has enough real identifications to seed a corpus,
and the production number exists: of everything auto-confirmed, what share was
later corrected.

---

## SEVERITY KEY

| Level | Meaning |
|---|---|
| **A** | Silently wrong. Producing bad data or bad behaviour right now, undetected |
| **B** | Blocking. Something cannot be built or measured until this is closed |
| **C** | Known unknown. Not harmful, but we are guessing where we could know |
| **D** | Deferred by decision. Recorded so it is not rediscovered as a surprise |

---

## OPEN GAPS

### G01 · `found_via` is hardcoded to `'unknown'` — **B**
Every `status_changed` event records `found_via: 'unknown'` because no surface
passes a referrer yet.
**What we lose:** which retrieval path actually produces completions — the single
most valuable field for Phase 4, and impossible to reconstruct afterwards.
**Closes when:** search and source browsing exist and pass their surface through.
**Risk if left:** we build retrieval with no way to tell which path worked.

### G02 · Save funnel is unwired — ~~B~~ **superseded by G17, Session 18**
This entry is wrong as written. The funnel *was* wired (all three calls are in
`capture-screen.tsx`); it was wired incorrectly, which is a different and worse
condition — the checklist read done while the data read nonsense. See G17.

**The lesson worth keeping:** this gap was closed by someone reading the import
list. Presence of a call is not evidence of an event.

### G03 · Two of three completions have no reaction — **A**
Live data: `experienced = 3`, of which only one has a `reaction` value.
**Meaning:** when the loop does close, the final step silently does not fire.
**Closes when:** the completion destination exists and asks for the verdict at
the moment of completion.

### G04 · ~~`status` is `text`, not an enum~~ — **CLOSED, was never a gap**
See R06. Six per-category CHECK constraints already exist. The severity rating
came from reading the column *type* and never checking for constraints on it.

### G05 · `category` enum carries 14 dead values — **C**
Live: `watch, listen, read, dine, do, visit`. Also insertable: `restaurant, bar,
film, tv, music, book, city, activity, podcast, person, eat, drink, go, see`.
**Deferred deliberately** — Postgres cannot drop enum values; cleaning means
recreating the type on a live table. Risk exceeds benefit today.

### G06 · Dead onboarding vertical slice — **CLOSED, gone by 2026-08-13**
Was: Screen 3 (`app/(onboarding)/onboarding/categories/page.tsx`),
`app/api/user/preferences/route.ts`, the `user_preferences` table, and a stale
`middleware.ts` guard comment — all functional-but-unreferenced dead weight, the
comment being the dangerous part (it documented a redirect guard that no longer
existed).

Resolution: the `middleware.ts` comment was corrected in Session 17 (it now
explains the guard and screen were both removed). The two route files were
deleted on 2026-08-13 — `categories/page.tsx` in `1ba48fe`,
`user/preferences/route.ts` in `18c4ce1`. The `user_preferences` table is a
schema change, still nominally present with 0 rows; not worth a migration.
Docs that still described these as live were corrected in Session 19
(KB-FILEMAP.md, KB-MEASUREMENT_DECISIONS.md, ONBOARDING_SPEC.md).

### G07 · Google Places photo URLs expire — **A**
Cards silently lose their images. All four render paths are guarded against the
broken state, but the cause is unfixed and every new Dine/Visit/Do save plants
another one that will die.
**Closes when:** photos are mirrored to Supabase Storage (Phase 5.1).
**Watch:** the 1 GB free file limit is the first ceiling this project will hit.

### G08 · `app-shell.tsx` is dead — **CLOSED, deleted 2026-08-13**
`components/features/navigation/app-shell.tsx`, superseded by `app-providers.tsx`
+ `app-frame.tsx` in the Session 15 layout refactor. Deleted in commit
`1208aa6`. KB-FILEMAP.md was corrected in Session 19.

### G09 · `430px` hardcoded in 12 places — **C**
`FRAME_MAX_WIDTH` exists in `app-frame.tsx` and is largely unused. Any frame
change means twelve edits and one will be missed.

### G10 · Anonymous transfer unproven in production — **B**
`claim_anonymous_session` passes all four guard tests against the live database,
but the success path has never run for real — every existing anonymous user is
older than the 2-hour window, so they all correctly refuse.
**Closes when:** the end-to-end test runs (see `TESTING.md`).

### G11 · Rollup never verified against real data — **B**
`verify_rollup` returns PASS on zero rows, which proves nothing.
**Closes when:** real events exist and 30 consecutive nights read PASS. That is
the precondition for retention deletion ever being enabled.

### G12 · No timezone source for `local_date` — **C**
`track.ts` reads the browser's timezone. A user travelling would file events
against their travel timezone, not home.
**Judgment: correct for now** — "did I open it today" means *where I am*. Recorded
because it will look like a bug in the data later.

### G13 · Motion direction undecided — **B**
Blocks the save peek, folder entry, and every list transition. Sitting at the top
of Phase 1 and unmoved.

### G14 · Compact card spec unlocked — **B**
Folder, source browsing, search and archive all render lists of compact cards.
Building any of them first means retrofitting four surfaces.

### G15 · Complexity hotspots — **D**
`rec-detail-client.tsx` 1,761 lines · `capture-screen.tsx` 1,371 ·
`api/enrich/[id]/route.ts` 1,113. Not urgent. Recorded so their size is never a
surprise mid-delivery.

### G16 · Golden test suite is not a gate — **C**
`scripts/matching.golden.ts` (16 checks) has not run in three sessions. It is a
script someone remembers, not a gate something triggers.
*Session 18: run manually, 16/16 pass. Still not a gate.*

### G17 · The save funnel was wired backwards — **CLOSED S18, proven in production**
Two saves on 15 Aug produced **one `save_abandoned` and zero `save_completed`.**
Both halves were broken, in opposite directions, by two independent faults:

1. `trackSaveCompleted('', …)` — `events.card_id` is `uuid` and `''` is not a
   valid one, so Postgres rejected **the entire row**, not just the column. The
   `catch` counted it into `failureCount`, which nothing reads.
2. `savedRef.current = true` was set *after* `await onSaved(...)`, but
   `onSaved` closes the sheet on its first tick and resolves seconds later. The
   close effect therefore read `false` and logged a **successful** save as
   abandoned — and the flag, arriving after the 320 ms reset, then stayed true
   and **suppressed the next save's real abandonment.** A false positive that
   swallows the following true one.

The two faults together mean `rollup_daily.saves_completed` reads 0 forever and
the abandonment rate reads 100%. The counter-metric to the North Star was dead
from the day it shipped.
**Closes when:** one real save produces one `save_completed` row carrying a
real card id, and closing the sheet mid-flow produces one `save_abandoned`.

### G18 · `last_opened_at` was never written — **CLOSED S18, proven in production**
`track.ts` documented that `card_opened` "also feeds
`recommendations.last_opened_at`". Nothing did. The column was NULL on all 35
rows while `card_opened` fired normally.
**Why it matters:** `snapshot_weekly.never_reopened` and
`oldest_untouched_days` read that column, so both could only ever climb —
and `TENETS.md` instructs us to stop and investigate if `oldest_untouched_days`
ever *falls*. The one signal that the bottom of the vault had been rescued was
unable to occur.
**The second layer:** writing the column naively was unsafe. A `BEFORE UPDATE`
trigger stamped `updated_at` on any update, so every card *open* would have
looked like an *edit* — in the column `status_changed_at` was backfilled from
(R01). Migration `20260819_read_touch_does_not_bump_updated_at.sql` teaches the
trigger to ignore a touch that changes nothing but a read mark.
**Closes when:** opening a card sets `last_opened_at` and leaves `updated_at`
where it was.

---

### G20 · Claude can repeat its own lost work — **B**
In a long session Claude's earlier turns are dropped from context. The lost work
is not remembered as forgotten, so it is rebuilt with full confidence.
**Instance:** PR #3 and PR #4 in Session 17 — the same two fixes, same author,
two hours apart. Claude then misattributed PR #3 to Claude Code without checking,
and wrote that guess into TENETS.md as fact.
**Guard:** T20 — fetch, list commits since branch point, list open PRs, and read
them as potentially your own, before writing any code.
**Second instance, Session 18:** Claude built `merge_card_metadata` as a SQL
function and a TS helper, from scratch, to fix a bug it had *already fixed and
pushed* an hour earlier as PR #19 — a different design for the same defect, which
would have conflicted on merge. Caught only because the working tree contained a
`MetaWriter` Claude did not recognise and stopped to check `git log`.
**Still open because** the guard is a habit, not a mechanism. Nothing enforces it.
The second instance is worse than the first: it happened *after* T20 was written,
by the author of T20, in the session where it was quoted twice.

### G22 · Listen and Read auto-confirm with no verification at all — **A**
`enrichSpotifyAlbum`, `enrichSpotifyArtist`, `enrichSpotifyPodcast` and
`enrichBook` search with `limit=1`, take `items[0]`, and write it to the card.
No confidence, no corroboration, no candidate strip, no way for the person to
say "not it".

This is the exact defect that took Session 18 to eliminate for `watch` — and it
is worse here, because there is not even a spelling score to be wrong about.
**Two of six categories silently accept whatever a search returns first.**

They were unmeasured until PR #19 added logging with `verified: false`.
**Closes when** the identify-then-verify module is given Spotify and Books
adapters. It is provider-agnostic by design; this is an adapter, not a rewrite.
**What we would know:** whether `listen` and `read` have the same silent error
rate as `watch` had, or a worse one.

### G23 · There is no design system in the code — **B**
**714 `rgba()` literals. 244 inline hex colours. 540 inline `style={{}}` blocks**,
112 of them in `rec-detail-client.tsx` alone. Ten files reference the display
font directly.

The four pillars and six motifs are real, documented in `CARD_SPEC.md`, and
expressed **nowhere in the code**. Every screen re-derives them by hand.

This is the direct cause of the run-together buttons in S18: nothing owned
"two stacked text links", so each was styled from scratch and nobody could see
they would collide. It will keep producing that class of defect.
**Closes when** tokens exist, and `TextLink`, `Button`, `Field` and `Sheet` are
primitives rather than repeated literals.

### G24 · Three duplicate indexes on `recommendations` — **C**
`idx_recommendations_user_status` ≡ `idx_recs_user_status`, and the same for
`user_category` and `user_created`. Identical definitions under two naming
conventions; a migration was written twice. Every insert maintains six indexes
where three would do. Free to fix, harmless at 38 rows, real write
amplification later.

### G25 · `events` partitions run out in August 2027 — **C**
Monthly partitions exist through `events_2027_07`, plus a `DEFAULT`. Nothing
creates new ones. After that date rows land in `events_default` — which works,
until someone tries to create `events_2027_08`, and that **fails** because
DEFAULT already holds matching rows. Recovery is detach, move, reattach.
**Closes when** a cron job creates partitions a few months ahead.

### G26 · Search is half-built and the backlog does not know — **C** *(opportunity)*
```
idx_recommendations_fts ON recommendations USING gin(
  to_tsvector('english', title || source_name || notes))
```
A full-text index already exists and has been maintained on every write.
`idx_recommendations_source_name` exists too.

`BACKLOG.md` Priority 4 says "no search exists" and Priority 2 is source
browsing. **Both have their database work already done.** They need a query and
a screen, not infrastructure.
Caveat: the `'english'` text-search config will not stem Hindi, which matters
little for title and name matching.

### G27 · Nothing tests a save end to end — **A**
Three golden suites, 58 + 16 checks, and every one of them tests a *function*.
Every defect that reached production in Session 18 lived in a **seam**:
capture → row, row → enrichment, write → later write, model → catalogue.

Findings A, B, M and N were all seam failures. Four code audits in one evening
missed M, which was found only by walking backwards from a field to its
producers.
**Closes when** one test follows a single save from tap to rendered card.

### G28 · The synopsis is stored and never shown — **D** *(opportunity)*
`metadata.overview` is written on every confirmed watch card and read nowhere.
`genres` and `runtime_minutes` are similarly unused in most views. The detail
screen has the film's synopsis in the row and displays none of it.

---

## RESOLVED

### R01 · `status_changed_at` did not exist — *closed S17, 2026-08-12*
North-star metric was unmeasurable; `max(created_at)` was being misread as
completion date. Column added, 6 rows backfilled from `updated_at` (approximate,
flagged).

### R02 · `last_opened_at` did not exist — *closed S17, 2026-08-12*
Weekly snapshot would have gone blind past the 90-day event window. Column added.

### R03 · `claim_anonymous_saves` dropped zero-save sessions — *closed S17*
`IF source_count = 0 ... RETURN 0` meant a browse-and-leave first session
transferred nothing. Replaced by `claim_anonymous_session`, which also moves
events and `search_log`. Old function retained until the new one is proven (G10).

### R04 · `rollup_daily` PK forced `category` NOT NULL — *closed S17*
Declared nullable but placed in the primary key, so every category-less event
(`app_opened`, `search_performed`) would have failed to roll up — silently losing
the most important question in the system. PKs replaced with unique indexes over
a `category_key` column. Same fault fixed in `rollup_enrichment`.
**Found only by building the consumer.** Existence checks would never have caught it.

### R05 · `pg_cron` not enabled — *closed S17*
Dropped in error when converting a migration to a file. Installed; two jobs live.

---

### R06 · G04 `status` enum — *closed S17, not a gap*
Six per-category CHECK constraints already existed: `read` allows
reading/finished/abandoned, `do` allows done, the rest allow experienced.
A global three-value constraint was briefly added and **reverted within a
minute** — it would have blocked a book from being marked "reading" and an
activity from being "done", and it validated cleanly because no row uses those
statuses yet. The damage would have surfaced weeks later with no clue why.

### R07 · G19 enrichment tracking — *closed S17*
Every enrichment now logs, including the auto-confirmed path that previously
recorded nothing. Logs layer evidence rather than a collapsed band, because
`calculateConfidence` is Levenshtein string similarity and calibrating on it
would tune the weakest signal in the stack.

### R08 · G07 photo expiry, partially — *place_id stored S17*
`places.id` was never in the Google field mask. Now requested and stored.
Mirroring to Storage remains open — resolving references on demand is billable
per call against a 1,000/month ceiling, so on-demand resolution is not viable.

---

## HABITS THIS FILE HAS TAUGHT US

1. **A schema is not verified until something has written to it.** R04 survived a
   twelve-point verification because every check asked *does this exist*, none
   asked *does this work*. Build the consumer in the same delivery.
   *Session 18 extension: nor is a WRITER verified until something it wrote has
   been read back.* G17 and G18 both passed every existence check — the code was
   deployed, the columns were there, the calls were in the import list. What
   nobody did for four days was count the rows. The session-open ritual now
   includes non-null counts per instrumented column, not just the vault query.
5. **A counter nothing reads is not instrumentation.** `failureCount` recorded
   every one of these failures faithfully and told no one. Analytics must never
   break a user action; that is not the same as analytics being allowed to fail
   unobserved.
2. **Read the function body, not its description.** R03 was documented in the KB
   as "six layered guards" — true, and it said nothing about what they guard.
3. **When a metric drives a decision, name the column it reads.** The two-month
   misreading came from `max(created_at)` meaning save date, not completion date.
4. **Deliver for the tool actually in use.** Multi-statement SQL fails silently in
   the Supabase editor, which shows only the last result.
