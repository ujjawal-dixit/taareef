# ENV_TEMPLATE.md — Taareef Environment Variables

> Documentation for every environment variable the project uses.
> Keep this file updated after every addition.
> The `.env.example` file at the repo root is generated from this.
> **Rewritten Session 14 — 2026-07-22.** The prior version of this file was significantly stale: it documented an `ANTHROPIC_API_KEY` and a `/api/parse` endpoint that don't exist anywhere in the current codebase, and was missing several variables the app actually depends on. This version is built from a direct `grep` of every `process.env.*` reference in the live repo, not from memory.

---

## Vercel Environment Notes

This project runs on Vercel Hobby plan. Environment variables are set for **Production and Preview** environments only. The Development environment is locked on the Hobby plan and is not needed — the developer works via Claude Projects + GitHub + Vercel directly, with no local development environment.

---

## Ground Truth: Every `process.env` Reference Found in Code (Session 14)

```
process.env.FOUNDER_EMAIL
process.env.GOOGLE_BOOKS_API_KEY
process.env.GOOGLE_PLACES_API_KEY
process.env.GROQ_API_KEY
process.env.NEXT_PUBLIC_APP_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.RESEND_API_KEY
process.env.SPOTIFY_CLIENT_ID
process.env.SPOTIFY_CLIENT_SECRET
process.env.TMDB_API_KEY
process.env.WATCHMODE_API_KEY
```

Notably absent from this list: `ANTHROPIC_API_KEY`, `SHAZAM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The first two were never built (the capture pipeline runs on Groq, not Claude; Shazam/ShazamKit is still a V2 backlog idea, not built). The third is more interesting — see note below.

---

## Required Variables — Confirmed Active in Production

---

### NEXT_PUBLIC_SUPABASE_URL

**Description:** The URL of your Supabase project. Used to initialise the Supabase client on both client and server.

**Where to get it:** Supabase dashboard → Settings → API Keys → your project URL.

**Exposure:** Client-safe (NEXT_PUBLIC_ prefix)

**Format:** `https://[project-ref].supabase.co`

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY

**Description:** The anonymous (public) key for your Supabase project. Used for client-side and, confirmed Session 14, also server-side Supabase operations in this codebase. Safe to expose — Row Level Security enforces data access.

**Where to get it:** Supabase dashboard → Settings → API Keys → `anon public` key.

**Exposure:** Client-safe (NEXT_PUBLIC_ prefix)

**Format:** Long JWT string starting with `eyJ...`

---

### SUPABASE_SERVICE_ROLE_KEY

**Description:** The service role key for your Supabase project. Bypasses Row Level Security. Intended for server-side-only use.

**⚠️ Note added Session 14:** a direct `grep` of every `process.env.*` reference in the live repo found **no use of this variable anywhere.** `lib/supabase/server.ts` and `lib/supabase/client.ts` both appear to run entirely on the anon key + RLS, including server-side. This may be intentional (RLS alone may be sufficient for this app's access patterns) or it may mean this key is set in Vercel but doing nothing. Worth a deliberate decision next time this comes up: either confirm it's genuinely unneeded and remove it from Vercel, or identify a real use case for it.

**Exposure:** Server-only — NEVER prefix with NEXT_PUBLIC_

**Format:** Long JWT string

**Warning:** If this key is ever committed to a public repository or exposed client-side, rotate it immediately from the Supabase dashboard.

---

### NEXT_PUBLIC_APP_URL

**Description:** The public URL of the deployed application. Used for OAuth redirect URLs.

**Exposure:** Client-safe (NEXT_PUBLIC_ prefix)

**Format:** URL without trailing slash — `https://taareef.vercel.app`

---

### GROQ_API_KEY

**Description:** Used by TWO surfaces, confirmed Session 14: (1) `app/api/capture/understand/route.ts` — synchronous LLM extraction from freeform capture input, plus Whisper audio transcription and Vision OCR; (2) `enrichPlaces` inside `app/api/enrich/[id]/route.ts` — asynchronous place-matching disambiguation, via `waitUntil`. Same key, decoupled in practice since the two rarely contend for capacity at once.

**Where to get it:** https://console.groq.com → API Keys

**Exposure:** Server-only

**Note:** this project does NOT use the Anthropic API for extraction, despite what an earlier version of this file said. There is no `/api/parse` route and no `ANTHROPIC_API_KEY` anywhere in the codebase.

---

### GOOGLE_PLACES_API_KEY

**Description:** Confirmed active, Session 13/14. Powers Dine/Visit/Do enrichment via Places API (New) — five-layer disambiguation in `lib/places/matching.ts`. Restricted to Places API (New) only.

**Where to get it:** Google Cloud Console → APIs & Services → Credentials → Create Credentials → API Key → enable Places API (New), restrict the key to it.

**Exposure:** Server-only

---

### TMDB_API_KEY

**Description:** Film/TV enrichment via TMDB.

**Where to get it:** https://www.themoviedb.org/settings/api

**Exposure:** Server-only

---

### SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET

**Description:** Music enrichment via Spotify Client Credentials flow.

**Where to get it:** https://developer.spotify.com/dashboard

**Exposure:** Server-only

---

### GOOGLE_BOOKS_API_KEY

**Description:** Confirmed active. Book enrichment for the Read category, auto-confirm at ≥88% confidence.

**Where to get it:** Google Cloud Console → enable Google Books API → create credentials.

**Exposure:** Server-only

---

### WATCHMODE_API_KEY

**Description:** Confirmed active. Streaming platform lookup — powers the OTT logo shown on Watch cards.

**Where to get it:** https://api.watchmode.com

**Exposure:** Server-only

---

### RESEND_API_KEY / FOUNDER_EMAIL

**Description:** Confirmed active. Powers the feedback form on the profile screen, which sends email via Resend. `app/api/feedback/route.ts` is auth-guarded (Session 13) — a logged-in user is required before an email can be triggered.

**Exposure:** Server-only

---

## Not Currently Used — Kept for Future Reference Only

### SHAZAM_API_KEY

Not referenced anywhere in the current codebase. `ShazamKit integration (iOS music capture)` is a V2 backlog item, not yet built. If it's ever built, confirm whether ShazamKit (native iOS) or a RapidAPI-based Shazam endpoint is the actual chosen approach before re-adding this variable — they're different integrations with different keys.

---

## .env.example

```bash
# =============================================================
# Taareef — Environment Variables
# =============================================================
# This file is safe to commit. It contains no real values.
# In Vercel: add real values under Settings → Environment Variables
# Set for Production and Preview environments.
# Rewritten Session 14 to match what the code actually references.
# =============================================================


# -------------------------------------------------------------
# SUPABASE — Required
# -------------------------------------------------------------

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Server-only — NEVER prefix with NEXT_PUBLIC_
# Note: not currently referenced anywhere in code as of Session 14 — see file body above.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here


# -------------------------------------------------------------
# APP — Required
# -------------------------------------------------------------

NEXT_PUBLIC_APP_URL=https://taareef.vercel.app


# -------------------------------------------------------------
# GROQ — Required (audio, OCR, extraction, place disambiguation)
# -------------------------------------------------------------

GROQ_API_KEY=your-groq-api-key-here


# -------------------------------------------------------------
# ENRICHMENT APIs — Required, active in production
# -------------------------------------------------------------

GOOGLE_PLACES_API_KEY=your-google-places-key-here
TMDB_API_KEY=your-tmdb-api-key-here
SPOTIFY_CLIENT_ID=your-spotify-client-id-here
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret-here
GOOGLE_BOOKS_API_KEY=your-google-books-key-here
WATCHMODE_API_KEY=your-watchmode-key-here


# -------------------------------------------------------------
# FEEDBACK — Optional, active in production
# -------------------------------------------------------------

RESEND_API_KEY=your-resend-key-here
FOUNDER_EMAIL=your-email@example.com


# -------------------------------------------------------------
# DEAD / UNUSED — safe to remove from Vercel whenever convenient
# -------------------------------------------------------------

# FOURSQUARE_API_KEY=  — retired Session 13, Foursquare API deprecated
# ANTHROPIC_API_KEY=   — never built; extraction runs on Groq, not Claude
# SHAZAM_API_KEY=      — never built; ShazamKit is still a V2 backlog idea
```
