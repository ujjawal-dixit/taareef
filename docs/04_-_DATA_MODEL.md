# DATA_MODEL.md — Taareef Database Schema
> ⚠️ Updated Session 8: Category system migrated from 8 to 6 categories.
> The Supabase production database was updated directly via SQL editor (not a migration file).
> See KB-FILEMAP.md for the exact SQL that was applied.

> Complete PostgreSQL + Supabase schema.
> Every table, enum, index, RLS policy, and trigger.
> This is the canonical reference — Claude Code generates migrations from this file.

---

## Critical Design Decision: Status Is Not A Global Enum

Status states in Taareef are **category-specific**. A restaurant has different valid states from a TV show, a book, or a podcast. Rather than a global status enum that forces all categories into the same states, the `status` column is `TEXT` with category-specific check constraints added as each category is built.

This means:
- Do NOT create a PostgreSQL `status` enum
- The `status` column defaults to `'saved'` for all categories
- Category-specific constraints are added in separate migration files per category
- When building a new category, refer to that category's spec in BACKLOG.md for its valid states

---

## PostgreSQL Enums

```sql
-- 6 categories — locked as of Session 8. Migrated from 8 in Session 8.
-- eat+drink → dine | see → visit | go removed
-- WARNING: The production database already has these values.
-- The old values (restaurant, bar, film, tv, music, book, city, activity, podcast, person)
-- still exist as enum values in Postgres but are no longer used.
-- DO NOT recreate this enum from scratch — it will conflict with production.
CREATE TYPE category AS ENUM (
  'watch',     -- films, series, documentaries
  'listen',    -- albums, songs, podcasts, artists
  'read',      -- books (fiction, non-fiction, poetry)
  'dine',      -- restaurants, bars, cafes, street food
  'do',        -- hikes, adventures, rides
  'visit'      -- exhibitions, concerts, plays, galleries
);

-- Source types — where the recommendation came from
CREATE TYPE source_type AS ENUM (
  'friend',
  'family',
  'colleague',
  'instagram',
  'twitter',
  'youtube',
  'article',
  'newsletter',
  'podcast',
  'self'
);

-- Reaction — 4 options, set only after a recommendation is experienced
-- NOT set at save time. NULL until experienced.
CREATE TYPE reaction AS ENUM (
  'loved',
  'good',
  'okay',
  'skip'
);

-- Priority
CREATE TYPE priority AS ENUM (
  'low',
  'medium',
  'high'
);
```

---

## V1 Migration — `001_initial_schema.sql`

```sql
-- ============================================================
-- 001_initial_schema.sql
-- Taareef V1 — Core schema
-- Run once on project initialisation
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search (V2)

-- ============================================================
-- ENUMS
-- ============================================================

-- NOTE: Production DB was migrated in Session 8 via direct SQL.
-- The migration file below reflects the ORIGINAL schema.
-- The Session 8 migration SQL is documented separately.
CREATE TYPE category AS ENUM (
  'watch', 'listen', 'read', 'dine', 'do', 'visit'
);

CREATE TYPE source_type AS ENUM (
  'friend', 'family', 'colleague', 'instagram', 'twitter',
  'youtube', 'article', 'newsletter', 'podcast', 'self'
);

CREATE TYPE reaction AS ENUM ('loved', 'good', 'okay', 'skip');

CREATE TYPE priority AS ENUM ('low', 'medium', 'high');

-- ============================================================
-- RECOMMENDATIONS — Primary entity
-- ============================================================

CREATE TABLE recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core fields
  title           TEXT NOT NULL,
  category        category NOT NULL,
  source_type     source_type NOT NULL,
  source_name     TEXT NOT NULL,         -- "Arjun", "Bon Appétit", "that NYT piece"

  -- Optional enrichment
  url             TEXT,
  image_url       TEXT,
  notes           TEXT,                  -- user's own note (set at detail view, not save time)

  -- Location (for physical places)
  location        JSONB,                 -- { city, country, address, lat, lng }

  -- Status — category-specific, TEXT not enum
  -- Default is 'saved' for all categories
  -- Category-specific constraints added in separate migrations
  status          TEXT NOT NULL DEFAULT 'saved',

  -- Metadata
  priority        priority NOT NULL DEFAULT 'medium',
  reaction        reaction,              -- NULL until experienced
  metadata        JSONB NOT NULL DEFAULT '{}',  -- enrichment data

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Optimised for the most common query patterns
-- ============================================================

-- Most common: list by user + status filter
CREATE INDEX idx_recommendations_user_status
  ON recommendations (user_id, status);

-- Category view
CREATE INDEX idx_recommendations_user_category
  ON recommendations (user_id, category);

-- Default sort: newest first
CREATE INDEX idx_recommendations_user_created
  ON recommendations (user_id, created_at DESC);

-- Source name lookup (People Layer — V3)
CREATE INDEX idx_recommendations_source_name
  ON recommendations (user_id, source_name);

-- Full-text search (V2 — index created now, used in V2)
CREATE INDEX idx_recommendations_fts
  ON recommendations
  USING GIN (
    to_tsvector('english',
      COALESCE(title, '') || ' ' ||
      COALESCE(source_name, '') || ' ' ||
      COALESCE(notes, '')
    )
  );

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own recommendations
CREATE POLICY "recommendations_select_own"
  ON recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own recommendations
CREATE POLICY "recommendations_insert_own"
  ON recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own recommendations
CREATE POLICY "recommendations_update_own"
  ON recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own recommendations
-- Note: soft delete preferred (set status='dismissed') — hard delete is a last resort
CREATE POLICY "recommendations_delete_own"
  ON recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- V2 TABLES (commented out — run in 002_v2_schema.sql)
-- ============================================================

-- Multi-source stacking: additional sources for one recommendation
-- (The primary source lives on the recommendation; this captures additional sources)
--
-- CREATE TABLE recommendation_sources (
--   id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
--   source_type       source_type NOT NULL,
--   source_name       TEXT NOT NULL,
--   added_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
--
-- ALTER TABLE recommendation_sources ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "sources_select_own"
--   ON recommendation_sources FOR SELECT
--   USING (
--     auth.uid() = (
--       SELECT user_id FROM recommendations WHERE id = recommendation_id
--     )
--   );
--
-- CREATE POLICY "sources_insert_own"
--   ON recommendation_sources FOR INSERT
--   WITH CHECK (
--     auth.uid() = (
--       SELECT user_id FROM recommendations WHERE id = recommendation_id
--     )
--   );


-- ============================================================
-- V3 TABLES (commented out — run in 003_v3_schema.sql)
-- ============================================================

-- Collections: user-curated groupings of recommendations
--
-- CREATE TABLE collections (
--   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   name        TEXT NOT NULL,
--   description TEXT,
--   is_public   BOOLEAN NOT NULL DEFAULT FALSE,
--   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
--
-- CREATE TABLE collection_items (
--   id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   collection_id     UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
--   recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
--   added_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   UNIQUE (collection_id, recommendation_id)
-- );
--
-- CREATE TRIGGER collections_updated_at
--   BEFORE UPDATE ON collections
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--
-- ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
--
-- [Full RLS policies in 003_v3_schema.sql]

-- Tags
--
-- CREATE TABLE tags (
--   id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   name    TEXT NOT NULL,
--   color   TEXT,
--   UNIQUE (user_id, name)
-- );
--
-- CREATE TABLE recommendation_tags (
--   recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
--   tag_id            UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
--   PRIMARY KEY (recommendation_id, tag_id)
-- );
```

---

## Metadata JSON Schema By Category

The `metadata` JSONB column stores enrichment data from external APIs. The shape varies by category.

### Films / TV (`film`, `tv`)
```json
{
  "tmdb_id": 496243,
  "poster_path": "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "overview": "A synopsis from TMDB",
  "release_year": 2019,
  "genres": ["Thriller", "Drama"],
  "rating": 8.5,
  "runtime_minutes": 132,
  "streaming_on": ["Netflix", "Prime"]
}
```

### Music (`music`)
```json
{
  "spotify_id": "2UpltiCBTuuDGHQHXsKhV6",
  "artist": "Tame Impala",
  "album": "Currents",
  "artwork_url": "https://i.scdn.co/image/...",
  "preview_url": "https://p.scdn.co/mp3-preview/...",
  "release_year": 2015,
  "listen_count": 4
}
```
Note: `listen_count` increments each time the user taps "Listened again." This is the music exception — not a single experienced state.

### Restaurant / Bar (`restaurant`, `bar`)
```json
{
  "google_place_id": "ChIJ...",
  "address": "16, Keluskar Rd, Shivaji Park",
  "city": "Mumbai",
  "phone": "+91 22 2430 1234",
  "website": "https://example.com",
  "price_level": 2,
  "cuisine": "Italian",
  "opening_hours": ["Mon-Fri: 12pm-11pm", "Sat-Sun: 11am-11pm"]
}
```

### Book (`book`)
```json
{
  "isbn": "9780571258062",
  "author": "Kazuo Ishiguro",
  "cover_url": "https://covers.openlibrary.org/...",
  "publisher": "Faber & Faber",
  "year": 1989,
  "goodreads_id": "28921,
  "progress_percent": null
}
```
Note: `progress_percent` is set when the user updates reading progress. Part of the "currently reading" state — deferred for per-category discussion.

### City / Activity (`city`, `activity`)
```json
{
  "description": "A brief description",
  "best_season": "October to March",
  "suggested_duration": "3-4 days",
  "coordinates": { "lat": 35.6762, "lng": 139.6503 }
}
```

### Podcast (`podcast`)
```json
{
  "podcast_name": "Acquired",
  "episode_title": "LVMH",
  "feed_url": "https://feeds.transistor.fm/acquired",
  "artwork_url": "https://...",
  "episode_number": 202,
  "duration_minutes": 247
}
```

### Person / Creator (`person`)
```json
{
  "platform": "instagram",
  "handle": "@username",
  "url": "https://instagram.com/username",
  "specialty": "Food and travel photographer",
  "follower_count": null
}
```

---

## Category-Specific Status Constraints

Added as separate migration files when each category is built. Pattern:

```sql
-- Example: restaurant status constraint (added in 002_restaurant_statuses.sql)
ALTER TABLE recommendations
  ADD CONSTRAINT check_restaurant_status
  CHECK (
    category != 'restaurant' OR
    status IN ('saved', 'experienced', 'dismissed')
  );

-- Example: TV show status constraint (added when TV is built)
ALTER TABLE recommendations
  ADD CONSTRAINT check_tv_status
  CHECK (
    category != 'tv' OR
    status IN ('saved', 'watching', 'finished', 'abandoned', 'dismissed')
  );

-- Example: book status constraint (added when books are built)
ALTER TABLE recommendations
  ADD CONSTRAINT check_book_status
  CHECK (
    category != 'book' OR
    status IN ('saved', 'reading', 'finished', 'abandoned', 'dismissed')
  );
```

Each category's valid statuses are determined when that category is built and discussed. The base migration only establishes the `status TEXT NOT NULL DEFAULT 'saved'` column.

---

## Location JSONB Schema

```json
{
  "city": "Mumbai",
  "country": "India",
  "address": "16 Keluskar Rd, Shivaji Park, Dadar West",
  "lat": 19.0178,
  "lng": 72.8478
}
```

All fields optional. For non-physical categories (music, podcasts, people), location is null.

---

## Design Rationale

**Why JSONB for metadata?**
Each category needs different enrichment fields. A single typed table would require nullable columns for every possible field across all categories — messy and hard to extend. JSONB gives flexibility per category while keeping the core schema clean. The shape per category is documented above and enforced at the application layer.

**Why soft delete?**
Users who dismiss a recommendation may want to revisit that decision. Soft delete (status='dismissed') keeps the record for Taareef Wrapped and People Layer analytics while removing it from the active vault view. Hard delete is available but discouraged.

**Why TEXT for status instead of enum?**
Status states are fundamentally different per category. A global status enum would either be too restrictive (missing category-specific states) or too permissive (allowing invalid states for a given category). TEXT with category-specific check constraints gives both flexibility and validation where it matters.

**Why is reaction separate from status?**
Status tracks where a recommendation is in its lifecycle (saved → experienced). Reaction tracks how the user felt about it after experiencing it. They are different dimensions. A recommendation can be experienced with any reaction — the two fields are independent.
