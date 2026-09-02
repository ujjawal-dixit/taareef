# KB-MEASUREMENT_SPEC.md — Taareef Measurement Layer

> Session 17 · 2026-08-12
> Status: **SPEC FOR REVIEW — no SQL written, nothing applied**
> Verified against live database `tcuyfrcmjrtczneklhmx` on 2026-08-12.

---

## 0. Scope, in one paragraph

This describes an **activity log** and the summaries built from it. It does not touch
`recommendations`, `user_preferences`, or any content the user created — with two exceptions,
both additive columns, both listed in §4.

**Nothing in the vault is ever summarised or deleted by this system.**

---

## 1. Principles

| # | Principle | Consequence |
|---|---|---|
| P1 | Only log what we'd show the person in their own Wrapped | No dwell time, no scroll depth, no location, no content text |
| P2 | Summarise nightly from day one; delete nothing until 100 users | Rollup proven correct ~300 times before it becomes destructive |
| P3 | Partition from the first row | Deletion is `DROP`, not `DELETE`. Not retrofittable without downtime |
| P4 | Cohorts are defined at question time, never pre-computed | `user_id` + local date never leave the grain |
| P5 | Analytics never breaks a user action | Fire-and-forget; a failed write is invisible |
| P6 | No event kind exists without the question it answers | See §5 — every kind has a stated question |
| P7 | North Star = completions. Counter-metric = saves | A design that raises one by suppressing the other has failed |

**Explicitly rejected as metrics:** session length, DAU, streaks, notification-driven
re-engagement. For Taareef a *short* session is a success.

---

## 2. Verified state of the live database (2026-08-12)

| Fact | Value | Implication |
|---|---|---|
| Database size | 11 MB | Almost entirely system catalogs |
| `recommendations` | 304 kB total / **24 kB heap** / 33 rows | Indexes cost ~12× the data. Index sparingly |
| Rows by status | saved 27 · experienced 3 · dismissed 3 | The problem this system must make visible |
| `status` column type | **`text`**, not an enum | Unconstrained. Fix in §4 |
| `status_changed_at` | **absent** | North-star metric currently unmeasurable |
| `last_opened_at` | **absent** | Snapshot would go blind at 90 days without it |
| `pg_cron` | available 1.6.4, **not installed** | One-line enable |
| `pg_partman` | available 5.3.1, not installed | Not required — manual monthly partitions are simpler at this scale |
| `pg_trgm` | **installed** | Already available for source normalisation later |
| `claim_anonymous_saves` | `SECURITY DEFINER`, 6 guards | **Two guards are save-specific — see §7** |

**Capacity:** at ~300 bytes/event and ~20 events/user/day, a 150 MB budget gives
20 users ≈ 3.4 years, 100 users ≈ 250 days. Storage is not the binding constraint.
The binding constraints are the 7-day inactivity pause and, later, the 1 GB file
limit for cached photos.

---

## 3. Table set

| Table | Grain | Retention | Est. size @ 20 users/yr |
|---|---|---|---|
| `events` | one row per action | 90 days *(deletion enabled at 100 users)* | ~45 MB |
| `rollup_daily` | user · local date · category · day part | forever | ~2 MB |
| `rollup_card_monthly` | card · month | forever | < 1 MB |
| `rollup_enrichment` | local date · category · confidence band | forever | < 1 MB |
| `snapshot_weekly` | user · week | forever | < 1 MB |
| `search_log` | one row per query | **forever, never rolled up** | < 1 MB |

`search_log` is deliberately separate from `events`: it is not telemetry, it is the
ground-truth evaluation set for building retrieval. Its value is in the individual
query→open pairs, which a rollup would destroy.

---

## 4. Changes to existing tables

Both additive. Neither alters existing data or UI.

### 4.1 `recommendations.status_changed_at timestamptz NULL`
Written on every status transition. Backfilled from `updated_at` for the 6 existing
non-saved rows, **flagged as approximate** in the session log.
*Answers: has the loop closed, and how long did it take.*

### 4.2 `recommendations.last_opened_at timestamptz NULL`
Written when a card detail view is opened. Durable, so the weekly snapshot can compute
"never re-opened" and "oldest untouched" for items older than the event window.
*Without this the snapshot degrades to noise after 90 days.*

### 4.3 `status` → enum (deferred, flagged)
`status` is currently `text`. Converting to an enum requires checking every writer.
**Not in this delivery** — logged to housekeeping so it isn't lost.

---

## 4b. Session 18 additions to event payloads

⚠️ **Every band statistic gathered before 2026-09-02 is inflated 2–3×.**
Enrichment fired two to three times per card, because the detail screen
re-triggered whenever a card had no image and no candidates — which is exactly
what a card looks like *while it is enriching*. Do not quote pre-September
numbers.

**`enrichment_shown` now carries the whole decision, not just an outcome:**

| Field | Question it answers |
|---|---|
| `decision` | `confirm` / `show_and_ask` / `not_found` — what actually happened to the card |
| `identifyKnown` · `identifyTitle` · `identifyReason` | Did the model recognise the work, what did it name, and why |
| `yearAgrees` · `personFound` · `creditsRead` | Which claims the catalogue independently agreed with |
| `hallucinated` | Claimed to know the work; the catalogue has no such record |
| `fabricated` | Named a cast absent from the real credits — stronger evidence of invention, because it committed to specifics |
| `verified: false` | Set by `listen` and `read`, which take the first search result with no verification at all (G22) |
| `score` | The old Levenshtein number. **Evidence only — it no longer decides anything**, kept so we can show the new path beats the one it replaced rather than assuming it |

**`enrichment_resolved` now records what the right answer was.** It previously
logged the word `corrected` and nothing else; twelve had been logged and not one
could be learned from.

| Field | Purpose |
|---|---|
| `from` | What the card said when it was corrected |
| `phrase` | How **the person** originally wrote it — the half a correction memory keys on, since the next person to be wrong will be wrong in *their* words |
| `to` · `to_id` | What it actually is. `to_id` is the durable half; titles are ambiguous, catalogue ids are not |
| `claimed` | What we asserted at the time. Being corrected after `sure` is a different failure from after `not_sure` |

Deliberately **not** recorded: the note, the source, or the full sentence. The
mapping is useful; the person is not.

**One row of this is a labelled training example** — a phrasing paired with a
verified catalogue id, labelled by a human, at no cost to them. It is the seed
of both correction memory and the eval corpus (G21).

**Four analytics functions exist and can never fire:** `trackSearchPerformed`,
`trackSearchResultOpened`, `trackSourceBrowsed`, and the client-side
`trackEnrichmentShown`. `rollup_daily.searches`, `.search_opens` and
`.source_browses` will read zero until those features exist.

---

## 5. Event kinds — each with the question it answers (P6)

Kind is a Postgres **enum**, so a typo fails at insert rather than silently creating
a new category.

| Kind | Question it answers |
|---|---|
| `app_opened` | Is the vault ever opened without saving? *(the core Session 16 question)* |
| `category_viewed` | Which categories are alive and which are dead? |
| `card_opened` | What gets looked at? Feeds `last_opened_at` |
| `save_started` | How many saves are begun? |
| `save_completed` | How many finish? Gap vs. started = abandonment |
| `save_abandoned` | Where in the flow do people give up? |
| `status_changed` | The North Star. Carries `found_via` and `days_since_save` |
| `search_performed` | Mirrors `search_log` for timeline continuity |
| `search_result_opened` | Did retrieval actually work? |
| `enrichment_shown` | Confidence band + score, with correlation id |
| `enrichment_resolved` | accepted · corrected · untouched *(three outcomes, not two)* |
| `source_browsed` | Is the differentiator used once it exists? |

### 5.1 Fields carried on every row

| Field | Why |
|---|---|
| `id` bigint | — |
| `user_id` uuid | Cohorts (P4). FK to `auth.users`, `ON DELETE SET NULL` — see §7.3 |
| `session_id` uuid | Order within a visit. Unrecoverable if omitted |
| `kind` enum | See above |
| `surface` enum | Same action from the peek vs. detail view = different findings |
| `occurred_at` timestamptz | Client clock — needed when the offline queue lands (Phase 5.2) |
| `recorded_at` timestamptz | Server `now()`. The authoritative time |
| `local_date` date | User's local date, computed at write. **Rollups group on this** |
| `day_part` enum | morning · afternoon · evening · night |
| `category` enum NULL | Recorded **as it was**, not as it is now (see §9.2) |
| `card_id` uuid NULL | Join key. **Never the title text** — see §9.1 |
| `correlation_id` uuid NULL | Links a late correction to its enrichment (§9.3) |
| `payload` jsonb | Only the tail. Hot fields are columns |

### 5.2 Indexes — one to start

`(user_id, local_date DESC)` only.

Given the measured 12× index-to-data ratio, every additional index is a permanent tax
on every write. The second index gets added when a real query is slow, not in
anticipation of one.

---

## 6. Jobs

### 6.1 Nightly rollup — 03:00 IST
1. Read yesterday's events
2. Write `rollup_daily`, `rollup_card_monthly`, `rollup_enrichment`
3. **Delete nothing**

Idempotent: re-running for the same date overwrites rather than duplicates. This matters
because a failed job must be safe to re-run by hand.

### 6.2 Weekly snapshot — Sunday 03:30 IST
One row per user:

| Field | Meaning |
|---|---|
| `total_saved` | Vault size |
| `never_reopened` | Filed and forgotten |
| `oldest_untouched_days` | **The headline number.** Climbs 1/day if the bottom is dead |
| `completed_ever` / `completed_this_week` | Has the loop closed / is it closing now |
| `categories_with_zero_completions` | Which categories are inert |
| `saves_added_this_week` | Intake rate |

Rationale: an event log is structurally blind to inaction. 27 untouched saves generate
zero events. Only a periodic photograph can show a backlog growing stale.

### 6.3 Retention job — **written, disabled**
`DROP` the partition older than 90 days. Ships commented out with a guard requiring an
explicit flag. Enabled only when user count ≥ 100 and the 90-day window has been
re-confirmed at that point.

---

## 7. Anonymous session transfer

### 7.1 The problem found in verification
`claim_anonymous_saves` contains:
```
SELECT count(*) INTO source_count FROM public.recommendations WHERE user_id = anon_user_id;
IF source_count = 0 OR source_count > 3 THEN RETURN 0;
```
Both branches are correct for *saves* and wrong for *events*:
- `= 0` — a browse-and-leave session has no saves but is the most interesting session there is
- `> 3` — an enthusiastic first session loses its entire event history

### 7.2 Resolution
A **new** function, `claim_anonymous_session(anon_user_id uuid)`, which:
1. Keeps guards 1–5 verbatim (target exists, target not anon, ids differ, source is anon, source < 2h old)
2. **Replaces the count guard with an event-appropriate cap** (proposed: ≤ 500 events)
3. Moves recommendations *and* events in **one transaction** — both or neither
4. Returns both counts

`claim_anonymous_saves` is left in place untouched until the new function is verified in
production, then retired. No existing behaviour changes on delivery.

### 7.3 Cleanup interaction
The queued anonymous-user cleanup must **delete the account and keep the events**.
Hence `ON DELETE SET NULL` rather than `CASCADE` on `events.user_id`. A cleanup job that
cascades would destroy exactly the first-session data this section exists to protect.

### 7.4 Accepted loss
Someone who browses, never signs in, and clears their cookie leaves no identity to
re-parent. Unpreventable. Documented so it is not mistaken for a bug later.

---

## 8. The writer

**One** TypeScript module. No route inserts into `events` directly — this is the single
constraint that stops the table becoming a junk drawer.

```
lib/analytics/track.ts
```

- One exported function per event kind, each with a typed payload
- Never throws, never awaits in the user path, never blocks a save (P5)
- Failures increment a local counter; they do not surface
- `local_date` and `day_part` computed here, from the user's timezone

---

## 9. Nuances recorded so they are not rediscovered

1. **No title text in events.** Titles live in `recommendations`. A second copy drifts on
   edit and turns a behaviour log into a content log. Store `card_id`, join when needed.
   *Exception: search queries, which are the user's own words and are the data itself.*
2. **Category is historical.** Once category is editable (Priority 8), a recategorisation
   in October does not rewrite September's rollups. Correct behaviour; will not reconcile
   against current state.
3. **Three enrichment outcomes, not two.** *No correction ≠ correct.* Collapsing
   `untouched` into `accepted` would flatter the confidence bands, which is the exact
   failure this measures.
4. **Card-open-then-exit is ambiguous.** Someone may have left to go to the restaurant.
   Never treat it as abandonment.
5. **No location, ever.** Proximity is a genuinely good *feature* — computed on device,
   result logged as a boolean, no coordinate stored. It is not a *logging* decision.
6. **Cohorts anchor to first save, not signup.** Registration is a click; activation is
   the real start.

---

## 10. Open decisions for Ujjawal

| # | Decision | Recommendation |
|---|---|---|
| D1 | Anonymous event cap in the new transfer function | 500 |
| D2 | `search_log` retained forever with raw query text | Yes — it is the retrieval evaluation set |
| D3 | Convert `status` to an enum now or defer | **Defer.** Touches every writer; not this delivery |
| D4 | Snapshot on Sunday night IST | Yes |
| D5 | Ship the retention job disabled, or not at all until 100 users | **Ship disabled** — writing it now while context is warm, guarded so it cannot fire |

---

## 11. Delivery order

| Step | Contents | Risk |
|---|---|---|
| 1 | `pg_cron` enable · `events` (partitioned) · enum types · one index · RLS | Additive only |
| 2 | Two columns on `recommendations` + backfill of 6 rows | Additive only |
| 3 | `lib/analytics/track.ts` + wiring into existing routes | **No UI change** |
| 4 | Rollup + snapshot jobs, scheduled | Read-only against events |
| 5 | `claim_anonymous_session` alongside the existing function | Old path untouched |
| 6 | Retention job, disabled | Cannot fire |

**No step in this delivery changes any screen, component, copy, or user-visible behaviour.**
(UI-preservation tenet.)

---

## 12. Verification plan

Because P2 makes the rollup destructive only later, correctness must be provable now:

1. A `verify_rollup(date)` function comparing every rollup figure against a direct count
   of raw events for that date. Returns rows only on mismatch.
2. Run nightly alongside the rollup; any mismatch is a hard stop on enabling deletion.
3. At 100 users, a clean run every night for 30 consecutive days is the precondition for
   §6.3 being switched on.

*You cannot check a summary against the thing it replaced once the original is gone.
This is the only window in which the check is possible.*
