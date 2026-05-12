-- ============================================================
-- 001_initial_schema.sql
-- Taareef V1 — Core schema
-- Run once in the Supabase SQL editor on project initialisation.
-- DO NOT modify after applying to production.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search (V2)

-- ============================================================
-- ENUMS
-- ============================================================

-- 10 categories — locked. No additions without explicit approval.
CREATE TYPE category AS ENUM (
  'restaurant',
  'bar',
  'film',
  'tv',
  'music',
  'book',
  'city',
  'activity',
  'podcast',
  'person'
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
  -- Category-specific constraints added in separate migration files per category
  -- Pattern: ALTER TABLE recommendations ADD CONSTRAINT check_restaurant_status
  --   CHECK (category != 'restaurant' OR status IN ('saved', 'experienced', 'dismissed'));
  status          TEXT NOT NULL DEFAULT 'saved',

  -- Metadata
  priority        priority NOT NULL DEFAULT 'medium',
  reaction        reaction,              -- NULL until experienced
  metadata        JSONB NOT NULL DEFAULT '{}',  -- enrichment data, shape varies by category

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
