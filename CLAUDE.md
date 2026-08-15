# CLAUDE.md — Taareef Project Root

> This file is read by Claude Code at the start of every session.
> It is the single source of truth for how this project is built.
> Every convention here is enforced without exception.

---

## About Taareef

Taareef (تعریف — Urdu/Hindi for "praise" and "recommendation") is a private, personal vault for capturing recommendations across all categories of life — restaurants, films, music, books, bars, cities, activities, podcasts, people to follow. The core insight: recommendations decay. They get lost in screenshots, DMs, and saved posts. Taareef centralises them with the source always visible.

The builder reads and understands code but needs support with debugging. Claude Code is the primary coding assistant. Code must be written as if it will be maintained and scaled — no shortcuts that work for a prototype but break at 1,000 users.

--------

## Locked Stack — No Substitutions Without Explicit Approval

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js App Router | 14 |
| Database + Auth | Supabase | Latest |
| Deployment | Vercel | Latest |
| Version control | GitHub | — |
| AI parsing | Anthropic Claude API | claude-sonnet-4-20250514 |
| Styling | Tailwind CSS | Latest |
| Language | TypeScript | Strict mode |

Do NOT suggest alternatives. Do NOT introduce new dependencies without flagging it first with a clear rationale and waiting for confirmation.

---

## Project Structure

```
/app
  /api
    /auth/callback        — Supabase OAuth callback
    /recommendations      — CRUD routes
    /parse                — Claude API parse endpoint (V2)
    /enrich/[id]          — Background enrichment (V2)
  /(auth)
    /login                — Login page
  /(app)
    /dashboard            — Home view (authenticated)
    /add                  — Add recommendation flow
    /[category]           — Category list view
    /rec/[id]             — Card detail view
/components
  /ui                     — Primitive components (Button, Input, Card, Sheet, Toast)
  /features               — Feature-specific composite components
/lib
  /supabase
    /client.ts            — Browser Supabase client
    /server.ts            — Server Supabase client
    /middleware.ts         — Middleware Supabase client
  /claude
    /client.ts            — Anthropic client
    /parse-prompt.ts      — System prompt for parse endpoint
  /utils                  — Shared utility functions
  /types
    /index.ts             — All TypeScript types and enums
/hooks                    — Custom React hooks
/constants
  /categories.ts          — Category definitions, icons, colours, verbs
  /sources.ts             — Source type definitions
/middleware.ts            — Next.js middleware for auth
```

---

## TypeScript Conventions

- All types live in `/lib/types/index.ts` — never inline types in component files
- Use `type` not `interface` unless extending is required
- Never use `any` — use `unknown` with type guards when needed
- All API responses must be typed
- Strict mode enabled in `tsconfig.json`

---

## Core Types

```typescript
// 10 categories — locked, no additions without explicit approval
export type Category =
  | 'restaurant'
  | 'bar'
  | 'film'
  | 'tv'
  | 'music'
  | 'book'
  | 'city'
  | 'activity'
  | 'podcast'
  | 'person'

// Source types
export type SourceType =
  | 'friend'
  | 'family'
  | 'colleague'
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'article'
  | 'newsletter'
  | 'podcast'
  | 'self'

// Reaction — set only after experiencing. 4 options, not binary.
export type Reaction = 'loved' | 'good' | 'okay' | 'skip'

// Priority
export type Priority = 'low' | 'medium' | 'high'

// Status is category-specific — NOT a global enum
// Each category defines its own valid states
// See DATA_MODEL.md and per-category specs
// The status column in Supabase is TEXT with category-specific check constraints

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
  location: {
    city?: string
    country?: string
    address?: string
    lat?: number
    lng?: number
  } | null
  status: string                    // category-specific — see per-category spec
  priority: Priority
  reaction: Reaction | null         // null until experienced
  metadata: Record<string, unknown> // enrichment data — shape per category
  created_at: string
  updated_at: string
}

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  meta?: {
    total?: number
    page?: number
  }
}
```

---

## Error Handling — Non-Negotiable Rules

- Every async function must have try/catch
- API routes always return `{ data, error }` shape — never throw naked errors to client
- Supabase calls always destructure `{ data, error }` and handle both branches
- User-facing error messages are friendly and non-technical
- Raw errors are logged server-side only — never exposed to client
- Silent failures are forbidden — if a save fails, the user must know within 60 seconds

---

## Supabase Rules

- Server-side Supabase client in API routes and Server Components
- Browser client in Client Components only
- Row Level Security is enabled on all tables — never bypass with service role key in client code
- Service role key lives only in server-side environment variables
- Always destructure `{ data, error }` from every Supabase call — never assume success

---

## Component Rules

- Server Components by default — add `"use client"` only when required (interactivity, hooks, browser APIs)
- No prop drilling beyond 2 levels — use context or co-locate state
- All save operations use optimistic UI — card appears instantly, syncs in background
- No blocking spinners on the save flow — only a subtle loading indicator on the card itself

---

## API Route Rules

- Validate all input explicitly before hitting the database
- Return consistent shape: `{ data: T | null, error: string | null }`
- Rate limit `/api/parse` — Claude API calls are expensive (max 10/user/minute)
- Log errors with context: route, user_id, input shape, timestamp
- Soft delete only — never hard delete recommendations (set status to 'dismissed')

---

## Environment Variables

- Never hardcode secrets or API keys anywhere in the codebase
- All env vars documented in `.env.example` — keep it updated after every addition
- Client-safe vars prefixed with `NEXT_PUBLIC_`
- Service role key and API keys are server-only — never in client-side code

---

## UX Principles — Code Must Enforce These

| Principle | Implementation rule |
|---|---|
| Save flow ≤ 8 seconds | No blocking network calls before card appears |
| Source always visible | `source_name` rendered on every card in every list view, always |
| Adaptive home | Only render category sections with ≥ 1 save |
| Empty states invite | Every empty state has warm copy and a CTA — no blank screens |
| Nuance fields detail-only | occasion, mood, price, best_time, note only in card detail view |
| Optimistic UI | Card appears immediately on save tap — Supabase sync is background |

---

## V1 Scope — Build Only This

1. Google OAuth via Supabase Auth
2. Manual add flow: category → title → source → save (3 taps max)
3. Category list view (adaptive — hide empty categories)
4. Individual card detail view with nuance fields
5. Mark as experienced + reaction (loved/good/okay/skip)
6. Basic filter by category
7. Warm empty states for all 10 categories
8. Seeded example cards on first run
9. Mobile-responsive layout (375px first)
10. Deployed on Vercel

**V2 features are NOT in scope.** If a V2 feature appears in a request, flag it explicitly and ask for confirmation before proceeding. Add it to BACKLOG.md instead.

---

## Working Style

- Explain what you're about to do before doing it
- Flag potential issues before writing code — not after
- When debugging: diagnosis first, fix second
- Never silently refactor unrelated code
- Name trade-offs explicitly: "I'm doing X because Y — the trade-off is Z"
- Update `.env.example` whenever a new environment variable is added
- At the end of every session: run the end-of-session protocol from WORKING_AGREEMENT.md

---

## Do Not Touch Without Explicit Instruction

- `/app/(auth)` routes once set up
- Database migration files once applied to production
- Any file marked `// DO NOT MODIFY — LOCKED` at the top
- DECISIONS.md entries — append only, never edit past decisions
