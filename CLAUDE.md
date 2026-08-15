# CLAUDE.md — Taareef Project Root

> Read by Claude Code at the start of every session. Single source of truth for how this project is built.
> **Verified against the live repo and database on 2026-08-15 (Session 17).**
> Where this file and the code disagree, the code wins — and this file is a bug.

---

## About Taareef

Taareef (تعریف — Urdu/Hindi for "praise" and "recommendation") is a **private** vault for recommendations, where **the human source is preserved as primary metadata**: who recommended it, and why.

That is the whole product. Everything else follows from it.

**The deliberate absences are the design.** No public profiles. No algorithmic recommendations. No ratings. No social feed. No forced engagement. No streaks. No notifications that chase you. When evaluating any feature, apply the **Journal Test**: *does this make Taareef feel more like a private journal, or less?* If less, it does not ship, regardless of how well it would perform.

**Current honest state (Session 17):** intake works well; **retrieval is the missing half.** 34 saves, 3 ever marked experienced, oldest untouched item 82 days. An excellent capture flow with no digestive system is not a complete product. Retrieval work outranks new capture features.

The builder directs all product and architectural decisions and reads code fluently but does not run a local dev environment. Code must be written to be maintained, not to demo.

---

## Locked Stack — No Substitutions Without Explicit Approval

| Layer | Tool |
|---|---|
| Framework | Next.js App Router 14 |
| Database + Auth | Supabase (`ap-south-1` Mumbai, project `tcuyfrcmjrtczneklhmx`) |
| Deployment | Vercel (auto-deploy from `main`) |
| Version control | GitHub — `ujjawal-dixit/taareef`, **public**, `main` protected by ruleset |
| AI capture + parsing | **Groq** — Whisper, vision, Llama. IDs **only** in `lib/constants/models.ts` |
| Enrichment APIs | TMDB · Spotify · Google Books · Watchmode · Google Places |
| Styling | Tailwind CSS |
| Language | TypeScript, strict |

Never introduce a dependency without flagging it and waiting for confirmation.

⚠️ **Never hardcode a Groq model ID.** A bare string literal in a route file caused a nine-day silent outage when Groq retired the model. Every ID lives in `lib/constants/models.ts` and nowhere else. `/api/health/models` checks them daily.

---

## The Six Categories — locked

```typescript
export type Category =
  | 'watch'   // Film · Series · Documentary                        — Warli
  | 'listen'  // Album · Podcast · Audiobook · Artist               — Gond
  | 'read'    // Fiction · Non-fiction · Poetry                     — Madhubani
  | 'dine'    // Restaurant · Café · Bar · Street food              — Block-print
  | 'do'      // Hike · Trail · Adventure · Workshop · Live show    — Saora
  | 'visit'   // Museum · Gallery · Heritage · Viewpoint · Market   — Kalamkari
```

Source of truth: `lib/types/index.ts`. **Any reference anywhere to 8 or 10 categories is historical and wrong.**

⚠️ The Postgres `category` enum still contains 14 dead values from the old scheme (`restaurant`, `film`, `bar`, …). They are insertable and must never be used. Removing them requires recreating the type — see `GAPS.md` G05.

---

## Project Structure — verified 2026-08-15

```
/app
  /api
    /auth/callback              — OAuth; calls claim_anonymous_session()
    /capture/audio              — Groq Whisper
    /capture/ocr                — Groq vision
    /capture/understand         — Groq Llama extraction
    /enrich/[id]                — Enrichment + confidence bands
    /enrich/book/[id]
    /feedback
    /health/models              — Daily Groq model check
    /health/database            — Daily DB + cron check (Session 17)
    /places/photo               — Google Places photo proxy
    /posters/[id]
    /recommendations            — CRUD
    /watchmode
  /(auth)/login
  /(onboarding)/onboarding/demo — First-run demo vault
  /(app)
    /dashboard                  — Home
    /dashboard/[category]       — Category list
    /rec/[id]                   — Card detail
    /profile
  /privacy  /terms
/components
  /ui                           — Primitives
  /features                     — cards, capture, places, navigation
/lib
  /analytics
    /track.ts                   — Browser event writer
    /track-server.ts            — Server event writer
  /supabase                     — client · server · anon
  /constants/models.ts          — ALL Groq model IDs
  /types/index.ts               — ALL types
  /utils
/constants/categories.ts
/scripts/matching.golden.ts     — 16-check golden suite
/middleware.ts
```

---

## Measurement Layer (Session 17)

An `events` table, monthly-partitioned, plus nightly rollups. Governed by one rule:

> **Only log what you would be willing to show the person in their own Wrapped.**

That rules out dwell time, scroll depth, location, and any user content (titles, notes). **Search queries are the sole exception** — they are the user's own words about their own vault and the words *are* the data.

- **All events go through `lib/analytics/track.ts` or `track-server.ts`.** No route inserts into `events` directly. This one rule is what stops the table becoming a junk drawer.
- Every event kind must have a written question it answers. No question, no event.
- Three enrichment outcomes — `accepted` · `corrected` · **`untouched`**. No correction is *not* the same as correct.
- Rollups group by the user's **local** date, never UTC. IST is +5:30; UTC grouping scatters every evening onto the next day.
- **North Star: completions. Counter-metric: saves.** Session length and DAU are explicitly rejected — for Taareef a *short* session is a success.

Full reasoning: `KB-MEASUREMENT_DECISIONS.md`.

---

## Database Safety — non-negotiable

⚠️ **T17: Preview before you destroy.** No `DELETE` or `UPDATE` runs until the identical `WHERE` clause has been run as a `SELECT` and the count read. No exception for changes that feel additive — that feeling is what precedes accidents.

- Every destructive function takes `dry_run` **defaulting to `true`**
- Reference implementations: `cleanup_anonymous_users()`, `restore_from_backup()`
- Nightly backup to `recommendations_backup`, 14 daily snapshots
- **A schema is not verified until something has written to it.** Ship the consumer in the same delivery as the table
- Supabase free tier has **no point-in-time recovery**. There is no undo

---

## Git Workflow — enforced by ruleset

⚠️ **Nothing reaches `main` without a pull request.** Branch → PR → Vercel preview → Ujjawal opens it on a real phone → merge.

**The preview is the review; the diff is not.** One concern per PR.

---

## TypeScript Conventions

- All types in `lib/types/index.ts` — never inline in components
- `type` over `interface` unless extending
- Never `any` — use `unknown` with guards
- Strict mode, always

---

## Core Types

```typescript
export type SourceType =
  | 'friend' | 'family' | 'colleague'
  | 'instagram' | 'twitter' | 'youtube'
  | 'article' | 'newsletter' | 'podcast' | 'self'

/** Set only AFTER experiencing. Four options, never binary. */
export type Reaction = 'loved' | 'good' | 'okay' | 'skip'

export type Priority = 'low' | 'medium' | 'high'

// Status is category-specific, NOT a global enum.
// The column is TEXT — currently unconstrained. See GAPS.md G04.

export type Recommendation = {
  id: string
  user_id: string
  title: string
  category: Category
  source_type: SourceType
  source_name: string
  url: string | null
  image_url: string | null
  notes: string | null
  location: { city?: string; country?: string; address?: string; lat?: number; lng?: number } | null
  status: string
  priority: Priority
  reaction: Reaction | null           // null until experienced
  metadata: Record<string, unknown>   // enrichment; includes enrichment_id correlation ticket
  created_at: string
  updated_at: string
  status_changed_at: string | null    // Session 17 — the north-star metric reads THIS
  last_opened_at: string | null       // Session 17 — durable, feeds the weekly snapshot
}

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  meta?: { total?: number; page?: number }
}
```

⚠️ `created_at` is the **save** date. Reading it as a completion date produced a two-month figure that was wrong by six weeks and reprioritised a whole session. Completions read `status_changed_at`.

---

## Error Handling — non-negotiable

- Every async function has try/catch
- API routes return `{ data, error }` — never throw naked errors to the client
- Always destructure `{ data, error }` from Supabase calls and handle both branches
- User-facing messages are friendly and non-technical; raw errors are logged server-side only
- **Silent failures are forbidden.** A nine-day outage happened because a failure looked like a user error
- **Analytics is the exception, in the other direction:** a failed event write must be invisible and must never break a user action

---

## Supabase Rules

- Server client in routes and Server Components; browser client in Client Components only
- RLS on every table — never bypass with the service role key in client code
- Service role key is server-only

---

## Component Rules

- Server Components by default; `"use client"` only when genuinely required
- No prop drilling beyond 2 levels
- **Optimistic UI on every save** — the card appears instantly, sync happens behind it
- No blocking spinners in the save flow

⚠️ **Two-copies problem:** the detail screen and the card component have separate markup. A change to how a card renders must be made in both, in the same delivery.

---

## API Route Rules

- Validate input explicitly before touching the database
- Consistent `{ data, error }` shape
- Rate limit expensive AI calls
- Log with context: route, user_id, input shape, timestamp
- **Soft delete only** — set status to `dismissed`, never hard delete

---

## UX Principles — code must enforce these

| Principle | Implementation rule |
|---|---|
| Save ≤ 8 seconds, ≤ 2 taps | No blocking network call before the card appears |
| **Source always visible** | `source_name` renders on every card in every view, always |
| Adaptive home | Only render categories with ≥ 1 save |
| Empty states invite | Warm copy and a CTA — never a blank screen |
| Nuance fields are detail-only | occasion, mood, price, best_time, note |
| Optimistic UI | Card appears on tap; Supabase sync is background |
| **Never nag** | No notification chases the user. A journal does not chase you |

---

## Working Style

- Explain before doing; flag issues **before** writing code
- Diagnosis first, fix second. **After two failed fixes, stop guessing — instrument and get one piece of real evidence** (the Gokul Bar rule)
- Never silently refactor unrelated code
- Name trade-offs explicitly: "doing X because Y — the trade-off is Z"
- **Never change existing UI without stopping and confirming exactly what would change.** A broad instruction is not per-instance permission
- Update `.env.example` with every new variable
- End every response with: what changed · what is next · how we could improve the process

**Session open:** run the vault status query before touching the backlog.
**Session close:** update `KB-SESSION_LOG.md`, `GAPS.md`, and the relevant KB files.

---

## Companion Documents

| File | Contents |
|---|---|
| `TENETS.md` | T1–T19, the non-negotiable working rules, each with the failure that caused it |
| `GAPS.md` | Open gaps by severity; resolved ones with dates |
| `KB-MEASUREMENT_DECISIONS.md` | Why the measurement layer is shaped as it is |
| `KB-DECISIONS.md` | Product and architecture decisions |
| `BACKLOG.md` | What we intend to build |
| `DATA_SAFETY.md` | Destructive-operation protocol |

---

## Do Not Touch Without Explicit Instruction

- `/app/(auth)` routes
- Applied database migrations
- Any file marked `// DO NOT MODIFY — LOCKED`
- `KB-DECISIONS.md` entries — append only
- `lib/constants/models.ts` model IDs — change only against Groq's deprecation page
