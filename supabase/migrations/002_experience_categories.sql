-- ============================================================
-- 002_experience_categories.sql
-- Taareef — Migrate to experience-based category system
-- Old: film, tv, music, book, restaurant, bar, city, activity, podcast, person
-- New: watch, listen, read, eat, drink, go, do, see
-- Run in Supabase SQL editor — safe to run once
-- ============================================================

-- Step 1: Add new enum values
ALTER TYPE category ADD VALUE IF NOT EXISTS 'watch';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'listen';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'read';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'eat';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'drink';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'go';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'do';
ALTER TYPE category ADD VALUE IF NOT EXISTS 'see';

-- Step 2: Migrate existing data
UPDATE recommendations SET category = 'watch' WHERE category IN ('film', 'tv');
UPDATE recommendations SET category = 'listen' WHERE category IN ('music', 'podcast');
UPDATE recommendations SET category = 'read'   WHERE category = 'book';
UPDATE recommendations SET category = 'eat'    WHERE category = 'restaurant';
UPDATE recommendations SET category = 'drink'  WHERE category = 'bar';
UPDATE recommendations SET category = 'go'     WHERE category = 'city';
UPDATE recommendations SET category = 'do'     WHERE category = 'activity';
UPDATE recommendations SET category = 'see'    WHERE category = 'person';

-- Step 3: Drop old status constraints
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS check_restaurant_status;
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS check_tv_status;
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS check_book_status;

-- Step 4: Add new status constraints
ALTER TABLE recommendations
  ADD CONSTRAINT check_watch_status
  CHECK (category != 'watch' OR status IN ('saved', 'experienced', 'dismissed'));

ALTER TABLE recommendations
  ADD CONSTRAINT check_listen_status
  CHECK (category != 'listen' OR status IN ('saved', 'experienced', 'dismissed'));

ALTER TABLE recommendations
  ADD CONSTRAINT check_read_status
  CHECK (category != 'read' OR status IN ('saved', 'reading', 'finished', 'abandoned', 'dismissed'));

ALTER TABLE recommendations
  ADD CONSTRAINT check_eat_status
  CHECK (category != 'eat' OR status IN ('saved', 'experienced', 'dismissed'));

ALTER TABLE recommendations
  ADD CONSTRAINT check_drink_status
  CHECK (category != 'drink' OR status IN ('saved', 'experienced', 'dismissed'));

ALTER TABLE recommendations
  ADD CONSTRAINT check_go_status
  CHECK (category != 'go' OR status IN ('saved', 'visited', 'dismissed'));

ALTER TABLE recommendations
  ADD CONSTRAINT check_do_status
  CHECK (category != 'do' OR status IN ('saved', 'done', 'dismissed'));

ALTER TABLE recommendations
  ADD CONSTRAINT check_see_status
  CHECK (category != 'see' OR status IN ('saved', 'experienced', 'dismissed'));
