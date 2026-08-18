# KB-FILEMAP.md — Taareef
> Complete file map. Update at the end of every session.
> Last updated: Session 16 — 2026-08-10 — **rebuilt from a fresh `git clone`, not from memory.** Every path below was listed from the live repo.

---

## Screens

| Path | Purpose |
|---|---|
| `app/page.tsx` | Screen 0 — landing. Headline "Your recommendation journal.", `ShelfIllustration` (five category-coloured objects, rebuilt Session 15), fluid `clamp()` type, `dvh` spacing |
| `app/(onboarding)/layout.tsx` | **New Session 15.** Carries `export const dynamic = 'force-dynamic'` — a guard rail against Next.js caching user metadata across anonymous sessions |
| `app/(onboarding)/onboarding/demo/page.tsx` | Screens 1+2 — demo vault, capture chooser (scan/type live, voice signposted), real anonymous save, the visitor's own card enriching above the sign-in prompt |
| `app/(onboarding)/onboarding/categories/page.tsx` | **Screen 3 — DELETE THIS.** Agreed deleted Session 15; the file is still in the repo. Nothing links to it; it collected preferences nothing consumed |
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
| `components/features/navigation/app-shell.tsx` | **DEAD — DELETE THIS.** Nothing imports it. Superseded by the two files above |
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
| `app/api/feedback/route.ts` · `posters/[id]` · `watchmode` · `user/preferences` | Unchanged |

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
| `scripts/matching.golden.ts` | 16 regression checks. **Not run once in Sessions 15 or 16** |

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

**Live state, verified 2026-08-10:** `ACTIVE_HEALTHY`, `ap-south-1`. 32 recommendations, 16 users (**12 anonymous — cleanup job never built**), 8 policies, 3 functions.

**Known data issues:** 6 cards hold expired Google Places URLs with no recoverable refs. 4 cards carry source name `"Someone"`.

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

- `app/(onboarding)/onboarding/categories/page.tsx` — Screen 3, agreed deleted Session 15
- `components/features/navigation/app-shell.tsx` — dead since the Session 15 layout refactor
