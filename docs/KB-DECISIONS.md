# KB-DECISIONS.md — Taareef
> Append-only. Every product and technical decision made.
> Reference before re-opening any question.
> Last updated: Session 16 — 2026-08-10 — one factual correction below (region), plus two entries updated to reflect Session 14's verified findings. Everything else in this file is unchanged and was not re-verified line-by-line this session — see KB-SESSION_LOG.md Session 14 entry for what was and wasn't checked.

---

## Locked Product Decisions — Never Revisit

| Decision | Rationale | Date |
|---|---|---|
| No public profiles | Ever | 2026-05-11 |
| No algorithmic recommendations | Ever | 2026-05-11 |
| No ratings system — reaction only, post-experience | 4 options: loved/good/okay/skip | 2026-05-11 |
| No social feed | Ever | 2026-05-11 |
| Source always visible — every card, every view | Core product differentiator | 2026-05-13 |
| Reaction only after experiencing — never at save time | Reactions require experience | 2026-05-11 |
| Soft delete only | status='dismissed', never SQL DELETE | 2026-05-11 |
| People Layer = warmth, never percentage | No scores, no metrics on people | 2026-05-11 |
| "Tell source?" only on loved/good — never okay/skip | Socially awkward otherwise | 2026-05-11 |
| Source attribution is the core differentiator — never deprioritize it | Without it Taareef is just a list app | 2026-05-22 |
| No rating field — reaction replaces rating | A reaction after experience is more honest | 2026-05-29 |

---

## Category Decisions

| Decision | Rationale | Status |
|---|---|---|
| 6 categories: watch/listen/read/dine/do/visit | eat+drink→dine, see→visit, go removed | Locked — Session 8 |
| Supabase migration applied — old enums preserved, data migrated | Production DB updated 2026-05-29 | Locked |
| `do` category id stays `do` in code and DB | Changing it would break all existing rows | Locked — Session 10 |
| `do` user-facing label is "Experience" | The word the product uses; id and label are intentionally separate | Locked — Session 10 |
| `do` verb: "I experienced", verbPast: "experienced" | Matches the label | Locked — Session 10 |
| `do` emptyHeadline: "Things worth experiencing", emptyCta: "Save an experience" | Matches the label | Locked — Session 10 |
| Canonical subcategory vocabulary (Session 10) | watch: film/series/documentary · listen: album/podcast/audiobook/artist · read: fiction/non-fiction/poetry · dine: restaurant/café/bar/street food · do: hike/trail/adventure/workshop/live show · visit: museum/gallery/heritage/viewpoint/market | Locked — Session 10 |
| Old subcategories retired: song, manga, book (as subtype), exhibition, concert, play, ride, class, event | Replaced by canonical vocabulary above | Locked — Session 10 |
| VALID_SUBTYPES server validator aligned to canonical vocabulary | Ensures LLM outputs are accepted | Locked — Session 10 |
| Capture prompt VALID VALUES aligned to canonical vocabulary | Ensures LLM is told correct options | Locked — Session 10 |
| Nudge pills show canonical subcategory labels | All aligned across 3 layers | Locked — Session 10 |
| Status states are category-specific | watch: saved/experienced, read: saved/reading/finished/abandoned, do: saved/done | Locked — Session 8 |
| "Theatre" → "Play" for Visit | Superseded by Session 10 canonical vocabulary | Superseded |
| No "currently listening" state | Decided against in Session 8 | Locked |

---

## Design System Decisions

| Decision | Rationale | Status |
|---|---|---|
| 4-pillar design philosophy: Matte / Wong Kar-Wai / Indian Folk Art / Brutalism | Locked design language | Locked — Session 8 |
| Card design locked from taareef-decision-cards.html | Canonical HTML reference, never build from memory | Locked — Session 9/10 |
| Nuance fields must fill every form | Consistent information density | Locked — Session 9 |
| The costume problem: motifs must not literally depict subcategory subjects | No cameras for film, no televisions for series | Locked — Session 9 |
| Centered ornamental medallion (accessory) | Not an allover pattern — sits in the well as the accessory | Locked — Session 9 |
| CategoryMotif component: dangerouslySetInnerHTML, viewBox -100 -100 200 200 | Procedural SVG builders in TypeScript | Locked — Session 10 |
| Café clip-path id: unique per rgb to avoid SVG id collision | Multiple cards on one screen would collide otherwise | Locked — Session 10 |

---

## OTT / Platform Logo Decisions

| Decision | Rationale | Status |
|---|---|---|
| PlatformLogo component with inline brand SVGs | No external files, renders immediately, never broken | Locked — Session 10 |
| Inline SVGs are faithful best-effort, not pixel-exact official marks | Exact official marks should come from real brand kits dropped into /public/logos/ | Locked — Session 10 |
| Generic streaming glyph for unknown platforms | Intentional, never empty-looking | Locked — Session 10 |
| Platform read from metadata.streaming_platforms[0] | The actual enrichment field written by the Watchmode route | Locked — Session 10 |

---

## Screen Decisions

| Decision | Rationale | Status |
|---|---|---|
| Back navigation = full-width neon pill everywhere | Profile, category list, detail, edit — consistent | Locked — Session 8 |
| Detail screen: fixed card top, scrollable interaction layer | Card always visible as you react and note | Locked — Session 8 |
| Interaction zone order: experienced button → Zone A → Zone B → Zone C | Experienced unlocks everything below | Locked — Session 8 |
| Mark as experienced = category-specific verb | "Mark as watched / listened to / read / visited / experienced" | Locked — Session 8/10 |
| Reactions = text pills | Rajdhani 700, category color when selected | Locked — Session 8 |
| Dashboard tile grid: flex:1, gridTemplateRows repeat(3,1fr) | Tiles fill full screen height | Locked — Session 8 |
| Profile avatar: neon initial (#0d1810 bg) | No Google color dependency | Locked — Session 8 |

---

## Architecture Decisions

| Decision | Rationale | Status |
|---|---|---|
| Next.js 14 App Router | Locked stack | Locked |
| Supabase for DB + Auth (ap-south-1 / Mumbai region — corrected Session 14, was misrecorded as Singapore) | Locked stack | Locked |
| Vercel deployment | Locked stack | Locked |
| TypeScript strict mode | Non-negotiable | Locked |
| No local dev environment | Ujjawal works via GitHub web + Vercel | Locked |
| RLS on all tables — service role key server-only | Security | Locked |
| getUser() not getSession() | Server-side auth verification | Locked |
| All Supabase updates include .eq('user_id', user.id) | RLS silent failure without it | Locked |
| Promise.all for all multi-query server components | Eliminates sequential waterfall | Locked |
| Optimistic UI on all save operations | Card appears immediately | Locked |
| npx tsc --noEmit before every file delivery | Zero build errors in production | Locked |
| Clone repo in container, read all files, edit, check, deliver | No unverified code | Locked |

---

## Capture Decisions

| Decision | Rationale | Status |
|---|---|---|
| Audio: Groq Whisper (whisper-large-v3-turbo) | Free, production quality | Locked |
| LLM (capture extraction): Groq (llama-3.3-70b-versatile) | Same API key | Locked |
| OCR: Groq Vision (llama-4-scout-17b-16e-instruct) | Same GROQ_API_KEY | Locked |
| Confirmation step always required | Never auto-save | Locked |
| VALID_SUBTYPES validator: canonical vocabulary | Accepts canonical + aliases for legacy rows | Locked — Session 10 |
| Prompt VALID VALUES: canonical vocabulary | LLM told correct options | Locked — Session 10 |
| `location_hint` extraction strips relational phrases, keeps only neighbourhood/city | "near Carter Road, Bandra" → "Bandra" — cleaner input for downstream Places search | Locked — Session 13 |

---

## Enrichment Decisions

| Decision | Rationale | Status |
|---|---|---|
| TMDB for watch category | Free for non-commercial | Locked |
| Spotify Client Credentials for listen | No user login needed | Locked |
| Store top 3 TMDB candidates in metadata.tmdb_candidates | User has final say on poster | Locked |
| Watchmode for streaming platforms (IN region) | Writes to metadata.streaming_platforms | Locked |
| Google Books for read category | Auto-confirm at ≥88% confidence | Locked |
| Enrichment is fire-and-forget — never blocks save | triggerEnrichment() in hook / waitUntil in save route | Locked |
| Cast field: verified — enrichment writes metadata.cast as an array | Confirmed working (superseded "pending verification" from Session 10) | Locked |
| **Foursquare fully replaced by Google Places API (New)** | Foursquare v3 deprecated May 15 2026, returned 410 on every call | Locked — Session 13 |
| Google Cloud project `taareef`, India billing tier | 35,000 free calls/month per SKU (Text Search Pro India + Place Details Photos India) — not the 5K global tier | Locked — Session 13 |
| Self-imposed monthly ceiling: 1,000 calls, tracked in Supabase `api_usage` table | Hard firewall below Google's own 35K free tier; auto-resets at month boundary; graceful skip (not error) when hit | Locked — Session 13 |
| Google Cloud daily quota caps: SearchTextRequest & GetPhotoMediaRequest = 1,000/day each | Belt-and-braces alongside the Supabase counter; requires full (non-trial) Google Cloud account to edit | Locked — Session 13 |
| LLM disambiguation model: llama-3.1-8b-instant (not 70B) | Disambiguation is constrained classification, not reasoning — 8B is ~5x faster, same accuracy for this task | Locked — Session 13 |
| Post-save enrichment delay: 300ms (was 800ms) | Enrich route re-reads the row itself; 800ms was unnecessarily conservative | Locked — Session 13 |
| Zomato API investigated and ruled out as a photo source | Public developer access effectively frozen since ~2020 for new keys; content license explicitly prohibits derivative/comingled use a private vault would require | Decided — Session 13, not revisited unless Zomato's policy changes |

---

### The Five(+)-Layer Place Disambiguation Architecture (Session 13)

Built after the recurring "Gokul Bar shows Bademiya's photo" bug survived three separate fix attempts (query construction, index mismatch, name filter) — each guess was wrong because there was no diagnostic evidence. The real fix required instrumenting the function, reading actual Vercel logs, and reasoning from evidence. The methodology is as important as the result — see the RCA Methodology section below.

| Layer | Job | Key file |
|---|---|---|
| 1. Clean query + structured type filter | `"{title} {locationHint}"` as free text; category passed as Google's `includedType` param, never injected into the query string | `enrichPlaces` in enrich route |
| 1b. Two-pass search | Pass 1 with `includedType` (precision); if zero results, pass 2 without it (recall) — theme parks are `amusement_park` not `tourist_attraction`; bars are `bar` not `restaurant` | same |
| 2. Plausibility pre-filter | "Is this candidate plausibly related?" — loose word-overlap test with noise words (bar/restaurant/cafe/the/and) removed. Catches Bademiya before the LLM ever sees it | `lib/places/matching.ts` → `hasNameOverlap` |
| 3. Structured locality extraction | Reads Google's labelled `addressComponents` (sublocality_level_1 → locality), never parses the formatted address string — no more "Maharashtra 400001" leaking into cards | `lib/places/matching.ts` → `extractLocality` |
| 4. Parallel photo fetch + LLM | Photos for all surviving candidates fetch simultaneously with the LLM call — zero added latency for the common case | `enrichPlaces` |
| 5. Rejection-first LLM prompt | Asks "does any candidate match?" not "which is best?" — NAME is rule 1, explicit examples, temp 0, 5s timeout → string-similarity fallback | `enrichPlaces` |
| 5a. Strict exactness (hard rule, LLM cannot override) | "Is this the SAME place?" — every significant word of the user's title must be accounted for in the venue NAME or, as of Session 13's calibration release, an exact token in the venue ADDRESS. Different word set than Layer 2's plausibility test on purpose: 'bar' is noise for "related?" but significant for "same place?" | `lib/places/matching.ts` → `isStrictExact` |
| 5b. Geographic consistency (hard rule) | If a location hint was given, it must appear anywhere in the WHOLE address (every component + formatted string) — not just the finest-grained locality. Widened in Session 13 after the Gateway of India false-negative | `lib/places/matching.ts` → `hintMatchesAddress` |

**match_type outcomes:** exact/likely → auto-confirm (writes venue_name, address, locality, cuisine, photo, place_photo_refs). possible → candidate strip (all candidates stored with their own photo_refs). none → place_no_results + "add a photo" nudge.

### Named Bugs — Permanent Reference (each is now a golden test case)

| Case | What went wrong | Root cause | Fix |
|---|---|---|---|
| **Gokul Bar → Bademiya's photo** | Wrong venue's photo silently confirmed | THREE compounding bugs (pre-five-layer): malformed query ("in restaurant in"), an index-mismatch between filtered/unfiltered candidate arrays, and no name-exactness gate at all | Full five-layer rebuild |
| **Gokul Bar → Gokul Bite's photo** | A *different but genuinely similar-named* restaurant confirmed as exact | Plausibility filter correctly kept "Gokul Bite" (shares "Gokul"); LLM called it "exact" because names are genuinely close; no rule existed to distinguish plausible-but-different from actually-same | Layer 5a strict exactness: "Bite" is not accounted for by "Bar" → forced demotion to 'possible', regardless of LLM confidence |
| **Gateway of India → forced to confirm every time** | A correct, unambiguous match kept getting demoted | Geo rule compared the hint ("Mumbai") only against the *finest-grained* locality ("Apollo Bandar") — never matched | Widened Layer 5b to test the hint against the whole address |
| **Imagicaa World Khopoli → nothing at all** | Zero results, total silence | `includedType: tourist_attraction` excluded it — Google's actual primary type is `amusement_park` | Two-pass search: retry without the type filter when the filtered pass returns empty |

### The RCA Methodology (how the Gokul Bite bug was actually found — Session 13)

1. Three sequential guesses were made and each was wrong (query fix, index fix, filter-logic fix) — because none were backed by evidence, only plausible reasoning.
2. The turn was made explicit: stop fixing, start instrumenting. Added structured `console.log` at five decision points (query sent, raw Google results, post-filter survivors, LLM's raw JSON, final decision with venue_name/photo_from/photo_host compared side by side).
3. One test save produced the actual evidence: Google returned exactly one result, "Gokul Bite" — not Bademiya, not an index bug, not a query bug. Every layer had behaved *correctly given that input*. The LLM's "exact" call for a genuinely-similar-but-different name was the real gap.
4. **Lesson, made a standing practice:** when a bug survives two fix attempts, stop guessing a third time — instrument the exact decision points, get one piece of real evidence, then fix from that evidence. Default response to any recurring/mysterious bug in this codebase going forward.

### Photo Picker Architecture (Session 13, Builds 1–3)

| Decision | Rationale | Status |
|---|---|---|
| Photo refs stored as Google *resource names*, not resolved URLs, at enrich time | Refs are free — already in the Text Search response we pay for once. Resolving to an image is the billable step; storing refs defers that cost until a human actually wants to see options | Locked |
| Top 3 photo refs stored per confirmed venue AND per each candidate in the strip | Zero extra search calls (Google returns up to 10 photos per place in one response) | Locked |
| `PlacePhotoPicker` is one reusable "dumb" component — displays + reports via `onSelect`; parent owns persistence | Same component drops into detail screen, edit screen, (and save flow, if ever built) without modification | Locked |
| `onUpload` prop is optional on the picker | Edit screen has no upload machinery (that lives on detail) — keeps the component from dragging upload plumbing everywhere it's used | Locked — Session 13 |
| New `/api/places/photo` route resolves refs → URLs, lazily, only when a picker opens | Cost follows curiosity — a user who never opens the picker spends only the one auto-pick photo call | Locked |
| Photo route is auth-guarded and respects the shared monthly ceiling | It's a billable endpoint; never left open | Locked |
| Save-flow picker (Build 3b) — deliberately NOT built | Photo refs don't exist until ~2-4s after save (enrichment is async); a save-flow picker would require holding the save sheet open and polling, trading directly against the "max 8s, 2 taps" save principle. The picker one tap away on detail/edit IS "choose later" | Decided, not built — see Backlog |
| Selection via strip-confirm now correctly passes `photo_refs` through | Found and fixed in Session 13: Build 1 added refs to every candidate; the confirm handler was never updated to copy them onto the card — a producer/consumer vocabulary-sweep miss, same failure family as the existing "vocabulary alignment" lesson | Locked |
| `router.refresh()` called after any photo-selection PATCH (detail + edit) | Next.js App Router caches server-rendered segments client-side; without this, navigating back showed the OLD photo even though the DB already had the new one — data was right, display was stale | Locked |
| `PATCH /api/recommendations/[id]` now persists `image_url` | Found while verifying the picker's persistence path: this field was silently dropped by the route since it was written. The candidate strip's confirmed photo has never survived a refresh until this fix | Locked — critical latent bug, now closed |

### Matching Module + Golden Tests (Session 13)

| Decision | Rationale | Status |
|---|---|---|
| All pure matching logic extracted to `lib/places/matching.ts` | Testable in isolation, no I/O, no framework dependency | Locked |
| `scripts/matching.golden.ts` encodes every real-world case debugged this session (16 checks: Gokul/Bademiya/Gokul Bite, Leopold, Dishoom, Old Street, Gateway, Imagicaa) | Run before touching any matching dial: `npx tsx scripts/matching.golden.ts`. This is the project's first regression-eval suite | Locked — standing practice |
| Golden suite must pass before any delivery that touches `lib/places/matching.ts` | Prevents re-breaking a named bug while fixing a new one (nearly happened: the first proposed "singleton rule" would have re-broken Gokul Bite — caught by reasoning through the golden cases before writing code) | Locked — standing practice |

### Code Cleanup Decisions (Session 13, "Part B")

| Decision | Rationale | Status |
|---|---|---|
| `foursquare_confirmed` renamed `place_confirmed` everywhere | We use Google Places, not Foursquare — the field name was semantically wrong | Locked |
| Enrich route functions take `Recommendation`, not `Record<string,unknown>` | Type mismatches now fail at build time instead of runtime | Locked |
| `RecMetadata` casts used in card/list render components, not `Record<string,unknown>` | Type enforcement extends to the render layer, not just derive.ts | Locked |
| Dead fields removed from RecMetadata: `foursquare_id`, `release_year_listen` | Written or declared but never read anywhere | Locked |
| `app/api/feedback/route.ts` now requires auth (`getUser()`, 401 if absent) | Was a fully open Resend relay — anyone could trigger emails to the founder inbox | Locked |
| Diagnostic console.logs reduced in enrich route (kept only the 5 RCA decision points + real errors) | Reduce production noise while preserving the evidence trail that solves future bugs | Locked |

### Cost Model (confirmed Session 13; re-checked Session 14)

- Google Places (India billing): Text Search Pro — free to 35,000/month, then ≈₹919/1K. Place Details Photos — free to 35,000/month, then ≈₹488/1K.
- **Session 14 caveat:** these India-specific rupee figures could not be independently re-verified from public sources this session. What WAS confirmed directly against Google's own current global price list (fetched live, dated 2026-07-15 UTC): Places API Place Details Photos is a flat **$7.00 per 1,000 requests** (USD, global, 0–100K tier), and Places API Text Search Pro is **$32.00 per 1,000** — both billed per request regardless of the resolution or fields requested within that SKU tier. If the India-specific 35,000-free-per-month figure and rupee rates above still hold, they're a materially better deal than global pricing (consistent with Google's published "up to 70% lower" India discount) — but confirm directly against the GCP billing console for this specific project before relying on the exact numbers for planning.
- Roughly 2 Google calls per confirmed Dine/Visit/Do save (1 search + 1 auto-pick photo); the self-imposed 1,000/month ceiling is the actual operative limit, not Google's free tier.
- **Picker resolution (400px vs 800px) does not change call count or cost** — Photos is billed per request, not per byte or resolution. It only affects bandwidth and perceived latency. Confirmed Session 14.

---

## Parked / Backlog Decisions

| Decision | Status |
|---|---|
| Grid card variant rebuild to locked design | Pending — long-standing. Ujjawal wants broader card-rendering discussion, marked priority 3 — Session 14 |
| Compact card variant rebuild to locked design | Pending — long-standing, same discussion as above |
| Onboarding flow (4 screens) | **Corrected Session 14 — mostly built, not "not started."** Real gaps: Screen 4 tooltip, third example card, theme/copy reconciliation against ONBOARDING_SPEC.md. See ONBOARDING_SPEC.md header note. |
| Subtype casing normalization (was: "old subtype data migration, song → album etc.") | **Corrected Session 14.** The originally proposed migration targeted values that don't exist in production. The real, verified issue is casing inconsistency (`"Film"` vs `"film"`, etc.) affecting 5 known rows. New migration drafted, pending Ujjawal's go-ahead to commit and run — see BACKLOG.md and `supabase/migrations/003_subtype_casing_fix.sql`. |
| Usage-pattern dashboard (was: "weekly log glance") | New scope, Session 14 — Ujjawal wants a real internal dashboard over enrichment-outcome logs, potentially informing future threshold tuning. Agreed as its own dedicated discussion, not a quick add. |
| Official OTT logo SVG files in /public/logos/ | Can be added anytime — inline fallbacks are fine |
| Horizontal depth stack (card stacking) | V2 |
| Apple Sign In | Before iOS distribution |
| Web Share Target | V2 |
| URL parse | V2 |
| Multi-source stacking | V2 |
| People Layer | V3 |
| Taareef Wrapped | V3 — gated at 50+ saves |
| Stripe paywall | V3 — gated at 200 saves |
| Taareef for Two | V3 |
| Public lists | V3 |
| Category ambiguity resolution (waterfall = visit or do?) | Proposed, awaiting go-ahead — Session 13. See BACKLOG.md for full approach. |
| Home-city default in user profile | V2 candidate — Session 13. Other proposed fields (price sensitivity, neighbourhood, dietary, language) rejected by Ujjawal, Session 14 — they fail the "single definite fact, stable, no real 'I don't know'" test that home-city passes. Travel/"currently away" toggle is being ideated further as a home-city companion — see BACKLOG.md V2 section. |
| Picker thumbnails at 400px instead of 800px | Small follow-up — Session 13 |
| Save-flow photo picker with "choose later" | Explicitly deferred, not forgotten — Session 13, see Photo Picker Architecture above |
| Beta-readiness test pass (10 people) | Checklist agreed, not yet executed — Session 13, see BACKLOG.md |


---

# Sessions 15 & 16 — 2026-07-27 to 2026-08-10

## Architecture

| Decision | Reasoning |
|---|---|
| All Groq model IDs live in `lib/constants/models.ts` | A model ID buried in a route file caused a nine-day silent outage. Migration is now a one-file edit. |
| Prefer production-tier models over preview | `llama-4-scout` was a preview model, which Groq documents as discontinuable at short notice. Production capture should never run on preview. |
| Token budgets must include reasoning headroom | GPT-OSS spends reasoning tokens from the same `max_tokens` pool as the answer. A budget sized for the answer starves the answer. |
| Groq's native JSON mode over parsing prose | Both prompts already say "JSON", which the mode requires. |
| Log `finish_reason` on every LLM parse failure | Distinguishes "budget exhausted" (config problem) from "bad input" (user problem). |
| Anonymous Supabase sessions, created on **first save tap**, not page load | Someone who only browses the demo never becomes a user. Keeps abandoned accounts and MAU down for free. |
| **Row transfer**, not `linkIdentity` | Linking never succeeded once — a redirect flow whose errors cannot be caught client-side, and structurally impossible when the Google account already has a vault. Transfer removes the conflict case: same code path, both outcomes correct. |
| `security definer` function over `SUPABASE_SERVICE_ROLE_KEY` | A narrow function with six explicit guards is a far smaller grant of power than a key that bypasses RLS everywhere. Residual risk stated and accepted: knowing an anonymous UUID within 2 hours could claim up to 3 demo cards. |
| `AppProviders` in the layout, `AppFrame` separate, nav decided by route | A layout survives navigation; a page does not. Enrichment outlives the screen a save started on. Nav presence is a property of the route, so the frame's padding can never disagree with whether a nav exists. |
| **An external URL is a loan, not an asset** | Google Places photo URLs are signed and expire. For a product whose promise is *keeping* things, borrowed artwork undermines the premise. Direction: mirror, don't hotlink. |
| Onboarding routes get `force-dynamic` | Supabase warns Next.js static rendering can cache user metadata across anonymous users. A guard rail, not a live fix — the pages are client components today. |

## Product

| Decision | Reasoning |
|---|---|
| Headline: **"Your recommendation journal."** | Makes the Journal Test — the filter behind every product decision — the public promise. "Collected and enriched" described the pipeline, not the experience. |
| Privacy line: **"Private by default. Trust works both ways."** | Placed on the sign-in screen, not the landing page. Reassurance before anxiety exists is marketing; at the moment of anxiety it is an answer. Said **once**. |
| Screen 3 (category preference) **deleted** | Collected preferences nothing consumed, nothing linked to it, and it sat between "I saved something" and "there it is". The first save already reveals the category — a stronger signal than a stated one. |
| Voice **signposted** in the demo, not enabled | A microphone permission prompt forty seconds into knowing a product, plus open transcription for anonymous strangers. "Needs an account" is honest and costs nothing. |
| Experienced cards get **a folder, not different styling** | One axis, not two. A second visual state on every card would compete with the save/experienced distinction that already is the product. Lean over clever. |
| Deletion becomes **archive**, in the profile section | Dismissal currently vanishes with no view, no undo, no trace — presented as gentle, behaving as permanent. |
| Enrichment tells the truth in **three confidence bands** — sure / fairly sure / not sure | Showing "not it?" on every save expresses doubt a hundred times to catch ten errors, teaching distrust of something usually right. Silence is the confidence. |
| Ambiguity resolved **at save time**, not on the detail screen | Four seconds after typing, the person knows which Dune they meant. Four days later they are guessing at their own intention. |
| The save peek shows **the real card, cropped to the artwork well** | The well is where enrichment is visible; the cropped part is the part that does not change. A full card takes 60% of the screen — delightful once, intolerable by Thursday. |
| Multiple saves **replace** rather than queue | Watching a backlog of your own cards is worse than missing one. |
| Source normalisation **suggests, never auto-merges** | Silently merging two genuinely different Ahmeds is unrecoverable and breaks the vault's trustworthiness. The display name is never rewritten. |
| Analytics live in Supabase, not a vendor | Storage measured at 2% of the free tier. Zero new dependencies, RLS already understood. |
| Log **stage transitions**, not just outcomes | Extraction failing and extraction succeeding-but-rejected are opposite problems that look identical in an error count. |
| The **unopened/opened card idea was dropped** | The vault already has a primary axis (experienced or not). A second state would be read as "I haven't watched this" rather than "the poster arrived" — and border, text colour and motif are all already carrying meaning. |
| Empty source means empty | The demo wrote `"Someone"` as a fallback, polluting real data and skewing "most trusted source". Inventing a name to fill a gap undermines the product's core claim. |

## Corrections to earlier records

| Was recorded as | Actually true |
|---|---|
| Onboarding "not started" | Screens 0, 1+2, 3 were built and shipped |
| Plus Jakarta Sans still imported | Removed; the flag had been open two sessions for nothing |
| `recommendation-card.tsx` has a `full` variant | It does not — the detail card is its own `full-card.tsx` |
| Supabase region is Singapore | `ap-south-1`, Mumbai |
| The "legacy subtype" migration was needed | None of its target values existed in production. The real issue was casing. |
| Missing example images "render as motifs" | They render the browser's broken-image state and print the alt text |
| Experienced cards' vow line never finishes | It does — `vowText = isExp ? cfg.participle : 'to ' + cfg.infinitive` |
| The profile verdict row does nothing | It is a working link to `/dashboard`, which cannot show unreacted saves — a design gap, not a broken element |
| `AppShell` could not move to the layout | It could, once separated into frame and nav — and the frame chrome had drifted across four screens |
