-- ============================================================
-- 003_subtype_casing_fix.sql
-- Taareef — Normalize metadata.subtype casing to canonical lowercase
--
-- WHY THIS EXISTS (Session 14, 2026-07-22):
-- BACKLOG.md previously carried a different proposed migration that
-- remapped "retired" subtype names (song, book, manga, article, doc,
-- exhibition, concert, play, ride, class, experience) to canonical
-- values. That migration was verified against live production data
-- this session and found to fix NOTHING — none of those old values
-- exist in any row. It's kept in BACKLOG.md under "Superseded — do
-- not run" for the record, not deleted, so the false lead isn't lost.
--
-- The REAL, verified issue: canonical subtype values (defined in
-- VALID_SUBTYPES, app/api/capture/understand/route.ts, line ~66) are
-- all lowercase, but a handful of production rows have inconsistent
-- casing. Confirmed by directly querying:
--
--   SELECT category, metadata->>'subtype' as subtype, count(*)
--   FROM recommendations
--   GROUP BY category, metadata->>'subtype'
--   ORDER BY category;
--
-- Found (Session 14): "Film" (1 row, watch), "Adventure" (1 row, do),
-- "Bar" (2 rows, dine), "Viewpoint" (1 row, visit) — 5 rows total.
-- Lowercasing these makes them match VALID_SUBTYPES exactly and fixes
-- the filter-pill matching gap silently affecting these rows.
--
-- ACCOUNTABILITY (per Ujjawal's question, Session 14):
-- This file itself IS the accountability record — a numbered,
-- committed migration in supabase/migrations/, same pattern as
-- 001_initial_schema.sql and 002_experience_categories.sql already
-- in the repo. Run it via the Supabase SQL editor yourself (Option A
-- from the earlier discussion), then commit this exact file to the
-- repo so there's a permanent, dated record of what ran and why —
-- independent of anyone's memory of the conversation.
--
-- SAFE TO RUN: only touches rows where subtype casing actually
-- differs from lowercase. Preview first with the SELECT below.
-- ============================================================

-- STEP 1 — PREVIEW ONLY. Run this first and confirm the row count
-- and values match what's expected (5 rows, as of Session 14) before
-- running the UPDATE below.

SELECT id, category, metadata->>'subtype' AS current_subtype, title
FROM recommendations
WHERE metadata->>'subtype' IS NOT NULL
  AND metadata->>'subtype' != lower(metadata->>'subtype');

-- STEP 2 — THE ACTUAL FIX. Only run after confirming Step 1's output
-- looks right. Lowercases every subtype value that isn't already
-- lowercase; does nothing to rows that are already correct.

UPDATE recommendations
SET metadata = jsonb_set(metadata, '{subtype}', to_jsonb(lower(metadata->>'subtype')))
WHERE metadata->>'subtype' IS NOT NULL
  AND metadata->>'subtype' != lower(metadata->>'subtype');

-- STEP 3 — VERIFY. Should return zero rows if the fix worked.

SELECT id, category, metadata->>'subtype' AS remaining_bad_casing
FROM recommendations
WHERE metadata->>'subtype' IS NOT NULL
  AND metadata->>'subtype' != lower(metadata->>'subtype');
