# KB-MEASUREMENT_DECISIONS.md

> **Primary reader:** both (planning Claude and Claude Code).
> Session 17 · 2026-08-12
> **Read this when you are about to change the measurement layer and can't remember why it looks like this.**
> Companion to `KB-MEASUREMENT_SPEC.md` (what it is). This file is *why*.

---

## The finding that started it

A direct query of the vault, 2026-08-12:

| Status | Count |
|---|---|
| saved | 27 |
| experienced | 3 |
| dismissed | 3 |

Session 16 read this as "nothing experienced in two months." **That reading was
wrong**, and the correction is the origin of everything below: it measured
`max(created_at)` on experienced rows — the *save* date, not the completion date.
Actual last completion was ~25 July, two and a half weeks earlier.

**Lesson recorded as a habit:** when a metric drives a decision, state which column
it reads and whether that column means what the metric claims. T2 applies to your
own instrumentation, not just to code.

Second finding, sharper than the first: **two of the three experienced rows have
`reaction: null`.** The loop isn't only slow — when it does complete, the final
step doesn't fire.

---

## Decisions, with the reasoning that produced them

### D1 · One `events` table, not three
Questions worth asking are sequences that cross domains — *what happened between
the save and the completion*. Three tables makes every timeline query a three-way
union.
**The risk this creates:** a junk drawer. Schema-on-read rots when every caller
invents its own shape.
**The mitigation, which IS the design:** exactly one writer (`lib/analytics/track.ts`).
No route inserts directly. If that rule erodes, the table is finished.

### D2 · `kind` is a Postgres enum, not text
A typo in a text kind silently creates a category nobody notices for six months.
An enum fails at insert. Cheap insurance against the classic analytics rot.

### D3 · Partition from the first row
`DELETE` in Postgres does not return disk to the OS — deleted rows become dead
tuples needing `VACUUM FULL`, which takes an exclusive lock.
**This is the one thing that cannot be retrofitted without downtime.** Everything
else here is deferrable.

### D4 · One index only
Measured on this database: `recommendations` holds **24 kB of rows inside 304 kB
of total size** — indexes cost ~12× the data. Every extra index is a permanent
tax on every write.
**Add the second index when a query is actually slow. Not before.**

### D5 · Roll up nightly from day one; delete nothing until 100 users
Ujjawal's call was to defer both. Refined to defer only deletion.
**Why:** if the rollup first runs against six months of accumulated data and
immediately deletes its source, that is the worst possible moment for it to have
a bug. An undercounting rollup that deletes its input is unrecoverable.
**Principle: you cannot check a summary against the thing it replaced once the
original is gone. This is the only window in which the check is possible.**
Hence `verify_rollup` (spec §12) and the 30-consecutive-clean-nights precondition.

### D6 · Grain = `user + local_date + category + part_of_day`
**Grain is the whole decision.** Anything in the grain survives forever; anything
outside it dies with the raw events.
Dropping `user_id` would kill cohorts permanently — "40 opens on Tuesday" with no
way to know if that was new users or old ones, and no way to recover it.

### D7 · Cohorts defined at question time, never pre-computed
Nothing anywhere stores "July cohort." Every rollup row carries `user_id` and a
date; cohorts are a `JOIN` invented at the moment of asking.
**Why it matters:** you don't yet know which cohorts will be interesting.
*People whose first save was Dine. People who used search in week one.* All stay
askable as long as user and date survive.

### D8 · Cohorts anchor to FIRST SAVE, not signup
Registration is a click. Activation is the real start. Anchoring to signup makes
every retention number mean less than it appears to.

### D9 · Local date, not UTC
IST is +5:30. Grouping by UTC scatters every session after 6:30pm IST onto the
following day. For a product where "did I open it today" is the question, that is
systematic misfiling, not rounding.

### D10 · Weekly snapshot added
**An event log is structurally blind to inaction.** 27 untouched saves generate
zero events. A card ignored for two months looks identical to one saved yesterday:
silence in both cases.
Events are a video of what happened. The snapshot is a photograph of what the
vault *looks like*. You need both.
**Watch `oldest_untouched_days`.** If it climbs 1/day the bottom is dead. If it
ever drops, something down there was rescued — find out what caused that.

### D11 · `found_via` is OBSERVED, never asked
The app knows which screen you came from. Asking the user to report something we
can observe is worse data and a worse experience.
**It is also impossible to reconstruct afterwards** — by the time the completion
is recorded, the journey is gone.

### D12 · One optional question at completion
> *What made you finally do it?* · reminded · was nearby · planned · **stumbled on it here**
The fourth option is the point. It is the only direct evidence the vault *caused*
something rather than merely recording something that would have happened anyway.
**If nobody ever picks it, the product is an archive, not a tool.**

### D13 · Three enrichment outcomes, not two
`accepted` · `corrected` · **`untouched`**.
No correction ≠ correct. The user may not have noticed, or not cared. Collapsing
`untouched` into `accepted` would flatter the confidence bands, which is the exact
failure this measures.

### D14 · Correlation ID for late corrections
A photo accepted at save time and corrected four days later must find its way
home. The enrichment gets a ticket number; the correction quotes it. Without this,
"of everything we called fairly_sure, what share got corrected?" is unanswerable.

### D15 · NO location in events, ever
There is a useful version and a surveillance version and they're easy to confuse.
**Resolution: proximity is computed on the device and never stored.** The phone
knows where it is; the vault knows where the restaurant is; only the *result*
(`nearby_surfaced: true`) is logged. No coordinate leaves the device.
It fails the Wrapped rule as *data* and passes it as a *feature* — which tells you
it belongs in the product, not in the log.

### D16 · NO title or note text in events
Titles already live in `recommendations`. A second copy drifts on edit, ages
inconsistently, and turns a behaviour log into a content log — a completely
different privacy shape. Store `card_id` and join.
**Sole exception: search queries.** Those are not a duplicate of anything; they
are the user's own words about their own vault, and the words *are* the data.

### D17 · `ON DELETE SET NULL`, not `CASCADE`
The queued anonymous-user cleanup must delete the *account* and keep the events.
A cascade would destroy exactly the first-session data the transfer function
exists to protect.

### D18 · Metrics explicitly REFUSED
Session length · DAU · streaks · notification-driven re-engagement.
**For Taareef a short session is a success** — you found the thing and left. If
session length ever becomes a metric here, the product has drifted from its thesis.
**North Star: completions. Counter-metric: saves.** A design that raises
completions by suppressing saving has broken the product.

### D19 · The completion mechanism must not nag
The obvious fix is notifications. It would probably work and it fails the Journal
Test outright. **A journal doesn't chase you.**
**Kill criterion, stated in advance:** if the completion flow ships and
`oldest_untouched_days` is still climbing after six weeks, the design was wrong —
say so, rather than adding a second prompt on top of the first.

---

## Live-database findings that changed the build

Verified 2026-08-12 against `tcuyfrcmjrtczneklhmx`.

### F1 · `claim_anonymous_saves` would have silently dropped events
Reading the function body (not the KB description of it) found:
```sql
IF source_count = 0 OR source_count > 3 THEN RETURN 0;
```
Both branches are right for saves and wrong for events:
- `= 0` — a browse-and-leave session has no saves and is the most interesting session there is
- `> 3` — an enthusiastic first session loses its entire event history

**Resolution:** a new `claim_anonymous_session()` keeping guards 1–5 verbatim,
replacing the count guard with an event-appropriate cap (500), moving
recommendations and events in **one transaction**. The old function stays until
the new one is proven.
**Habit recorded:** when reusing an existing function, read its body. The KB said
"six layered guards" — true, and it told me nothing about what they guard against.

### F2 · `last_opened_at` did not exist
The snapshot needs "never re-opened" and "oldest untouched" for items older than
the 90-day event window. Without a durable column the snapshot silently degrades
to noise at the three-month mark. Added.

### F3 · `status` is `text`, not an enum
Unconstrained; any typo is a valid status forever. **Deliberately deferred** —
converting touches every writer. Logged to housekeeping so it isn't lost.

### F4 · Capacity is not the constraint
11 MB database, of which the actual data is under 400 kB. At ~300 bytes/event and
~20 events/user/day within a 150 MB budget: 20 users ≈ 3.4 years.
**What will actually force Supabase Pro, in order:** the 7-day inactivity pause
(already bit us once), then the 1 GB file limit when photos get cached (~5,000
photos ≈ 20 users × 250 saves), then egress. **Not events.**

---

## Architecture findings (audit)

Found while auditing for redundancy. A1 and A3 have since been actioned; A2, A4
and A5 remain and still await explicit per-instance approval under the
UI-preservation tenet.

### A1 · A dead vertical slice — **RESOLVED, 2026-08-13**
| File | State |
|---|---|
| ~~`app/(onboarding)/onboarding/categories/page.tsx`~~ | Deleted, commit `1ba48fe` |
| ~~`app/api/user/preferences/route.ts`~~ | Deleted, commit `18c4ce1` |
| `user_preferences` table | Still present, 0 rows — schema change, not worth a migration |
| `middleware.ts` L50–53 | Comment corrected in Session 17 — now explains the guard and screen were both removed |

Session 14 recorded Screen 3 as deleted from the *flow*; the files themselves
went on 2026-08-13. The stale comment — the dangerous part, because it documented
a redirect-loop hazard for a guard that wasn't there — was the first fixed. See
GAPS.md G06.

### A2 · `category` enum carries 14 dead values
`restaurant, bar, film, tv, music, book, city, activity, podcast, person, eat,
drink, go, see` are all still insertable. Six are live. Postgres cannot drop enum
values — cleaning means recreating the type. **Recommend deferring**; risk exceeds
benefit today.

### A3 · `app-shell.tsx` confirmed dead — **RESOLVED, deleted 2026-08-13**
`components/features/navigation/app-shell.tsx` deleted in commit `1208aa6`. See
GAPS.md G08.

### A4 · `430px` hardcoded in 12 places
`FRAME_MAX_WIDTH` exists in `app-frame.tsx` and is largely unused.

### A5 · Complexity hotspots
`rec-detail-client.tsx` 1,761 lines · `capture-screen.tsx` 1,371 ·
`api/enrich/[id]/route.ts` 1,113. Not urgent; recorded so it isn't a surprise.

---

## What we permanently lose at 90 days

Being honest about the cost of the rollup:
- **Sequence within a session** — "what happens right before someone abandons a save." The biggest real loss.
- **Anything not in the grain** — by definition.

Mitigated by: 90 days is long enough to notice a missing question while the raw
data still exists; and the window is re-confirmed at 100 users rather than settled
now.

---

## If you are confused later, start here

1. **"Why is there a snapshot AND a rollup?"** → D10. Events can't see inaction.
2. **"Why can't I just add an index?"** → D4. You can. Measure first.
3. **"Why don't we store the title in events?"** → D16.
4. **"Why is search_log separate?"** → D16 exception + spec §3. It's an evaluation set, not telemetry.
5. **"Can we turn on deletion?"** → D5. Not until 100 users AND 30 clean `verify_rollup` nights.
6. **"Why not just send a reminder notification?"** → D19. Read it before arguing.
