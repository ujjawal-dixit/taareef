# API_SPEC.md — Taareef API Specification
> ⚠️ Updated Session 8: Category system is now 6 values (watch/listen/read/dine/do/visit).
> PATCH /api/recommendations/[id] now accepts `category` field.
> /api/enrich/[id] now uses 'watch' (not 'film'/'tv') and 'listen' (not 'music').

> Complete specification for every API route in Taareef.
> Request/response contracts, validation rules, error codes.
> Includes the complete Claude parse system prompt.
> Developers build from this file without asking clarifying questions.

---

## Standard Response Envelope

All routes return this shape:

```typescript
type ApiResponse<T> = {
  data: T | null
  error: string | null   // user-friendly message, never raw error
  meta?: {
    total?: number       // list endpoints
    page?: number
  }
}
```

**Error message conventions:**

| Error type | Example message | Notes |
|---|---|---|
| Validation | "Title is required" | Specific and actionable |
| Auth | "You must be logged in" | Generic — never say why auth failed |
| Not found | "Recommendation not found" | Generic |
| Server | "Something went wrong — please try again" | Never expose raw errors |
| Rate limit | "You're moving fast — please wait a moment" | Informative, not accusatory |

---

## Auth Routes

---

### GET `/api/auth/callback`

Supabase OAuth callback handler. Exchanges the auth code for a session.

**Auth required:** No

**Query params:**
```
code: string    — OAuth code from Supabase
next: string    — redirect URL after auth (default: /dashboard)
```

**On success:** Redirect to `next` (or `/dashboard`)

**On error:** Redirect to `/login?error=auth_failed`

**Implementation note:** Use Supabase server client to exchange code for session. Set session cookies. This is the standard Supabase OAuth callback pattern.

---

## Recommendation Routes

---

### POST `/api/recommendations`

Create a new recommendation.

**Auth required:** Yes

**Request body:**
```typescript
type CreateRecommendationInput = {
  title: string                    // required
  category: Category               // required
  source_type: SourceType          // required
  source_name: string              // required
  url?: string
  image_url?: string
  notes?: string
  location?: {
    city?: string
    country?: string
    address?: string
    lat?: number
    lng?: number
  }
  priority?: Priority              // default: 'medium'
  metadata?: Record<string, unknown>
}
```

**Validation:**
- `title`: required, non-empty, max 500 chars
- `category`: must be one of the 6 valid Category values: watch, listen, read, dine, do, visit
- `source_type`: must be one of the 10 valid SourceType values
- `source_name`: required, non-empty, max 200 chars
- `url`: must be valid URL if provided
- `notes`: max 1000 chars if provided

**Response:**
```typescript
ApiResponse<Recommendation>
```

**Status codes:**
- `201` — created successfully
- `400` — validation error (error message is specific)
- `401` — not authenticated
- `500` — server error

**Implementation notes:**
- Set `user_id` from the authenticated session — never from request body
- Set `status` to `'saved'` (default)
- Set `reaction` to `null`
- Supabase insert with RLS will enforce user_id match

---

### GET `/api/recommendations`

List all recommendations for the authenticated user.

**Auth required:** Yes

**Query params:**
```typescript
type ListRecommendationsParams = {
  category?: Category              // filter by category
  status?: string                  // filter by status
  search?: string                  // keyword search (V2 — ignored in V1)
  limit?: number                   // default: 50, max: 100
  offset?: number                  // default: 0
}
```

**Response:**
```typescript
ApiResponse<Recommendation[]>
// meta.total = total count (for pagination)
```

**Status codes:**
- `200` — success (empty array if no results — never 404)
- `401` — not authenticated
- `500` — server error

**Implementation notes:**
- Always filter by `user_id` from session (RLS also enforces this)
- Default sort: `created_at DESC`
- If `category` param provided: filter by category
- If `status` param provided: filter by status
- Search is not implemented in V1 — log a warning if the param is provided

---

### GET `/api/recommendations/[id]`

Get a single recommendation by ID.

**Auth required:** Yes

**Response:**
```typescript
ApiResponse<Recommendation>
```

**Status codes:**
- `200` — found
- `401` — not authenticated
- `404` — not found (or belongs to another user — return 404, not 403, for privacy)
- `500` — server error

---

### PATCH `/api/recommendations/[id]`

Update a recommendation. Partial update — only provided fields are changed.

**Auth required:** Yes

**Request body:**
```typescript
type UpdateRecommendationInput = {
  title?: string
  category?: Category              // can be changed via edit screen
  source_name?: string
  source_type?: SourceType
  notes?: string
  status?: string                  // category-specific valid values only
  reaction?: Reaction              // only valid after status = experienced variant
  priority?: Priority
  location?: { city?: string; country?: string; address?: string; lat?: number; lng?: number }
  metadata?: Record<string, unknown>
  // Nuance fields (set from card detail view, post-save)
  occasion?: string
  mood?: string
  price?: string
  best_time?: string
}
```

**Validation:**
- At least one field must be provided
- If `status` is provided: validate it is a valid status for this recommendation's category
- If `reaction` is provided: validate the recommendation has been experienced (status indicates experiencing)
- Never allow updating `user_id`, `id`, `created_at`

**Response:**
```typescript
ApiResponse<Recommendation>
```

**Status codes:**
- `200` — updated
- `400` — validation error
- `401` — not authenticated
- `404` — not found or unauthorised
- `500` — server error

---

### DELETE `/api/recommendations/[id]`

Soft delete: sets status to `'dismissed'`. Does not hard delete.

**Auth required:** Yes

**Response:**
```typescript
ApiResponse<{ id: string }>
```

**Status codes:**
- `200` — dismissed
- `401` — not authenticated
- `404` — not found or unauthorised
- `500` — server error

**Implementation note:** PATCH status to 'dismissed'. Do not use SQL DELETE. Hard delete is available only from settings as an explicit user action.

---

## Parse Route (V2)

---

### POST `/api/parse`

The AI brain of the product. Takes a URL, raw text, or OCR output and returns a structured recommendation card for the user to confirm before saving.

**Auth required:** Yes

**Rate limit:** 10 requests per user per minute (in-memory counter for V1, Redis/Upstash for V2+)

**Request body:**
```typescript
type ParseInput = {
  input: string
  input_type: 'url' | 'text' | 'ocr'
}
```

**Validation:**
- `input`: required, non-empty, max 10,000 chars
- `input_type`: must be one of the three valid values
- If `input_type` is `'url'`: validate it is a parseable URL

**Response:**
```typescript
type ParsedRecommendation = {
  title: string | null
  category: Category | null
  source_type: SourceType | null
  source_name: string | null
  notes: string | null
  url: string | null
  location: { city: string; country: string } | null
  confidence: 'high' | 'medium' | 'low'
}

ApiResponse<ParsedRecommendation>
```

**Status codes:**
- `200` — parsed (even partial results — the user confirms)
- `400` — validation error
- `401` — not authenticated
- `429` — rate limit exceeded
- `503` — Claude API unavailable
- `500` — server error

**Implementation notes:**
- If `input_type` is `'url'`: fetch the URL first, extract text and OG tags, then send to Claude
- Never auto-save — always return to the user for confirmation
- Log: user_id, input_type, input length, confidence, timestamp (not the raw input — privacy)
- On Claude API error: return 503 with friendly message, log the full error server-side

---

## The Claude Parse System Prompt

**File:** `/lib/claude/parse-prompt.ts`

```typescript
export const PARSE_SYSTEM_PROMPT = `
You are a recommendation extraction specialist. Your job is to extract structured recommendation data from user-provided content.

You will receive content that is one of:
- A URL with its page content (input_type: url)
- Raw text from a message, note, or conversation (input_type: text)  
- Text extracted via OCR from a screenshot (input_type: ocr)

Your task is to identify the recommendation being made and extract the following fields.

VALID CATEGORIES (choose exactly one, or null if unclear):
watch, listen, read, dine, do, visit

- watch: films, TV shows, series, documentaries
- listen: music, albums, songs, podcasts, artists
- read: books, fiction, non-fiction, poetry
- dine: restaurants, bars, cafes, street food — anything food or drink
- do: hikes, adventures, rides, activities
- visit: exhibitions, galleries, concerts, plays, theatre

For dine: also extract 'what_to_order' if mentioned (the specific dish/drink recommended).
For visit: also extract 'dates' if mentioned (closing date or run dates as a string).

VALID SOURCE TYPES (choose exactly one, or null if unclear):
friend, family, colleague, instagram, twitter, youtube, article, newsletter, podcast, self

EXTRACTION RULES:
1. Never invent information. Return null for any field you cannot determine from the content.
2. For category detection, use context clues:
   - Spotify link or music content → music
   - Google Maps or restaurant/bar content → restaurant or bar
   - IMDb, TMDB, or film content → film or tv
   - Podcast RSS feed or episode → podcast
   - Book, ISBN, Goodreads → book
   - City, country, travel content → city
3. For source detection, look for attribution clues in the text:
   - "sent by Arjun" or "Arjun recommended" → source_name: "Arjun", source_type: "friend"
   - Instagram URL → source_type: "instagram"
   - YouTube URL → source_type: "youtube"
   - Article or blog URL → source_type: "article"
4. For the notes field: write a warm, brief (max 15 words) description of why this might be worth experiencing — inferred from the content, never fabricated. If you cannot determine this, return null.
5. For confidence:
   - high: title, category, and source are all clear
   - medium: title is clear but category or source is inferred
   - low: significant uncertainty about what is being recommended

RESPONSE FORMAT:
Return ONLY a valid JSON object. No prose. No explanation. No markdown code fences. No surrounding text. Just the JSON.

The JSON must have exactly these keys:
{
  "title": string or null,
  "category": one of the valid categories or null,
  "source_type": one of the valid source types or null,
  "source_name": string or null,
  "notes": string or null,
  "url": string or null,
  "location": { "city": string, "country": string } or null,
  "confidence": "high" or "medium" or "low"
}
`

export const buildParseUserMessage = (
  input: string,
  inputType: 'url' | 'text' | 'ocr'
): string => {
  const typeLabel = {
    url: 'URL content',
    text: 'text message or note',
    ocr: 'OCR-extracted text from a screenshot',
  }[inputType]

  return `Extract the recommendation from this ${typeLabel}:\n\n${input}`
}
```

---

## Enrichment Route (V2)

---

### POST `/api/enrich/[id]`

Trigger background enrichment for a recommendation. Fetches metadata from external APIs based on category.

**Auth required:** Yes

**No request body required.** The recommendation ID from the URL is sufficient.

**Response:**
```typescript
ApiResponse<{ enriched: boolean; metadata: Record<string, unknown> }>
```

**Enrichment by category:**

| Category | API | Fields populated |
|---|---|---|
| film / tv | TMDB | poster_path, overview, release_year, genres, rating |
| music | Spotify | artist, album, artwork_url, preview_url |
| restaurant / bar | Google Places | address, phone, website, price_level, opening_hours |
| book | Open Library | author, cover_url, publisher, year |
| podcast | RSS feed | episode_title, artwork_url, duration |

**Status codes:**
- `200` — enriched (metadata updated)
- `200` — not enriched (no URL or identifier to look up — not an error)
- `401` — not authenticated
- `404` — recommendation not found
- `500` — server or external API error

**Implementation notes:**
- This route is called in the background after save — never blocks the save flow
- Cache results in the `metadata` JSONB field — never fetch the same item twice
- If an external API is unavailable: return 200 with `{ enriched: false }` — silent graceful failure
- Log all enrichment failures with recommendation_id and category for debugging
