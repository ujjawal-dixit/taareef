# KB-CLAUDE.md — Taareef Project Root
> Read at the start of every session. Single source of truth.
> Last updated: Session 16 — 2026-08-10 — see Sessions 15 and 16 in KB-SESSION_LOG.md

---

## Read this first — Session 16

**Start every session by querying the vault, before opening the backlog:**

```sql
SELECT status, count(*), max(created_at) FROM recommendations GROUP BY status;
```

On 2026-08-10 that query returned: 19 saved, 3 experienced, **nothing marked experienced in over two months.** The core loop has not completed once since early June.

The V1 north-star ("does the builder save ≥3 things in week 1?") has been answered for months. The unanswered question is whether the vault is ever *used*. The product is excellent at intake and has no digestive system — every workflow is built to the moment of success and abandoned at the edges.

**The metric that matters now is whether "2 months ago" changes.** Weigh every proposed piece of work against it.

The three largest gaps, all on the back half: **there is no search**; **source attribution is stored, displayed and not navigable**; **completion changes a field and produces no destination.** See BACKLOG.md.

---

## About Taareef

Taareef (تعریف — Urdu/Hindi for "praise" and "recommendation") is a private, personal vault for capturing recommendations received from people you trust. Core insight: recommendations decay — they get lost in screenshots, DMs, saved posts. Taareef centralises them with the source always visible. That source attribution is the product's core differentiator — not the categories, not the capture methods, not the reactions.

**Ujjawal builds without a local dev environment.** Claude writes all code. Ujjawal directs, reviews, and commits via GitHub web interface → Vercel auto-deploys.

**Note, Session 14:** a stale `CLAUDE.md` file also exists in the repo root itself (not this Project Knowledge file). It describes the original 10-category system and an outdated project structure. It is historical only — this file, in Project Knowledge, is the current source of truth. Consider deleting or clearly flagging the repo-root copy so a future session doesn't read it first by mistake.

---

## Working Agreement (Non-Negotiable)

- **Discuss and confirm before building.** No code written without explicit confirmation.
- **Deliver complete files only.** No snippets, no diffs, no partial fixes.
- **Verify against the live repo/DB before trusting a KB claim.** (Added Session 14 — see below.)
- **Clone repo fresh before editing.** Read all relevant files before touching anything.
- **Run `npx tsc --noEmit` to zero errors before delivery.**
- **Deliver via `present_files`.** Ujjawal commits via GitHub web interface; Vercel auto-deploys.
- **Every response ends with:** What changed · What is next · Insight.
- **Insight is mandatory** — technical-PM-rich, in simple language: what changed, why it matters, how to test (specific, step-by-step, correct-vs-broken state), what to watch for. Never skipped. (Reinforced as an explicit standing tenet — Session 13.)
- **Keep responses structured, minimal, and precise.** No walls of options. One recommendation, show it.
- **Obtain visual references before any new component work.** Derive complete design system, build once correctly.
- **The costume problem:** Folk-art motifs must not literally depict their subcategory subjects. Each tradition has its own authentic grammar. Study it first.
- **If a bug survives two fix attempts, stop guessing a third time.** Instrument the exact decision points with structured logging, get one piece of real evidence from a live test, diagnose from that evidence. (Session 13 — see Debugging Protocol addendum below.)
- **When adding a field to any stored shape, grep every consumer of that shape in the same delivery.** Producer and consumer ship together, always. (Session 13.)

---

## Source-of-Truth Tenet — CORRECTED Session 14

**Previously believed:** GitHub access was read-limited; Claude couldn't clone or read files live, and had to ask Ujjawal to paste anything it needed to verify.

**Actually true, confirmed Session 14:** Claude's bash tool CAN `git clone` and read github.com/ujjawal-dixit/taareef live, and CAN query the live Supabase database directly. This was tested and works. Going forward, this is the default way to verify any claim in these KB files before trusting it — not an exception reserved for special occasions. Still never invent file contents that haven't actually been read — read live, or ask Ujjawal to paste, never guess.

---

## Locked Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js App Router | 14 |
| Database + Auth | Supabase | Latest (**ap-south-1 / Mumbai region — corrected Session 14, was previously misrecorded as Singapore**) |
| Deployment | Vercel | Latest |
| Language | TypeScript | Strict mode |
| Styling | Tailwind + inline styles | Latest |
| Audio transcription | Groq Whisper (whisper-large-v3-turbo) | — |
| OCR/Vision | Groq Vision (llama-4-scout-17b-16e-instruct) | — |
| LLM extraction (capture) | Groq (llama-3.3-70b-versatile) | — |
| LLM disambiguation (places) | Groq (llama-3.1-8b-instant) | — Session 13, swapped from 70B for speed |
| Film/TV enrichment | TMDB API | v3 |
| Music enrichment | Spotify Client Credentials | — |
| Book enrichment | Google Books API | — |
| Place enrichment (dine/visit/do) | Google Places API (New) | — Session 13, replaces Foursquare (dead, deprecated May 15 2026) |

---

## 6 Categories — LOCKED

`watch` · `listen` · `read` · `dine` · `do` · `visit`

The internal code id `do` stays `do` in the database and URLs. The user-facing label is **Experience**. This split is intentional and must not be collapsed — changing the id would require a Supabase migration and break all existing rows.

**Confirmed live, Session 14:** `lib/types/index.ts` defines exactly these 6 values, and a direct query of production data confirms every row uses only these 6 — no drift. The Postgres `category` enum itself carries 14 additional dead values from earlier schema generations (see Database section in KB-FILEMAP.md) — harmless clutter, not a live bug.

---

## Folk-Art Motif System (Session 10, unchanged since)

24 medallions across 6 Indian folk traditions, one per category:

| Category | Tradition | Color | Subcategory medallions |
|---|---|---|---|
| watch | Warli | cobalt 60,130,255 | film · series · documentary |
| listen | Gond | rose 220,60,130 | album · podcast · audiobook · artist |
| read | Madhubani | amber 240,145,20 | fiction · non-fiction · poetry |
| dine | Block-print (Jaipur) | burnt orange 218,85,38 | restaurant · café · bar · street food |
| do | Saora | teal 16,195,182 | hike · trail · adventure · workshop · live show |
| visit | Kalamkari | sky 25,145,225 | museum · gallery · heritage · viewpoint · market |

**The costume problem (locked principle):** motifs represent the category's folk tradition and soul; the subcategory is named in the card's text, never forced into the art. Each tradition has its own authentic grammar — Warli's triangle-torso figures, Gond's dense rhythmic infill (sparse Gond is wrong Gond), Madhubani's double-lined bold forms and Kachni fine line-work, Block-print's buti/buta/kairi/bel/jaal vocabulary, Saora's fishnet-build with border-first construction, Kalamkari's fine pen line-work and architectural registers.

**Component:** `components/features/cards/category-motif.tsx` — `CategoryMotif({ category, rgb, subtype, size })`. `dangerouslySetInnerHTML`, registry maps canonical + legacy aliases, per-category `default` fallback always renders. viewBox `-100 -100 200 200`, centered via `translate(-50%, -52%)`. Café clip-path id unique per-render (prevents SVG id collision across multiple cards on one screen).

---

## Screen Architecture — Current State

### Screen 01: Dashboard (category-list-client.tsx)
- `do` category label shows as "Experience"
- 6-tile 2×3 mosaic, fills full viewport height

### Screen 02: Category List (category-list-client.tsx)
- Filter pills: canonical subcategory labels
- Matching is case-insensitive on `meta.subtype` — **caveat added Session 14: this only helps at filter-match time; the underlying stored casing is still inconsistent for 5 known rows, see BACKLOG.md**
- Nudge filter now casts `metadata` to `RecMetadata`, not `Record<string,unknown>` (Session 13)

### Application shell — restructured Session 15

`AppShell` used to render *inside* each page, so Next.js destroyed it on every navigation. Since enrichment takes 5–20 seconds and people rarely stay on one screen that long, nothing could watch a save through to completion.

Now:

```
app/(app)/layout.tsx          server component, mounts once
  └── AppProviders            client
        ├── ToastProvider     survives navigation
        ├── SaveProvider      capture sheet, the save request, inFlight tracking
        └── AppFrame          the centred column; nav decided by route
              └── children    the page — swaps as you navigate
```

`AppFrame` also fixed a real bug: the centred-column chrome had been written four separate times and drifted, leaving the card detail screen with no width cap at all.

**`inFlight` exists and nothing consumes it yet.** It tracks each save from request through enrichment, and is the foundation for the save peek (BACKLOG Priority 6).

`components/features/navigation/app-shell.tsx` is now dead — delete it.

### Screen 03: Card Detail (rec-detail-client.tsx)
- Renders the exact locked card design (taareef-decision-cards.html) via its own **`full-card.tsx` component — corrected Session 14, see below**
- `cardRef` on the object div for share/export capture
- Live metadata state: `liveImageUrl`, `liveMeta` (typed `RecMetadata` as of Session 13)
- OTT logo from `liveMeta.streaming_platforms[0]`
- Cast line from `liveMeta.cast`
- Vow text from `cfg.verb` / `cfg.verbPast`
- **Session 13 additions:** place candidate strip ("Is this the right place?"), zero-result nudge ("we couldn't find this — add a photo?"), `PlacePhotoPicker` wired in below the card, a 2.5s re-fetch effect so fresh place-card enrichment "arrives while you watch," `router.refresh()` called after any photo-selection PATCH (Next.js caches server segments client-side — without this, navigating back showed stale photos even though the DB was already correct)

### Screen 04: Edit (rec-edit-client.tsx)
- **Session 13 addition:** `PlacePhotoPicker` wired in under a "Card photo" label for dine/visit/do cards with stored photo refs. Selection persists immediately, independent of "Save changes" — same mental model as detail screen. `router.refresh()` added here too.

### Card components — CORRECTED Session 14

Read directly from the repo this session. The prior description below (three variants of one component) was wrong:

- **`components/features/cards/full-card.tsx`** — the exact locked design, its own dedicated file. This is what the detail screen actually renders.
- **`components/features/cards/recommendation-card.tsx`** — its `variant` prop type is `'compact' | 'grid'` only. There is no `'full'` option here. Grid and compact are still the old layout, pending rebuild (unchanged status since Session 10, marked priority 3 by Ujjawal, Session 14).
- `RecMetadata` cast used throughout `recommendation-card.tsx` as of Session 13 (was unsafe `Record<string,unknown>`)

---

## Capture Pipeline — Current State

- `app/api/capture/understand/route.ts` — the intelligence layer
- `VALID_SUBTYPES` server validator uses canonical vocabulary (Session 10), confirmed still all-lowercase as of Session 14
- Prompt also uses canonical vocabulary (Session 10)
- *Midnight's Children* example: `subtype: "fiction"`
- **Session 13:** `location_hint` extraction improved — strips relational phrases and keeps only the neighbourhood/city ("near Carter Road, Bandra" → "Bandra"; "next to the mall in Andheri" → "Andheri")

---

## Places Enrichment Architecture (Session 13 — supersedes any Foursquare references anywhere in this KB)

**Provider:** Google Places API (New), India billing tier. Foursquare is fully retired; `FOURSQUARE_API_KEY` may still exist in Vercel but is unused — safe to remove whenever convenient.

**Entry point:** `enrichPlaces()` inside `app/api/enrich/[id]/route.ts`, triggered via `waitUntil` 300ms after a Dine/Visit/Do save (trimmed from 800ms — the route re-reads the row itself so the longer delay was unnecessary).

**Pure logic module:** `lib/places/matching.ts` — every matching/scoring/extraction function lives here. Never duplicate this logic inline; any new surface needing matching logic imports from this module.

**Five-layer disambiguation** (see KB-DECISIONS.md for full detail on each layer and the named bugs each one fixes).

**Photo picker:** Wired into detail + edit screens. NOT wired into the save flow (deliberate — see Decisions).

**Cost controls (three layers):**
1. Google Cloud daily quota cap: 1,000/day per SKU — hard stop, 429, zero charge
2. Supabase `api_usage` table (checked in `enrichPlaces` and `/api/places/photo`) — self-imposed 1,000/month ceiling, auto-resets at month boundary, skips gracefully when hit
3. Google's own free tier per SKU (see KB-DECISIONS.md Cost Model section — the India-specific rupee figures there could not be independently re-verified from public sources Session 14; recommend confirming against the GCP billing console directly. The global USD price list, confirmed live Session 14 from Google's own current pricing page: Places API Place Details Photos is a flat $7.00/1,000 requests regardless of resolution requested — resolution does not affect cost, only bandwidth/latency.)

**Diagnostic logging:** `enrichPlaces` retains `console.log('[enrichPlaces] ...')` at five decision points (query sent, raw results, post-filter survivors, LLM raw response, final decision). Intentionally kept — do not strip without discussing; this is how the Gokul Bite bug was actually solved after three wrong guesses, and how the next mysterious bug gets solved in one pass.

---

## Information Layer — Full Spec

### Two priority levels
**Stacked (scanning):** Only what helps decide whether to tap.
**Open (deciding):** Everything needed to act.

### Watch
Film: Year · Genre · Runtime → Director
Series: Ongoing/Completed · Platform · Seasons → Created by
Documentary: Year → Director · Subject

### Listen
Album: Artist · Year → Genre · Tracks
Podcast: Host → Category · Avg length · Specific episode
Audiobook: Author · read by [Narrator]
Artist: Genre → Active since · Known for

### Read
Fiction/Non-fiction/Poetry: Author · Year → Sub-genre (free text)
Sub-genre replaces publisher. Reading progress = thin visual bar (not a number).

### Dine
Restaurant/Café/Bar/Street food: Cuisine · Locality (from Google Places, Session 13) · What to order
`what_to_order` = dedicated metadata field, separate from note. Automatically extracted by capture.
`location_hint` = user-typed city/area at save time; used to disambiguate Google Places search and as a locality fallback if enrichment finds nothing.

### Do (Experience)
Hike/Trail: Location · Difficulty (Easy/Moderate/Hard/Expert) · Distance
Adventure/Workshop/Live show: Location → What it involves

### Visit
Urgency system (time-sensitive category):
- No dates: not shown
- >30 days: dim white
- ≤30 days: cerulean vivid 78%
- ≤7 days: cerulean 100% + filled dot
- Closed: strikethrough, grey 22%
Museum/Gallery/Heritage/Viewpoint/Market: Venue name (from Google Places) · Locality · Dates (urgency-conditional color)

---

## Architecture — Critical Rules

**Supabase:**
- Every update: `.eq('user_id', user.id)` — RLS requires it, silent failure without it
- `getUser()` not `getSession()` for server-side auth
- Server client in API routes and Server Components only
- **Confirmed Session 14:** `SUPABASE_SERVICE_ROLE_KEY` does not appear to be used anywhere in the actual code (a direct `grep` for `process.env.*` references found no match) — the app runs entirely on the anon key + RLS, including server-side. Worth confirming this is intentional next time it comes up; ENV_TEMPLATE.md updated to reflect this honestly rather than assert it's required.

**TypeScript:**
- `npx tsc --noEmit` MUST pass before any file is delivered
- No `any` — use `unknown` with type guards
- Category type = exactly 6 values
- `metadata` on every recommendation is `RecMetadata` (typed contract in `lib/types/index.ts`), never `Record<string,unknown>` — this is enforced at every layer that reads or writes it, including render components (Session 13 cleanup)

**Code delivery:**
- Clone repo: `git clone https://github.com/ujjawal-dixit/taareef.git`
- Read all relevant files before editing
- Type-check to zero errors
- Copy to `/mnt/user-data/outputs/`, `present_files`
- No unverified code in chat
- **Session 13 addition:** any delivery with two similarly-named files (e.g. detail vs edit client) gets explicit, unambiguous folder labels in the package, plus a one-line "export check" in the placement guide. A file-swap error during placement (edit component's code landing in the detail file's path) is what prompted this.

---

## Environment Variables — CORRECTED Session 14

Ground truth, from a direct `grep` of every `process.env.*` reference in the live repo:

| Variable | Purpose | Confirmed in code? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key | **Not found in any code reference — see note above** |
| `NEXT_PUBLIC_APP_URL` | Vercel deployment URL | Yes |
| `GROQ_API_KEY` | Audio + OCR + LLM extraction + place disambiguation | Yes — two surfaces (understand route, sync; enrichPlaces, async via waitUntil) |
| `TMDB_API_KEY` | Film/TV enrichment | Yes |
| `SPOTIFY_CLIENT_ID` | Music enrichment | Yes |
| `SPOTIFY_CLIENT_SECRET` | Music enrichment | Yes |
| `GOOGLE_BOOKS_API_KEY` | Book enrichment | Yes |
| `WATCHMODE_API_KEY` | Streaming platform lookup | Yes |
| `GOOGLE_PLACES_API_KEY` | Dine/Visit/Do enrichment | Yes — active, restricted to Places API (New) only |
| `FOURSQUARE_API_KEY` | — | Dead — no longer called anywhere. Safe to remove from Vercel whenever convenient. |
| `RESEND_API_KEY` | Feedback emails | Yes |
| `FOUNDER_EMAIL` | Feedback email destination | Yes |

See corrected ENV_TEMPLATE.md for the full per-variable documentation, matching this list exactly.

---

## What Is Working in Production (as of Session 14)

Everything from Session 13, plus, confirmed this session:
- Onboarding Screens 0, 1+2, 3 — built and shipped (not "not started" as previously recorded) ✓
- Plus Jakarta Sans removal — confirmed clean, closing the flag open since Session 10/12 ✓

## What Is NOT Done / Needs Next Session — CORRECTED Session 14

- **Grid card variant** — still old layout, not the locked design (unchanged since Session 10). Ujjawal marked this priority 3, wants broader discussion on card rendering generally — separate session.
- **Compact card variant** — same as above.
- **Onboarding Screen 4 tooltip** — genuine gap, confirmed absent from the entire `app/` tree.
- **Third seeded example card (Currents)** — genuine gap, confirmed only 2 of 3 cards exist.
- **Onboarding theme/copy reconciliation** — the shipped screens diverge from ONBOARDING_SPEC.md in theme and copy; needs an explicit decision before either side is "fixed." See ONBOARDING_SPEC.md header note.
- **Subtype casing fix** — real, verified data-quality issue (not the old "legacy value" migration, which targeted values that don't exist in production). See BACKLOG.md and the new migration file.
- **Category ambiguity resolution** (e.g. a waterfall could be Visit or Do) — approach proposed, Ujjawal wants a dedicated in-depth session before building. See BACKLOG.md.
- **Beta-readiness test pass** — full checklist agreed, not yet executed. Should run *after* onboarding gaps are closed, not before. See BACKLOG.md.
- **Save-flow photo picker (Build 3b)** — deliberately deferred, not a gap. See Decisions.
- **Usage-pattern dashboard** (Session 14) — Ujjawal wants a real internal dashboard reading enrichment-outcome logs, not just a manual weekly glance. Agreed as its own dedicated discussion.

---

## Photo lifetimes — know which kind you are holding

Three image sources with completely different lifespans, currently treated identically:

- **TMDB / Spotify / Google Books** — stable URLs, permanent
- **User uploads** — your own storage, permanent
- **Google Places** — **signed and expiring.** Verified Session 16: 6 cards already dead, 0 recoverable because `photo_ref` was never stored

The defect is storing the *answer* (a signed URL) and discarding the *question* (`photo_ref`). When the answer rots there is no way to ask again.

**Principle: an external URL is a loan, not an asset.** For a product whose promise is keeping things, borrowed artwork undermines the premise. Direction agreed: mirror, don't hotlink.

Every image render must guard with `onError` and fall back to the motif — and must report the failure **upward**, or the screen keeps believing a photo exists and hides the means to replace it.

---

## Standing Debugging Practice (addendum to Debugging Protocol, Session 13)

**If a bug survives two fix attempts, stop guessing a third time.** Instrument the exact decision points with structured logging, get one piece of real evidence from a live test, then diagnose from that evidence — not further plausible-cause reasoning. Learned expensively this session: three wrong guesses on the Gokul Bar/Bademiya bug (query fix, index fix, filter-logic fix — all plausible, all wrong) before the RCA turn produced the actual answer in one test save.

**Before shipping any change to shared matching/scoring logic, check it against every previously-named bug, not just the new one.** A "singleton rule" was proposed mid-session that would have quietly re-broken the Gokul Bite case while fixing Gateway of India — caught only by walking through the golden cases before writing code.

**When adding a field to any stored shape, grep every consumer of that shape in the same delivery.** The photo-picker regression ("build 1 worked, build 2/3 broke it") was exactly this: Build 1 added `photo_refs` to candidates (the producer), the pre-existing strip-confirm handler (the consumer) was never updated to copy them through. Same failure family as the existing "vocabulary alignment" lesson from Session 10 — extend that lesson to any field addition, not just renamed terms.

**Verify against the live repo/DB before trusting a KB claim, added Session 14.** An entire session's worth of stale claims (onboarding "not started," a resolved font-import flag left open, wrong region, a wrong bug diagnosis for the subtype data) would all have been caught in minutes by cloning the repo and querying the database directly, instead of trusting summaries across sessions.
