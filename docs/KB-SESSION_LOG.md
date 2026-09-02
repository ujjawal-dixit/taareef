# KB-SESSION_LOG.md — Taareef
> Living log of every build session. Newest first.
> Last updated: Session 17 — 2026-08-18

---

## Session 18 — 2026-09-02 — Six severity-A fixes, an enrichment rebuild, and a lesson about verifying outcomes

Opened with a vault audit and closed with the enrichment pipeline rebuilt from
first principles. Twelve PRs (#9–#20), all merged. Four of them existed only to
repair or delete work from earlier in the same session.

### What the audit found before any code was written

Three severity-A defects, all invisible, all found by reading rows rather than code:

- **`save_completed` had never once been written.** `trackSaveCompleted('', …)`
  passed an empty string for a `uuid` column, so Postgres rejected the entire
  row and the `catch` counted it into a variable nothing read. The counter-metric
  to the North Star was dead from the day it shipped.
- **`save_abandoned` fired on SUCCESSFUL saves** and then suppressed the next
  save's real abandonment, because `savedRef` was set after an await that
  resolved seconds after the sheet had already closed. A false positive that
  swallowed the following true one.
- **`last_opened_at` was never written** despite `card_opened` firing normally,
  so `never_reopened` and `oldest_untouched_days` could only ever climb — and
  TENETS asks us to investigate if the latter ever *falls*.

### The enrichment rebuild

Four consecutive failures on one input — "Jawaan, starring Shah Rukh, 2024" —
each fix correct, each leaving the outcome identical:

1. **Levenshtein scored the wrong film 100/100.** "Jawaan" is the exact title of
   a 2017 Telugu film. Auto-confirmed silently.
2. **Retrieval filtered by year.** Fixed the filter; never asked whether the
   *query* was right.
3. **The shaped query's entire page was discarded** — concatenate-then-truncate
   filled a pool of ten with twenty results from the user's own spelling.
4. **The judge was blind to cast.** Candidates arrived with `people: []` and the
   prompt rejected anything missing a named person, so naming an actor
   *guaranteed* a "none" verdict.

Replaced with **identify-then-verify**: one model call, asked what the work IS
rather than to guess spellings or pick from a list. The model's output is a
lookup key and a set of claims; every field on the card comes from the
catalogue. A hallucination can only cause a failed lookup, never a fabricated
card — a structural guarantee no prompt rule can make.

Then a regression of my own: **making the model the entry point meant its
knowledge cutoff became the product's reach.** Main Vaapas Aaunga and Dune:
Part Three both released in 2026; the model said `known: false` and the pipeline
stopped, though TMDB had both. Fixed — the model narrows, it never terminates.

### Mistakes, and what they cost

- **PRs #11 and #12 were built and deleted four hours later.** They were
  hypotheses shipped as conclusions.
- **`original_title` was written and then destroyed 50 lines later** by a second
  metadata write spreading a stale snapshot — the same bug I had fixed in PR #10,
  in the same function, reintroduced beneath my own comment warning about it.
- **`last_band` was never written on the confirm path.** The string replacement
  meant to add it silently did not match, and I verified by reading the diff.
- **A whole PR was rebuilt from scratch** (#19) an hour after it was pushed.
- **Finding M survived four audits of the enrichment route** because every audit
  asked "did this write survive?" and none asked "who writes this field?"

### The process finding

Direct push access removed the only review gate. The paste workflow was doing
two jobs — delivery and review — and only delivery was replaced. Ten PRs in one
evening, merged unread, with essay-length descriptions that made review harder
rather than easier.

**Agreed for next session: nothing is built until Ujjawal confirms.** Not a cap
on volume — a gate on starting.

### The deeper constraint

Every hypothesis had to be merged to production and checked on a phone. There is
no local dev environment and Claude's sandbox cannot reach Groq or TMDB, so
**merging was the only way to find anything out.** That, more than any design
fault, produced the churn.

### Tenets added

- **T23** — ask each part the question it can answer. Knowledge from the model,
  proof from the catalogue, decisions from arithmetic. Never ask a model its
  confidence. A second model is not a second opinion.
- **T24** — read backwards from the field to all its producers.
- **T21 extended** — verify the file, not the diff. `tsc` passing means the code
  is consistent, not that your change happened.
- **T2 extended** — the tenet applies mid-conversation, not just before code.

### Open at close

- **Sixteen audit findings**, G17–G28 in `GAPS.md`. G22 (listen/read
  auto-confirm unverified) and G27 (nothing tests a save end to end) are the
  severity-A ones.
- **PR #20 is merged but untested in production.** A typed save — "Jawaan", note
  "starring Shah Rukh Khan" — should now confirm silently. That is the first
  end-to-end proof the corroboration design works.
- **Every band statistic collected before PR #18 is inflated 2–3×**, because
  enrichment fired two to three times per card. Numbers from before 2026-09-02
  should not be quoted.
- **Search and source browsing already have their database work done** (G26).
- **The highest-leverage product change is not the LLM** — it is Indic ASR.
  "Jawaan" was a transcription failure; everything after it was compensation.

---

## Session 17 — 2026-08-12 → 18 — Measurement layer, safety rails, and a session that ran too long

**Shape of the session:** built the measurement layer from nothing, then spent the back half building the process rails that should have existed first — backups, branch protection, a single source of truth. Ended with more tenets than features, for reasons that are themselves the lesson.

### The correction that opened it

Session 16 read `max(created_at)` on experienced rows and concluded nothing had completed in two months. **That column is the SAVE date, not the transition date.** The real gap was ~2.5 weeks. The reprioritisation it caused was built on a misread column.

Sharper finding underneath it: **two of three experienced rows have `reaction: null`.** When the loop does close, the final step does not fire.

### Built

**Measurement layer.** Partitioned `events` table (monthly), `search_log`, `rollup_daily`, `rollup_card_monthly`, `rollup_enrichment`, `rollup_funnel_daily`, `snapshot_weekly`. Two writers only — `lib/analytics/track.ts` (browser) and `track-server.ts` (routes). No route inserts directly.

Governing rule: **only log what you would show the person in their own Wrapped.** No dwell time, no location, no content. Search queries are the sole exception — they are the user's own words and the words are the data.

**First weekly snapshot, on real data:** 26 saved · **20 never re-opened** · oldest untouched **82 days** · 3 completed ever · **5 of 6 categories with zero completions.** The core problem, finally a number.

**Database safety.** `recommendations_backup` with 14 daily snapshots, dry-run-first `restore_from_backup`, `/api/health/database` watching for the silent pause that caused a two-week outage. `cleanup_anonymous_users` — de-identifies rather than deletes, so non-converting sessions survive as funnel data.

**Anonymous session handling.** `claim_anonymous_saves` refused when the session had **zero** saves — exactly the browse-and-leave first session most worth keeping. Replaced by `claim_anonymous_session`, moving recommendations, events and searches in one transaction.

**GitHub workflow.** Ruleset on `main`, PR required, fine-grained token scoped to Contents + Pull Requests. Admin endpoints return 403 — Claude cannot alter its own guardrail.

**Enrichment logging (A4).** The confident path auto-confirmed **without logging anything** — the path where a wrong match costs most and is least visible. Now logs layer evidence rather than a band, because `calculateConfidence` is Levenshtein string similarity: "Gokul Bar" vs "Gokul Bite" scores ~80 and is wrong; "Chungking Express" vs its Chinese title scores ~0 and is right.

**`places.id` (A1a)** was never in the Google field mask. Now requested and stored.

**`/docs` as single source of truth.** Eleven files existed only in Claude project knowledge, backed up nowhere.

### Mistakes, and what they cost

| Mistake | Cause | Cost |
|---|---|---|
| `rollup_daily` PK forced `category` NOT NULL | Nullable column placed in a primary key | Would have silently dropped every `app_opened` event. Found only by building the consumer |
| Global `status` CHECK added | Did not list the six per-category constraints that already existed | Would have blocked books being "reading". Reverted in one minute |
| A1 diagnosed twice wrongly | Guessed a metadata key name; concluded absence from a failed grep | Nearly justified building photo mirroring when the key was never lost |
| **Built A1a/A4 twice** (PRs #3 and #4) | Lost the earlier turn from context and rebuilt it | ~40 min, plus a merge conflict on Ujjawal's phone |
| **Blamed the duplication on Claude Code** | Guessed a cause and wrote it into TENETS.md as fact | A wrong tenet nearly shipped permanently |

**Every one is the same error: concluding something was absent without enumerating what was present.**

### Tenets added

T17 preview before you destroy · T18 one file one purpose one run · T19 branch, preview, merge · T20 check whether you already did it · T21 verify before explaining · T22 long sessions end.

### Open at close

- **Motion direction (G13)** — blocks retrieval, completion, archive, the compact card. **The single largest blocker in the project**
- **`enrichment_id` on 0 of 35 rows** — code deployed, never exercised. Save something ambiguous to verify
- **Photo mirroring to Storage** — on-demand resolution is billable against a 1,000/month ceiling, so mirroring is the answer. Touches render paths; proposal not written
- **Anonymous transfer success path unproven** — every guard proven to refuse; the path that moves data has never run
- **Token rotation** — pasted in chat, should be replaced

---

## Session 16 — 2026-08-10 — Workflow audit; the finding that reorders the backlog

**Trigger:** the CV link was dead. The Supabase project had paused after ~2 weeks of inactivity — `INACTIVE` in the dashboard, `ERR_NAME_NOT_RESOLVED` in the browser. Restored; all 32 recommendations intact. `DATA_SAFETY.md` had predicted this exact failure and attached it to the wrong trigger: the threshold was written as "more than 10 users" when the real trigger was "the link is public", which was already true when we wrote it.

### The finding that matters most

A direct query of the founder's vault:

| Status | Count | Most recent |
|---|---|---|
| saved | **19** | 12 days ago |
| experienced | 3 | **2 months ago** |
| dismissed | 3 | 2 months ago |

**Nothing has been marked experienced in over two months.** The core loop — save, experience, react — has not completed once since early June.

Diagnosis: the product is excellent at intake and has no digestive system. Weeks went into the first ninety seconds while the back half — retrieval, source browsing, completion — stayed unbuilt. The V1 north-star ("save ≥3 in week 1") has been answered for months. The unanswered question is whether the vault is ever *used*. **The metric that matters now is whether "2 months ago" changes.**

### Bugs found and fixed

- **Google Places photo URLs expire.** They were stored as permanent `image_url`. Verified: 6 cards affected, 0 recoverable (no `photo_refs` stored), 14 TMDB URLs unaffected — which is why films kept their posters and restaurants lost theirs. A dead URL rendered the browser's broken-image state with the card title stamped across the artwork.
- **All four card render paths were unguarded** — full card, grid, compact, demo examples. The grid/compact miss was the long-open *"grid card photo gap (Old Street Bar and likely others)"* from Session 13, finally root-caused.
- **A dead URL hid its own escape hatch.** "add a photo" is gated on `!liveImageUrl`; the dead URL was still present, so the app believed a photo existed and hid the only way to replace it. `FullCard` now reports failure upward and the screen clears the URL.
- **"finding the right poster…" ran forever** when enrichment had finished and found nothing — a permanent state rendering a temporary message. Bounded at 45s.
- **`"Someone"` leaked into real data.** The onboarding demo's fallback source name, on 4 cards, skewing "most trusted source" on the profile. Empty now means empty; source attribution is the core claim and inventing a name to fill a gap undermines it.

### Workflow audit

Every flow is built to the moment of success and abandoned at the edges. Full list in BACKLOG.md. The three largest:

- **There is no search.** The only "search" in the codebase is a URL param for post-delete redirects. Navigation is category → subtype pill and nothing else. At 200 saves — the paywall threshold — it is unusable.
- **Source attribution is decorative.** Stored, displayed on every card, named as the differentiator, and **not navigable.** "What did Ahmed recommend?" is unanswerable. The profile shows "Most trusted source" as a stat that cannot be tapped.
- **Completion has no destination.** Marking something experienced changes a field and nothing else happens.

The unifying shape: **the product asks for something and does nothing with the answer** — reactions, notes, dismissals, source names. Individually small; together a vault that does not feel like it is listening.

### Corrections to claims made this session

- Experienced cards **do** change their vow line (`vowText = isExp ? cfg.participle : ...`). The card's sentence does finish. What is missing is a *place*, not a state.
- The profile's "saves waiting for your verdict" **is** a working link — to `/dashboard`, which cannot show unreacted saves. A design gap, not a broken element.
- Nothing consumes `inFlight`, so a person signing up never sees their card either. The layout refactor's groundwork exists; the surface does not.

### Decisions taken

Experienced cards get **a folder, not different styling** — one axis, not two. Deletion becomes **archive**, living in the profile. Enrichment must **tell the truth about its own certainty** in three bands. Ambiguity is resolved **at save time**, not days later on the detail screen.

**Tenets added:** T15 (completeness is not sufficiency), T16 (ask what the person can do about it). Plus a session-open ritual: query the vault before opening the backlog.

---

## Session 15 — 2026-07-27 to 07-29 — Onboarding rebuilt end to end

### Model crisis, twice

Groq shut down `meta-llama/llama-4-scout` on 2026-07-17. **Screenshot capture had been broken for nine days**, and the error message blamed the user's image — a silent outage disguised as a user problem. Two more models were already dated for 2026-08-16.

All model IDs centralised in `lib/constants/models.ts`; a daily health-check cron added at `/api/health/models`.

Then a subtler failure: GPT-OSS models spend reasoning tokens from the *same* `max_tokens` budget as the answer, so extraction returned truncated content and `JSON.parse` threw. Fixed with `reasoning_effort`, JSON mode, and realistic budgets. Note that `reasoning_format` is **not supported** on GPT-OSS, so the first `stripReasoning` attempt could never have worked — it solved the wrong problem.

### The phantom guest save

The onboarding demo held the first save in React state only — no localStorage, no API call. Someone typed a real recommendation, watched a card appear, read *"your vault is starting"*, signed in, and landed on an empty dashboard. Documented as working since Session 10; never built.

Fixed with **anonymous Supabase sessions**, created on first save tap rather than page load, so someone who only browses never becomes a user.

### `linkIdentity` never worked once

Verified against `auth.identities`: three anonymous users, zero identities. Two structural reasons, neither a bug:

1. It is a redirect flow, so errors arrive after the browser has left and cannot be caught client-side.
2. It cannot work at all when the Google account already has a vault — a normal case, not an edge case.

The failure resembled success: the visitor stayed anonymous, saw their one card, and believed they had signed in.

Replaced with a `security definer` **row transfer** (`claim_anonymous_saves`, six guards). This removed the conflict case entirely — a new account receives the card, an existing vault gains it, same code path.

### Layout refactor

`AppShell` was rendered inside each page, so Next.js destroyed it on every navigation — meaning nothing could watch a save through enrichment, which takes 5–20 seconds. Split into `AppProviders` (layout-level: toasts, capture sheet, save state, `inFlight`) and `AppFrame` (the centred column, nav decided by route).

This also fixed a real bug: the frame chrome had been written **four separate times** and drifted, leaving the card detail screen with no width cap at all. On anything wider than a phone the dashboard was a centred column while the detail screen sprawled edge to edge.

### Onboarding, screen by screen

Headline → **"Your recommendation journal."** Sign-in matched to neon (T1). Fluid `clamp()` type with a `rem` component so it respects accessibility settings — pure `vw` ignores user font size, which is a WCAG failure. `dvh` spacing to close three dead voids.

Illustration rebuilt twice. The second time removed a background glow that read as a stain rather than light, varied object heights, added overlap, and gave each object three tiers of interior detail. Lesson: the first version satisfied every agreed rule — colour mapping, stroke hierarchy, sizing — and still looked like clipart. Rules produce competence, not craft.

Six example cards, one per category. Six pills — the cause was `CAT_LIST.slice(0, 4)`, not layout, after two turns of arguing about widths. **Screen 3 deleted**: it collected preferences nothing consumed, nothing linked to it, and it sat between "I saved something" and "there it is". Capture chooser added so the demo teaches the app's real methods. The visitor's own card now sits above the sign-in prompt and enriches in front of them. `[+]` tooltip added.

### Also shipped

Privacy and terms pages. Three database migrations: RLS cleanup (removing 4 duplicate policies, retargeting to `authenticated`), anonymous save cap, and the claim function. `TENETS.md` and `DATA_SAFETY.md` created.

**Tenets added:** T13 (test steps must be checkable in the environment where they run), T14 (additive first, then switch, then remove).

---

## Session 14 — 2026-07-22 — Reality Reconciliation (no code written)

**Trigger:** Ujjawal asked whether the Project Knowledge files and the actual application still tell the same story. They did not.

**What Claude did differently this session:** instead of answering from KB summaries, Claude used its bash tool to `git clone` the live repo (github.com/ujjawal-dixit/taareef) and its Supabase tool to query the live production database directly (project `tcuyfrcmjrtczneklhmx`, region `ap-south-1`). This was previously assumed impossible (see corrected memory note) — it works, and should be the default way to verify claims going forward, not an exception.

**Findings — repo vs. documentation:**
- Onboarding is NOT "not started." Screens 0, 1+2, and 3 are built and shipped. Only Screen 4's tooltip and the third example card are genuinely missing. Full diff captured in the new header note on ONBOARDING_SPEC.md.
- Plus Jakarta Sans removal, flagged unresolved since Session 10/12, was actually done. Confirmed clean by reading `app/layout.tsx` directly. Closing this permanently.
- `recommendation-card.tsx` does not have a `'full'` variant — the detail-screen card is its own separate `full-card.tsx` component. KB-CLAUDE.md and KB-FILEMAP.md were both wrong about this.
- Several UI primitives and one API route (`app/api/user/preferences/route.ts`) existed in the repo but were never listed in KB-FILEMAP.md.
- `ENV_TEMPLATE.md` was significantly stale — describes an `ANTHROPIC_API_KEY` and `/api/parse` route that don't exist in the current codebase (extraction runs on Groq, not Claude), is missing `GROQ_API_KEY`, `GOOGLE_BOOKS_API_KEY`, `WATCHMODE_API_KEY`, `RESEND_API_KEY`, `FOUNDER_EMAIL` entirely, and lists `SUPABASE_SERVICE_ROLE_KEY` as required though a direct code search found it referenced nowhere. Corrected this session — see updated file.

**Findings — documentation vs. live database:**
- The `category` Postgres enum carries 20 accumulated values (10 original + 8 intermediate + dine/visit) across three schema generations. No live data uses anything but the current 6 — confirmed by direct query. Dead clutter, not an active bug; removing it is a separate, larger piece of work (Postgres enums can't cheaply drop values).
- The proposed "legacy subtype migration" SQL in BACKLOG.md targeted values (`song`, `book`, `manga`, `article`, `doc`, `exhibition`, `concert`, `play`, `ride`, `class`, `experience`) that **do not exist anywhere in production data.** It would have run harmlessly and fixed nothing.
- The real, current data-quality issue is subtype **casing** inconsistency (`"Film"` vs `"film"`, `"Bar"` vs `"bar"`, `"Viewpoint"` vs `"viewpoint"`) — found by querying `metadata->>'subtype'` directly. Affects 5 known rows as of this session.
- Supabase project region is `ap-south-1` (Mumbai), not Singapore as previously assumed in conversation memory and in KB-CLAUDE.md / KB-DECISIONS.md. Corrected in both this session.
- A stale `CLAUDE.md` file sits in the repo root describing the original 10-category system. It is not the current source of truth and was never deleted as the product evolved — flagged in KB-FILEMAP.md as historical, not authoritative.

**Follow-up discussion, same session, on the four open items from the first pass:**
- **Item 9 (home-city default):** Ujjawal rejected the other four suggested profile fields (price sensitivity, neighbourhood, dietary, language) as failing the "single definite fact" test that home-city passes, but asked for deeper ideation specifically on the travel/"currently away" toggle. See BACKLOG.md V2 section for the expanded design.
- **Item 10 (picker resolution):** confirmed directly against Google's own current core-services price list (fetched live, dated 2026-07-15 UTC): Places API Place Details Photos is a flat per-request SKU ($7.00/1,000 globally, USD, at the 0–100K tier) — resolution requested does not change the price. Dropping picker thumbnails to 400px saves latency and bandwidth only, not call count or cost. The India-specific rupee figures already recorded in KB-DECISIONS.md (₹919/1K Text Search, ₹488/1K Photos, 35,000 free/month) could not be independently re-verified from public sources this session — recommend confirming directly against the GCP billing console for the project, since India eligibility pricing is account-specific.
- **Item 11 (usage-pattern dashboard):** Ujjawal wants a real internal dashboard (not just a weekly manual glance) reading enrichment-outcome logs, with the app potentially adapting based on the insights. Agreed to hold as its own dedicated discussion — genuinely a bigger scoping conversation, not a quick add.
- **Item 12 (subtype casing fix, accountability):** Ujjawal asked for the SQL directly plus a durable record of what changes and why. Delivered as `supabase/migrations/003_subtype_casing_fix.sql` (see file) — a real, numbered, committable migration rather than an ad-hoc query, matching the pattern the repo's own `001`/`002` migrations already established.

**Files updated this session (exact project filenames, ready to replace):** BACKLOG.md, KB-FILEMAP.md, KB-CLAUDE.md, KB-DECISIONS.md, KB-SESSION_LOG.md (this file), ONBOARDING_SPEC.md (header note only — no design decisions changed), ENV_TEMPLATE.md. CARD_SPEC.md, DATA_MODEL.md, PROJECT_BRIEF.md, WORKING_AGREEMENT.md, and 10_-_UX_PRINCIPLES.md were checked for the specific claims relevant to this session's findings (category count, region) and none were found — left untouched, since inventing changes without a discovered discrepancy would recreate exactly the problem this session was meant to fix. 02_-_API_SPEC.md was found to be significantly stale in its own right (references a `/api/parse` route and an Anthropic-API-based system prompt that don't exist in the current codebase) but at 426 lines describing every route's full contract, it needs its own dedicated reconciliation pass — the same treatment onboarding just got — rather than a same-session rewrite.

**What's next:** the onboarding reconciliation discussion (screen-by-screen, using the ONBOARDING_SPEC.md header note as the working document), the usage-dashboard discussion (item 11), and — whenever there's time — the same reconciliation pass for 02_-_API_SPEC.md.

**Process improvement:** going forward, before marking anything "not started" or "pending" in a KB file, verify against the live repo/DB the way this session did — it takes minutes and would have caught all of the above much earlier.

---

## Session 13 — 2026-06-24 — Places enrichment: Foursquare migration, five-layer disambiguation, photo picker, calibration release

**Goal at start:** Dine cards were not enriching at all (Foursquare returning 410 on every call).

**What happened, in order:**

1. **Diagnosed via Vercel logs** that Foursquare's V3 API was deprecated May 15 2026 — not a key problem, an entire-platform-dead problem.
2. **Migrated to Google Places API (New)**, India billing tier. Full Google Cloud setup walked through together: project creation, billing, budget alerts, API enablement, key restriction, daily quota caps (settled at 1,000/day per SKU), SKU pricing researched precisely (35K free/month, not the 5K initially assumed for the global tier).
3. **Built a Supabase `api_usage` counter** (self-imposed 1,000/month ceiling, auto-reset at month boundary) as a second layer of protection beneath Google's own quota.
4. **First Google Places integration shipped** — then immediately hit "Gokul Bar shows Bademiya's photo." Diagnosed (wrongly) as a query-construction bug, fixed. Still broken. Diagnosed (wrongly) as an index mismatch between filtered/unfiltered arrays, fixed. Still broken.
5. **Explicit RCA turn:** stopped guessing, instrumented five decision points with structured logging, ran one test save, got real evidence. The actual cause: Google returned exactly one result, genuinely named "Gokul Bite" — not Bademiya at all, and every layer had behaved correctly given that input. The gap was that no rule existed to tell "plausibly related" apart from "actually the same place." This is the session's central methodological lesson.
6. **Built the five-layer disambiguation architecture** (clean query + structured type filter, plausibility pre-filter, structured locality extraction from addressComponents, parallel photo+LLM, rejection-first LLM prompt, strict-exactness hard rule, geographic hard rule) — verified against the Gokul Bite case and it held.
7. **Product conversation on Zomato** as an alternative photo source — researched and ruled out (dead developer access + license terms prohibit the exact use case).
8. **Designed and built the photo picker system across three builds:**
   - Build 1: data foundation — photo refs stored on confirmed venues and candidates (free, from the existing search response), strict exactness discipline.
   - Build 2: `PlacePhotoPicker` component + lazy `/api/places/photo` resolution route, wired into the detail screen. Found and fixed a critical latent bug in passing: the PATCH route never persisted `image_url` at all.
   - Build 3a: same picker wired into the edit screen (component's upload tile made optional).
9. **Deployment troubleshooting:** a file-swap error (detail/edit component contents pasted into each other's paths) diagnosed from the Vercel build error and fixed with clearly-labelled folders. Then a genuine regression reported ("build 1 worked before, stopped after build 2/3") — traced via fresh-clone diffing to a producer/consumer gap: Build 1 added photo_refs to candidates, but the pre-existing strip-confirm handler was never updated to copy them onto the card. Fixed; confirmed working by Ujjawal.
10. **Two new real edge cases surfaced by Ujjawal after confirming the picker worked:** Gateway of India forced to confirm every time (geo rule too narrow — fixed), Imagicaa World Khopoli returning nothing (type filter too narrow — fixed with two-pass search).
11. **Calibration release** (6 changes, agreed as one coherent set): widened geo rule, two-pass search, address-aware exactness (the *safe* version of an initially-proposed "singleton rule" that would have re-broken Gokul Bite — caught before building), model swap to llama-3.1-8b-instant for speed, save-delay trim (800ms→300ms), detail-screen re-fetch so enrichment "arrives while you watch," and — the structural piece — extraction of all matching logic into `lib/places/matching.ts` with a permanent golden-test suite (`scripts/matching.golden.ts`) encoding every named bug this session as a regression check.
12. **Part B code cleanup** run alongside: `foursquare_confirmed` → `place_confirmed` rename, enrich functions typed to `Recommendation` not `Record`, `RecMetadata` casts extended to render components, dead fields removed, feedback route auth added.
13. **Discussed and answered four product questions directly:** the save-vs-confirm decision method, what must be user-provided vs enrichable, latency/smoothness levers, and a full beta-readiness test checklist for the first 10 external users.
14. **Category-ambiguity question raised** (a waterfall could be visit or do) — approach proposed (intent-verb weighting + one-tap two-chip clarification, never blocking), queued as a next action pending go-ahead.
15. **Session close:** all Knowledge Base files rewritten in full (this file, KB-CLAUDE.md, KB-DECISIONS.md, KB-FILEMAP.md, BACKLOG.md) to prepare a clean handoff to a new session, since Claude cannot write directly to Project Knowledge files — Ujjawal uploads these manually.

**Deliveries this session (chronological):** taareef-google-places, taareef-places-llm (four solutions: LLM disambiguation, candidate strip, zero-result nudge, location_hint normalisation), taareef-places-index-fix, taareef-places-rca-instrument, taareef-places-five-layer, taareef-part-b-cleanup (13 findings), taareef-build1-data-foundation, taareef-build2-photo-picker, taareef-build3-edit-picker, taareef-fix-swapped-files, taareef-fix-photo-refresh, taareef-fix-refs-passthrough, taareef-calibration-release.

**Insight:** The single most valuable thing that happened this session wasn't a fix — it was a change in method. Three consecutive wrong guesses on the same bug is the signal to stop reasoning-from-plausibility and start instrumenting-for-evidence. That shift (RCA via structured logging → one test save → certain diagnosis) should be the default response the moment any bug survives a second fix attempt, in this codebase or any other. The golden-test suite built at the end of this session is the same principle made permanent: every named bug is now a line of code that fails loudly if it ever comes back.

### Files Changed This Session

**New:** `lib/places/matching.ts`, `scripts/matching.golden.ts`, `components/features/places/photo-picker.tsx`, `app/api/places/photo/route.ts`

**Updated:** `app/api/enrich/[id]/route.ts` (fully rebuilt enrichPlaces), `app/api/recommendations/route.ts` (delay trim), `app/api/recommendations/[id]/route.ts` (image_url persistence fix), `app/api/feedback/route.ts` (auth added), `lib/types/index.ts` (RecMetadata extended + cleaned), `lib/card/derive.ts` (correct enrichment keys, earlier Part A), `app/(app)/rec/[id]/rec-detail-client.tsx` (candidate strip, nudge, picker, refresh, re-fetch effect), `app/(app)/rec/[id]/edit/rec-edit-client.tsx` (picker wired in), `components/features/cards/recommendation-card.tsx` (RecMetadata casts), `app/(app)/dashboard/[category]/category-list-client.tsx` (RecMetadata cast), `app/api/capture/understand/route.ts` (location_hint normalisation)

### What's Working Now (verified by Ujjawal)

- Dine/Visit/Do enrichment via Google Places, five-layer disambiguation ✓
- Place candidate strip on ambiguous matches ✓
- Photo picker on detail screen and edit screen, with attribution and lazy loading ✓
- Photo selections persist across navigation and refresh ✓
- Gokul Bar → Gokul Bite correctly demoted to strip (not silently wrong) ✓

### Next Session Priority (as recorded at the time — see Session 14 above for what actually happened)

1. Deploy the calibration release (widened geo rule, two-pass search, address-aware exactness, model swap, delay trim, detail re-fetch, matching module extraction) if not already deployed.
2. Run the golden test suite (`npx tsx scripts/matching.golden.ts`) to confirm 16/16 still pass in the live repo.
3. Decide on category-ambiguity chips (waterfall = visit/do) — build if confirmed.
4. Execute the beta-readiness test pass before inviting the first external users. See BACKLOG.md for the full checklist.
5. Confirm whether `app/layout.tsx` still loads the dead Plus Jakarta Sans import (flagged repeatedly since Session 10/12, never confirmed fixed). **Resolved Session 14 — confirmed removed.**

---

## Session 12 — 2026-06-15 — Cards & Enrichment Session

*(Prior session — full detail in project transcript archive. Summary: card component and detail screen consolidation work, enrichment pipeline hardening, groundwork that Session 13 built on directly.)*

---

## Session 11 — 2026-06-12 — Session 11 Build

*(Prior session — full detail in project transcript archive.)*

---

## Session 10 — 2026-06-10 — Folk-Art Motif System, Card Rebuild, Vocabulary Alignment, Category Rename

### What We Did

**Folk-art motif system — designed and built (24 medallions, 6 traditions):**
- Philosophy locked: motif represents the category (its folk tradition and soul); subcategory is named in the card's text. Forcing the art to spell out "documentary" = the costume problem.
- Each category = one authentic Indian folk tradition. Each subcategory = a distinct medallion within that tradition (siblings, not twins).
- All 6 traditions studied before drawing — grammar, philosophy, authentic visual language.
- 24 medallions approved across 6 HTML proof files (one per category).
- Built into `components/features/cards/category-motif.tsx` (733 lines) — procedural SVG builders in TypeScript, registry with aliases, per-category default fallback. viewBox `-100 -100 200 200`, centered via translate(-50%, -52%).
- Wired into `recommendation-card.tsx` (full + grid variants) and `rec-detail-client.tsx`, replacing the old `Rangoli` placeholder.
- Key lesson: Gond's soul is the infill — dense rhythmic dot-dash-seed marks must fill every form. Sparse Gond is wrong Gond.
- Café clip-path id made unique per-render to prevent SVG id collision across multiple cards on one screen.

**Canonical subcategory vocabulary — locked and aligned (Session 10):**

| Category | Old (retired) | New (canonical) |
|---|---|---|
| watch | film · series · doc | film · series · documentary |
| listen | album · song · podcast | album · podcast · audiobook · artist |
| read | book · manga · article | fiction · non-fiction · poetry |
| dine | restaurant · bar · café | restaurant · café · bar · street food |
| do | hike · adventure · ride | hike · trail · adventure · workshop · live show |
| visit | exhibition · concert · play | museum · gallery · heritage · viewpoint · market |

Vocabulary aligned across multiple layers simultaneously:
1. `constants/categories.ts` — nudge arrays (the filter pills)
2. `app/api/capture/understand/route.ts` — `VALID_SUBTYPES` server validator
3. `app/api/capture/understand/route.ts` — the LLM prompt's VALID VALUES
4. `components/features/cards/category-motif.tsx` — the registry (also carries legacy aliases for backward compatibility)
5. `buildMetaLine` in both card files — retired `song` branch removed, `audiobook` branch added
6. `constants/nudge-questions.ts` — music survey question updated (song → podcast)
7. `constants/categories.ts` — empty-state body copy updated (Do and Visit)
8. `lib/types/index.ts` — Category type comments updated

**`do` category renamed to "Experience" (user-facing only):**
- Code id stays `do` — changing it would require a Supabase migration and break all existing rows.

**Edit screen built (/rec/[id]/edit).**

**Mark as experienced button added (P0 bug — core loop was broken).**

**Information layer confirmed for all 6 categories.**

### Files Changed This Session

`constants/categories.ts`, `lib/types/index.ts`, `lib/utils/fallback.ts`, `components/features/cards/recommendation-card.tsx`, `components/features/navigation/category-bar.tsx`, `components/features/vault/empty-state.tsx`, `app/(app)/dashboard/dashboard-client.tsx`, `app/(app)/dashboard/[category]/category-list-client.tsx`, `app/(app)/dashboard/[category]/page.tsx`, `app/(app)/rec/[id]/rec-detail-client.tsx`, `app/(app)/profile/page.tsx`, `app/api/recommendations/route.ts`, `app/api/recommendations/[id]/route.ts`, `app/api/enrich/[id]/route.ts`, `app/api/capture/audio/route.ts`, `app/api/capture/ocr/route.ts`, `components/features/capture/capture-screen.tsx`

**New:** `app/(app)/rec/[id]/edit/page.tsx`, `app/(app)/rec/[id]/edit/rec-edit-client.tsx`

### What Was NOT Done / Needs Next Session (as recorded at the time)

- **Grid card variant** — still old layout. Pending.
- **Compact card variant** — not rebuilt to locked design. Pending.
- **`app/layout.tsx` still loads Plus Jakarta Sans** — dead import verified in code. Remove: the import, the `jakarta` const, and `jakarta.variable` from the body className. **Resolved Session 14 — confirmed removed.**
- **Cast line always empty on Watch cards** — flagged at the time; confirmed fixed by Session 13 (cast field verified working).
- **Audiobook meta line** — new branch added, needed end-to-end test.
- **Old subtype data** — recs saved with retired subtypes render fine (registry aliases) but won't match new filter pills. Optional Supabase UPDATE for cleanup. **Superseded Session 14 — the actual live issue turned out to be casing, not retired values; see BACKLOG.md.**
- **OTT logo fidelity** — inline SVGs are faithful approximations. Official SVGs droppable into `/public/logos/{slug}.svg` anytime.
- **Onboarding flow** — not built. **Corrected Session 14 — mostly built; see ONBOARDING_SPEC.md header note.**

---

## Session 9 — 2026-05-30 — Card Design Sessions (Card Assembly)

*(Primarily the card design lock in HTML: the notch, the OTT-logo-on-poster decision, the flexing well, the "marriage" gradient, the vow footer. Confirmed in HTML, built into the React component in Session 10.)*

---

## Session 8 — 2026-05-29 — 6-Category Migration, Design System, Information Layer, Edit Screen

### What We Did

**Category migration (8 → 6):**
- Eat + Drink → Dine (the matka covers both food and drink)
- See → Visit (Mughal arch = cultural entry)
- Go removed (activities absorbed into Do and Visit)
- Supabase SQL migration applied to production database
- All 6 category configs updated: vivid hex, deepDark, vividRgb, nudges (max 3), gradients

**Design philosophy locked (4 pillars):** Matte · Wong Kar-Wai · Indian Folk Art · Brutalism

**Card design system confirmed and locked.**

**Edit screen built (/rec/[id]/edit).**

**Mark as experienced button added (P0 bug — core loop was broken).**

**Information layer confirmed for all 6 categories.**

---

## Session 7 — 2026-05-22 — UI Overhaul, Mosaic Homepage, Font System, TMDB Candidates

- Built Direction B mosaic homepage: 2×4 grid (later 2×3 in Session 8)
- TMDB enrichment: stores top 3 candidates in metadata.tmdb_candidates
- Card detail: candidate confirmation strip
- Genre hue fallback for no-poster cards
- Semantic CSS font variables defined: `--f-display`, `--f-ui`, `--f-body`
- Profile: Promise.all parallel queries

---

## Sessions 1-6 — 2026-05-11 to 2026-05-21

- Sessions 1-3: Product vision, philosophy, V1/V2/V3 roadmap, knowledge base, Next.js 14 scaffold, Supabase setup, Google OAuth
- Session 4: Google OAuth working end-to-end, first saves, all API keys added to Vercel
- Session 5: Complete rebuild of all 45 project files, WKW design system, 8 categories, all capture methods, TMDB + Spotify enrichment
- Session 6: Critical RLS bug fixed, TMDB posters working, TypeScript build errors resolved
