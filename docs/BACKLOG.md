# BACKLOG.md — Taareef
> Last updated: Session 18 — 2026-09-02
> Rebuilt from the Session 16 workflow audit. Verified against the live repo and database, not against prior notes.

---

## The finding that reorders everything

A direct query of the founder's vault, 2026-08-10:

| Status | Count | Most recent |
|---|---|---|
| saved | **19** | 12 days ago |
| experienced | 3 | **2 months ago** |
| dismissed | 3 | 2 months ago |

**Nothing has been marked experienced in over two months.** The core loop — save, experience, react — has not completed once since early June.

The V1 north-star ("does the builder save ≥3 things in week 1?") is answered and has been for months. The unanswered question is whether the vault is ever *used*.

**The diagnosis:** the product is excellent at intake and has no digestive system. Every workflow is built up to the moment of success and abandoned at the edges. The three largest gaps — retrieval, source browsing, completion — all sit on the back half, the half that decides whether someone is still here in month three.

**The metric that matters now:** does "2 months ago" change.

**Session 18 update:** still true. 36 cards, last status transition 2026-07-25.
The intake half absorbed two entire sessions; the digestive half is untouched.
That is worth stating plainly at the top of the backlog, because two sessions of
enrichment work did not move the number this file says is the only one that
matters.

---

## What Session 18 changed about this list

Read before planning. Three items are cheaper than this file assumes, and one is
more urgent.

**Search and source browsing are half-built already.** `idx_recommendations_fts`
(a GIN index over title, source_name and notes) and `idx_recommendations_source_name`
both exist and have been maintained on every write. Priority 4 says "no search
exists"; the *database* work is done. They need a query and a screen. See G26.

**Priority 1 has a hidden prerequisite.** The confirmation-at-save-time design
depends on the confidence bands, and until Session 18 `fairly_sure` existed only
in the product's language, never in code. It exists now, derived from a
verdict rather than a spelling score — but it has never been seen by a user.

**The peek needs a card that does not exist.** Ten files render card-like
surfaces independently and none of them share a component. "Rebuild the card for
the peek" is a design-system task before it is a feature. See G23.

**New, above all of these: the highest-leverage product change is not a feature.**
"Jawaan" became "Jawan" through Whisper, and every failure that followed was
compensation for a transcription error made in the first two seconds. Indic ASR
(Sarvam Saaras v3, which has a transliteration mode) fixes it where it happens,
for roughly ₹30 per hour of audio. Nothing in the enrichment pipeline can
recover a name that arrived wrong.

**And a measurement caveat that invalidates old numbers.** Enrichment fired two
to three times per card until PR #18. Every band statistic gathered before
2026-09-02 is inflated 2–3× and should not be quoted.

---

## PRIORITY 1 — Confirmation at save time

**Discuss nuances first, then build.** Ujjawal's stated first priority.

The problem: candidate strips exist but surface on the detail screen, days later, when the person has forgotten which Dune they meant. Ambiguity is cheapest to resolve while context is warm — four seconds after typing, not four days.

Agreed design — enrichment tells the truth about its own certainty, in three bands:
- **Sure** → the photo simply appears. Silence is the confidence.
- **Fairly sure** → shows it with a small "not it?" beside it. Easy to take, easy to ignore.
- **Not sure** → does not pretend. Shows the options and asks.

Open question to settle first: what should happen in the *fairly sure* case, since that band decides whether this feels helpful or naggy.

Depends on: confidence bands (below).

---

## PRIORITY 2 — Source browsing

**The differentiator is currently decorative.** Source is stored, shown on every card, and named as the thing separating Taareef from a bookmark app — and it is not navigable. Verified: `source_name` is selected for display and one profile statistic. Nothing else.

"What did Ahmed recommend?" is unanswerable in a product built on remembering who told you. The profile even shows "Most trusted source" as a stat that cannot be tapped.

Smallest build with the largest change to what Taareef *is*.

Related, queued behind it: source normalisation — trim, case-fold, strip honorifics (bhai, ji, di, da), fuzzy-match with `pg_trgm`, and **suggest rather than auto-merge**. Display name is never rewritten. Silently merging two real Ahmeds is unrecoverable.

---

## PRIORITY 3 — "Your Taareef" (the completion folder)

**Brainstorm before design.**

Marking something experienced changes a database field and nothing else happens. No acknowledgement, no destination. Completion is the one thing the product exists to enable and it is invisible.

**Correction to the Session 16 critique:** experienced cards *do* change their vow line — `vowText = isExp ? cfg.participle : 'to ' + cfg.infinitive`. The card's sentence does finish. What is missing is a *place*, not a state.

Decided: **experienced cards get a folder of their own, not a different visual treatment.** Lean over clever — one destination rather than a second visual axis across every card.

Still open: the sharing boundary (this is where "Share what you love" was meant to land), reaction-gating (loved/good only?), and whether experienced items leave their category list or also appear there.

---

## PRIORITY 4 — Retrieval

**Deep discussion. Ujjawal has an idea to bring to it. Deletion/archive folds into this discussion.**

**There is no search.** Verified — the only "search" in the codebase is a URL param for post-delete redirects. The sole navigation is category → subtype pill: six categories, three or four pills each.

At 22 saves this is invisible. At 200 it is unusable — and 200 is the paywall threshold, so the pricing assumes a scale the navigation cannot survive.

Retrieval is the product. Saving is filing; finding is the value. It is entirely unbuilt, and it is the most likely reason nothing gets experienced: you cannot act on what you cannot find.

Included in this discussion:
- **Archive, not deletion.** Dismissed cards currently vanish with no view, no undo, no trace. Three exist. Deletion is presented as gentle and behaves as permanent. Archive folder to live in the profile section.
- Ujjawal's idea (to be brought to the discussion).

---

## PRIORITY 5 — Enrichment tells the truth

**Prioritised discussion.**

- **Confidence bands** — must be refined against real enrichment outcomes, not invented thresholds. Depends on analytics.
- **"That's not it"** — tied to confidence, never shown on every save. Expressing doubt a hundred times to catch ten errors teaches distrust of something usually right.
- **Re-run enrichment on demand** — deep discussion wanted. Something that found nothing in June stays empty forever even though the data may exist now. Also the repair path for the six cards with dead Places URLs.

---

## PRIORITY 6 — Everyone sees the card enrich

Ujjawal: *"I want both to be the same — seeing the card."*

Today a stranger in onboarding watches their card enrich — motif dissolving into artwork, year filling in. It is the best moment in the product. Someone signed in saves a card and the sheet closes; the same enrichment runs invisibly.

**Verified:** the dashboard has no just-saved surface. Nothing consumes `inFlight`, which the layout refactor already tracks. Someone signing up also never sees their card after landing.

The groundwork exists: `SaveProvider` holds each save from request through enrichment, above the router, surviving navigation. What is missing is the surface.

Agreed direction — **the save peek**: the real card rises from the bottom showing its artwork well and title (~200px, a quarter of the screen — the well is where enrichment is visible, so the cropped part is the part that does not change). Tap to expand, swipe to dismiss, retracts on its own once enrichment settles. Multiple saves **replace** rather than queue.

The peek is also where "which one?" and "not it?" belong, so Priorities 1, 5 and 6 land on one surface rather than three.

---

## PRIORITY 7 — Grid and compact card rebuild

Both variants predate the Session 9 design lock. Open since Session 10.

**Why it matters beyond consistency:** the list is where you meet your vault; the detail screen is where you meet one thing. The beautiful object is currently the one seen least.

**Refinement direction, not shrinking:** a grid tile is a different reading distance, not a small full card. At 200px the seam and dash bar become noise. What must survive is the **notch**, the **title size curve**, and the **source line** — source being the differentiator and currently the first thing dropped when space is tight.

**Decided:** experienced cards are *not* styled differently. They get a folder (Priority 3). One axis, not two.

Spec to be presented before any code (T8).

---

## PRIORITY 8 — Category editable in Edit Details

Ujjawal: it should be allowed there. Never verified whether it currently is. The entire category-ambiguity design assumes it.

---

## PRIORITY 9 — Places photo architecture

**Root cause, still unfixed.** Enrichment persists a signed Google URL that expires. Verified: 6 cards hold expiring Places URLs, 0 recoverable via stored refs, 14 on stable TMDB URLs.

Every new Dine/Visit/Do save still plants a photo that will die. The Session 16 fix means it fails gracefully — containment, not a cure.

Three options discussed:
- **A** — store `photo_ref`, resolve on render through the existing `/api/places/photo`
- **B** — store the ref *and* cache the image in Supabase Storage on confirmation. What Notion, Linear and Readwise do: mirror, don't hotlink
- **C** — "find photos again" action, re-running the lookup to repopulate refs

**Recommendation: B as the architecture, C as the repair.** Principle: *an external URL is a loan, not an asset.* For a product whose promise is keeping things, borrowed artwork undermines the premise.

---

## PRIORITY 10 — Analytics foundation

One Supabase table, `capture_events`, written at **stage boundaries**: method, stage (uploaded/extracted/confirmed/saved/abandoned), model_id, latency_ms, error_code, user_id.

Three design choices carry the value: log the **model ID** on every row (so quality shifts after a migration are provable); log **stage transitions** (extraction failing and extraction succeeding-but-rejected are opposite problems that look identical in an error count); log **abandoned**, not just failures.

Unblocks: confidence bands, first-week design, the user-facing journal, and every question currently answered by intuition.

Retention: delete events older than 180 days.

---

## PRIORITY 11 — Session close: documentation

Roughly twenty decisions and four tenets from Sessions 15–16 exist only in conversation. This session *opened* by fixing documentation drift and then recreated it.

- Fold Session 15/16 decisions into `KB-DECISIONS.md`
- T13 and T14 into `TENETS.md` (done — see file)
- Update `KB-FILEMAP.md` for `app-providers.tsx`, `app-frame.tsx`, legal pages, deleted `app-shell.tsx` and deleted Screen 3

---

## Abandoned at the edges — the smaller list

The pattern: **the product asks for something and then does nothing with the answer.** Each is a small broken promise; together they make a vault that feels like it is not listening.

- [ ] **Reactions are collected and never used.** loved/good/okay/skip is a locked decision. Nothing reads it — no filter, no sort, no surface. A judgement is requested and discarded.
- [ ] **Notes are write-only.** "Best time to go?" prompts a note never shown again at the moment it would matter. **Ujjawal wants this thought through in depth — there is much better use available.**
- [ ] **Empty states are written for zero, not for one.** Six warm messages for an empty category; nothing for a category with one thing in it, which is the more fragile moment.
- [ ] **Category counts count everything.** Watch shows 10 including things already watched. The number that should mean *waiting for you* means *ever saved*, and can only grow.
- [ ] **Offline saves are lost.** No queue. The most common capture moment — a restaurant mentioned in a basement — is the one that fails. **Ujjawal flagged for discussion.**
- [ ] **Multi-item screenshots pick one silently.** The scanner is instructed to list each on its own line; the save flow takes the first and drops the rest. **Ujjawal: "it happens, we need to resolve this."**
- [ ] **"Share what you love" has no completion path.** The tagline promises it, the button exists, no route from *loved* to *shared*. Lands in Priority 3.
- [ ] Candidate/picker thumbnails still render `alt={title}` unguarded — low risk (fresh URLs), noted not skipped.

---

## Housekeeping

- [ ] Delete dead `components/features/navigation/app-shell.tsx`
- [ ] Remove redundant `maxWidth: 430px` inside `AppFrame` (dashboard, category, edit, detail)
- [ ] Double bottom padding — ~200px dead space on dashboard and category list
- [ ] 12 anonymous users accumulating; cleanup job never built (needs service-role decision)
- [ ] Health check watches Groq models but **not the database** — would have caught the 2-week pause that killed the CV link
- [ ] Capture sheet: large empty void; TYPE icon lighter than SPEAK and SCAN (T1)
- [ ] Profile "N saves waiting for your verdict" links to `/dashboard`, which cannot show them
- [ ] `scripts/matching.golden.ts` has not been run once this session
- [ ] Four cards carry source name "Someone" — cleanup `UPDATE` drafted
- [ ] Remove dead `FOURSQUARE_API_KEY` from Vercel
- [ ] `02_-_API_SPEC.md` significantly stale — references a `/api/parse` route that does not exist

---

## Deferred

- Wrapped · People Layer · Taareef for Two · public lists · Stripe paywall · browser extension · Discovery Mode
- URL parse · Web Share Target · ShazamKit · PWA install · imports
- Motion direction (awaiting Ujjawal's reference exploration)
- Illustration motion (blocked on the above)
