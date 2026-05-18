-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$ BEGIN
  CREATE TYPE category AS ENUM ('restaurant','bar','film','tv','music','book','city','activity','podcast','person');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('friend','family','colleague','instagram','twitter','youtube','article','newsletter','podcast','self');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE reaction AS ENUM ('loved','good','okay','skip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS recommendations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  category     category NOT NULL,
  source_type  source_type NOT NULL,
  source_name  TEXT NOT NULL,
  url          TEXT,
  image_url    TEXT,
  notes        TEXT,
  location     JSONB,
  status       TEXT NOT NULL DEFAULT 'saved',
  priority     priority NOT NULL DEFAULT 'medium',
  reaction     reaction,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recs_user_status   ON recommendations (user_id, status);
CREATE INDEX IF NOT EXISTS idx_recs_user_category ON recommendations (user_id, category);
CREATE INDEX IF NOT EXISTS idx_recs_user_created  ON recommendations (user_id, created_at DESC);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recs_select_own" ON recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recs_insert_own" ON recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recs_update_own" ON recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recs_delete_own" ON recommendations FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recommendations_updated_at ON recommendations;
CREATE TRIGGER recommendations_updated_at BEFORE UPDATE ON recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS user_preferences (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_categories   TEXT[] NOT NULL DEFAULT '{}',
  nudge_answered_count INTEGER NOT NULL DEFAULT 0,
  onboarding_complete  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prefs_select_own" ON user_preferences;
DROP POLICY IF EXISTS "prefs_insert_own" ON user_preferences;
DROP POLICY IF EXISTS "prefs_update_own" ON user_preferences;
CREATE POLICY "prefs_select_own" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prefs_insert_own" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prefs_update_own" ON user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
