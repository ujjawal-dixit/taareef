# KB-FILEMAP.md — Taareef
> **Primary reader:** Claude Code.
> Complete file map. Update at the end of every session.
> Last updated: Session 19 — 2026-09-02 — corrected three rows that still
> described files deleted on 2026-08-13 (`onboarding/categories/page.tsx`,
> `navigation/app-shell.tsx`, `api/user/preferences/route.ts`). The Session 18
> "rebuilt from a fresh `git clone`" pass missed them.

---

## Screens

| Path | Purpose |
|---|---|
| `app/page.tsx` | Screen 0 — landing. Headline "Your recommendation journal.", `ShelfIllustration` (five category-coloured objects, rebuilt Session 15), fluid `clamp()` type, `dvh` spacing |
| `app/(onboarding)/layout.tsx` | **New Session 15.** Carries `export const dynamic = 'force-dynamic'` — a guard rail against Next.js caching user metadata across anonymous sessions |
| `app/(onboarding)/onboarding/demo/page.tsx` | Screens 1+2 — demo vault, capture chooser (scan/type live, voice signposted), real anonymous save, the visitor's own card enriching above the sign-in prompt |
| ~~`app/(onboarding)/onboarding/categories/page.tsx`~~ | **DELETED 2026-08-13 (commit `1ba48fe`).** Was Screen 3; collected category preferences nothing consumed, nothing linked to it. See ONBOARDING_SPEC.md "Screen 3" |
| `app/(auth)/login/page.tsx` + `google-sign-in-button.tsx` | Sign-in. Privacy line: "Private by default. Trust works both ways." Button marks the anonymous session for claim, then plain OAuth |
| `app/(app)/layout.tsx` | **Rewritten Session 15.** Was an empty passthrough; now mounts `AppProviders` once, above the router |
| `app/(app)/dashboard/dashboard-client.tsx` | 2×3 category mosaic. Save logic removed Session 15 — now lives in the provider |
| `app/(app)/dashboard/[category]/category-list-client.tsx` | Category list, grid/compact toggle persisted per-category. Subscribes to save events via `useSaveEvents` rather than owning the save |
| `app/(app)/rec/[id]/rec-detail-client.tsx` | Card detail. Renders `full-card.tsx`, candidate strips, photo picker, bounded poster search |
| `app/(app)/rec/[id]/edit/rec-edit-client.tsx` | Edit form. **Open question: can category be changed here? Never verified.** |
| `app/(app)/profile/profile-client.tsx` | Renders `FeedbackCard` |
| `app/privacy/page.tsx`, `app/terms/page.tsx` | **New Session 15.** Both render the shared `legal-page.tsx` shell |

---

## Navigation & shell

| Path | Purpose |
|---|---|
| `components/features/navigation/app-providers.tsx` | **New Session 15.** Layout-level: `ToastProvider`, `SaveProvider`, `AppFrame`. Owns the capture sheet, the save request, and `inFlight` — saves tracked from request through enrichment. **Nothing consumes `inFlight` yet** — it is the foundation for the save peek |
| `components/features/navigation/app-frame.tsx` | **New Session 15.** The centred column, defined once. `routeHasNav()` decides nav presence by route, so bottom padding can never disagree with whether a nav exists |
| ~~`components/features/navigation/app-shell.tsx`~~ | **DELETED 2026-08-13 (commit `1208aa6`).** Superseded by `app-providers.tsx` + `app-frame.tsx` in the Session 15 layout refactor |
| `components/features/navigation/bottom-nav.tsx` | Bottom nav + FAB. Also holds the one-time `[+]` tooltip (`taareef_fab_tooltip_shown`). Note: its `isVault` already anticipates `/rec/` routes it is never rendered on |

---

## Cards

| Path | Purpose |
|---|---|
| `components/features/cards/full-card.tsx` | The locked design. Reports image failure upward via `onImageError` so a dead URL stops hiding "add a photo" |
| `components/features/cards/recommendation-card.tsx` | `GridCard` and `CompactRow`. **Both still pre-Session-9 layout** — rebuild is Priority 7. Both now guard against image failure |
| `components/features/cards/category-motif.tsx` | 24 folk-art medallions across 6 traditions |
| `components/features/cards/platform-logo.tsx` | Inline OTT brand SVGs |

---

## Other components

| Path | Purpose |
|---|---|
| `components/features/capture/capture-screen.tsx` | speak / scan / type. Compresses images client-side before OCR |
| `components/features/legal/legal-page.tsx` | **New Session 15.** Shared shell for privacy and terms — one source of truth rather than two drifting pages |
| `components/features/feedback/feedback-card.tsx` | 4-mode feedback form |
| `components/features/places/photo-picker.tsx` | `PlacePhotoPicker` — lazy photo resolution. **Only appears when `photo_refs` exist**, which older cards lack |
| `components/features/vault/empty-state.tsx` | Per-category empty states. **Written for zero, not for one** |
| `components/features/vault/nudge-question.tsx` | Preference survey |
| `components/ui/` | `button`, `input`, `sheet`, `toast`, `card-skeleton` |

---

## API routes

| Path | Purpose |
|---|---|
| `app/api/recommendations/route.ts` | POST — save, triggers enrichment via `waitUntil` |
| `app/api/recommendations/[id]/route.ts` | GET/PATCH/DELETE |
| `app/api/enrich/[id]/route.ts` | Enrichment dispatcher, including `enrichPlaces` and the five-layer disambiguation |
| `app/api/enrich/book/[id]/route.ts` | Book enrichment |
| `app/api/places/photo/route.ts` | Resolves Google photo refs on demand — **the route the photo-ref architecture would use** |
| `app/api/capture/understand/route.ts` | LLM extraction. Canonical `VALID_SUBTYPES` lives here |
| `app/api/capture/audio/route.ts` | Whisper transcription |
| `app/api/capture/ocr/route.ts` | Vision OCR, status-code-differentiated errors, one retry |
| `app/api/health/models/route.ts` | **New Session 15.** Daily cron. Checks Groq's catalogue against `CONFIGURED_MODELS`. **Does not check the database** — which is why the 2-week pause went unnoticed |
| `app/api/auth/callback/route.ts` | OAuth exchange, then claims anonymous saves via cookie |
| `app/api/feedback/route.ts` · `posters/[id]` · `watchmode` | Unchanged |
| ~~`app/api/user/preferences/route.ts`~~ | **DELETED 2026-08-13 (commit `18c4ce1`).** Zero callers; went with Screen 3 and the `user_preferences` table |

---

## Library

| Path | Purpose |
|---|---|
| `lib/constants/models.ts` | **New Session 15.** Every Groq model ID, with shutdown dates. `CONFIGURED_MODELS`, `extractJson`, reasoning-effort constants, token budgets |
| `lib/supabase/anon.ts` | **New Session 15.** `ensureSession` (anonymous, on first save tap), `markSessionForClaim` (cookie, `SameSite=Lax`) |
| `lib/utils/compress-image.ts` | **New Session 15.** Resize to 1600px / JPEG 82% before upload. Fails open |
| `lib/places/matching.ts` | Pure place-matching logic |
| `lib/card/derive.ts` · `lib/types/index.ts` · `lib/utils/*` · `lib/supabase/{client,server,middleware}.ts` | Unchanged |
| `constants/example-cards.ts` | Six cards, one per category. Four with photos in `public/examples/` |
| `hooks/use-recommendations.ts` | `useCreateRecommendation`, optimistic UI |
| `lib/enrichment/identify.ts` | **New Session 18.** Identify-then-verify. One model call asking what the WORK IS; `corroborate` and `decide` are pure functions. `verifyNamedPeople` keeps only names appearing literally in the user's own text — the guard that stops a model manufacturing its own corroboration |
| `lib/enrichment/meta-writer.ts` | **New Session 18.** `MetaWriter` accumulator. Carries running metadata forward within a request so a second write cannot clobber the first from a stale snapshot. **Nothing may write `metadata:` directly on `recommendations`** |
| ~~`lib/enrichment/judge.ts`~~ | **Deleted Session 18.** LLM verdict layer (match/probably/unsure/none). Replaced by identify-then-verify: it was asked for a confidence it could not have, and returned "none" four times with the right film in its own input |
| ~~`lib/enrichment/query-shaper.ts`~~ | **Deleted Session 18.** LLM spelling proposals. Superseded — the model is now asked what the work IS rather than to guess how it might be spelt |
| `scripts/matching.golden.ts` | 16 regression checks over `lib/places/matching.ts`. Run and passing Session 18 |
| `scripts/identify.golden.ts` | **New Session 18.** 58 checks over the deterministic half of identification — drift budgets, corroboration, vetoes, parsing. Encodes the bugs, not just the fixes: the Telugu exact-spelling match, the famous-over-obscure trap, credits-unavailable-is-not-contradiction, and invented-name corroboration |
| ~~`scripts/judge.golden.ts`~~ | **Deleted Session 18** with the module it tested. Its cases survive in `identify.golden.ts` |

---

## Database

| Migration | Purpose |
|---|---|
| `001_initial_schema.sql` | Original 10-category schema |
| `002_experience_categories.sql` | Intermediate 8-category system |
| `003_subtype_casing_fix.sql` | Lowercased 5 rows with inconsistent subtype casing |
| `004_rls_cleanup.sql` | Dropped 4 duplicate policies, retargeted all to `authenticated` |
| `005_anon_save_cap.sql` | Restrictive policy capping anonymous sessions at 3 saves, via `current_user_save_count()` |
| `006_claim_anonymous_saves.sql` | `security definer` row transfer with six guards |
| `20260812_measurement_layer.sql` | `events` (monthly-partitioned), `search_log`, rollups, snapshots, `run_rollup` |
| `20260812_claim_anonymous_session.sql` | Atomic transfer of recommendations, events and search_log |
| `20260819_read_touch_does_not_bump_updated_at.sql` | **Session 18.** `update_updated_at` now preserves `updated_at` when a touch changes nothing but a read-marking column, so writing `last_opened_at` on card open does not make a READ look like an EDIT |
| `20260820_enrichment_band_add_none.sql` | **Session 18.** `enrichment_band` gains `none`. Had to land BEFORE any code emitted it — `run_rollup` casts `payload->>'band'` straight to the enum, and one unknown value would have raised inside the nightly job and taken every rollup down |
| `20260902_merge_card_metadata.sql` | **Session 18.** Merges a jsonb patch into `metadata` inside Postgres. ⚠️ **Applied to production but not called by any code.** Written after the fact — see G20 and DATA_SAFETY §3c |

**Live state, verified 2026-09-02:** `ACTIVE_HEALTHY`, `ap-south-1`. 36 recommendations, 7 anonymous users remaining, 13 `events` partitions, 3 cron jobs (nightly rollup, nightly backup, weekly snapshot) — all reporting `succeeded`. Rollups current to 2026-08-31, backup to 2026-09-02.

**Known data issues:**
- 6 cards hold expired Google Places URLs with no recoverable refs
- 4 cards carry source name `"Someone"`
- **Three duplicate indexes** — `idx_recommendations_user_*` ≡ `idx_recs_user_*` for status, category and created (G24)
- **`events` partitions stop at 2027-07** plus a DEFAULT. Nothing creates more (G25)
- **`idx_recommendations_fts` exists and is unused** — full-text search over title, source_name and notes is already indexed (G26)

---

## Config

| File | Note |
|---|---|
| `vercel.json` | **New Session 15.** Daily cron for `/api/health/models` |
| `middleware.ts` · `next.config.js` · `tailwind.config.ts` · `tsconfig.json` | Unchanged |
| `app/globals.css` | `--bg0` is `#111111`. Session 15 appended `taareefTipIn` keyframes with reduced-motion support |
| `CLAUDE.md` (repo root) | **Stale — historical only.** Describes the original 10-category system |

---

## Pending deletions

None outstanding. The three that stood here were all removed on 2026-08-13:
`app/(onboarding)/onboarding/categories/page.tsx` (`1ba48fe`),
`components/features/navigation/app-shell.tsx` (`1208aa6`),
`app/api/user/preferences/route.ts` (`18c4ce1`).
