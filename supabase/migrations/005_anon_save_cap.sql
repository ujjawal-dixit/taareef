-- ============================================================
-- 005_anon_save_cap.sql
-- Taareef — Cap how many recommendations an anonymous session may save
--
-- STEP 3 of the anonymous-auth build.
--
-- WHY (Session 15, 2026-07-27):
-- The onboarding demo is about to create a real, silent anonymous
-- session so a visitor's first save actually persists and enriches.
-- That means an unauthenticated stranger can write rows to the
-- database. Without a limit, the demo endpoint is a URL anyone can
-- script against — not to steal anything (RLS still confines each
-- session to its own rows), but to fill the table and burn enrichment
-- budget.
--
-- A demo needs one save. Three is generous.
--
-- HOW IT WORKS:
-- Supabase gives anonymous users the `authenticated` role, and marks
-- them with an `is_anonymous` claim in the JWT. This adds a RESTRICTIVE
-- policy, which is ANDed with the existing permissive ones — so it can
-- only ever take permission away, never grant it.
--
-- Permanent users are unaffected: the claim is false (or absent, for
-- older sessions), so the first branch is true and the cap is skipped.
--
-- WHY A FUNCTION RATHER THAN A SUBQUERY:
-- Counting rows in `recommendations` from inside a policy ON
-- `recommendations` re-triggers RLS and recurses. A `security definer`
-- function bypasses RLS and breaks the loop. This mirrors the existing
-- `increment_api_usage` pattern already in this database.
--
-- WHAT THIS DOES NOT DO:
-- No rows are read, written or deleted. This only changes who may
-- insert. Verification queries are the guard here, not an export.
--
-- HOW TO RUN — DATA_SAFETY.md section 1:
--   1. Run STEP 0, read the output
--   2. Run STEP 1 (dry run, ends in ROLLBACK)
--   3. Run STEP 2 (the real change)
--   4. Run STEP 3, confirm the expected results
--   5. Open Taareef and save something — you are a permanent user, so
--      the cap must not apply to you
--   6. Commit this file to supabase/migrations/
-- ============================================================


-- ============================================================
-- STEP 0 — PREVIEW. Read-only.
-- Expect: 7 policies, all {authenticated}, all PERMISSIVE.
-- No policy named recommendations_anon_save_cap yet.
-- ============================================================

SELECT tablename, policyname, cmd, permissive, roles::text
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ============================================================
-- STEP 1 — DRY RUN. Runs everything, then undoes it.
-- Expect: no errors. The SELECT should show 8 policies.
-- ============================================================

BEGIN;

  CREATE OR REPLACE FUNCTION public.current_user_save_count()
  RETURNS integer
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
  AS $$
    SELECT count(*)::integer
    FROM public.recommendations
    WHERE user_id = auth.uid();
  $$;

  CREATE POLICY recommendations_anon_save_cap
  ON public.recommendations
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    OR public.current_user_save_count() < 3
  );

  SELECT tablename, policyname, cmd, permissive
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;

ROLLBACK;


-- ============================================================
-- STEP 2 — THE REAL CHANGE. Only after STEP 1 succeeded.
-- ============================================================

BEGIN;

  CREATE OR REPLACE FUNCTION public.current_user_save_count()
  RETURNS integer
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
  AS $$
    SELECT count(*)::integer
    FROM public.recommendations
    WHERE user_id = auth.uid();
  $$;

  COMMENT ON FUNCTION public.current_user_save_count() IS
    'Counts the calling user''s recommendations, bypassing RLS. Exists to let the anonymous save-cap policy count rows without recursing into its own policy. Do not call from application code.';

  CREATE POLICY recommendations_anon_save_cap
  ON public.recommendations
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    OR public.current_user_save_count() < 3
  );

COMMIT;


-- ============================================================
-- STEP 3 — VERIFICATION. All three must pass.
-- ============================================================

-- 3a. Expect 8 policies. Exactly one RESTRICTIVE, named
--     recommendations_anon_save_cap, on INSERT.
SELECT tablename, policyname, cmd, permissive, roles::text
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3b. Expect one row: the function exists and is SECURITY DEFINER
--     (prosecdef = true).
SELECT proname, prosecdef
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'current_user_save_count';

-- 3c. Expect your real save count (19 at time of writing).
--     If this errors, the function is wrong — stop and do not
--     rely on the cap.
SELECT public.current_user_save_count() AS your_save_count;


-- ============================================================
-- ROLLBACK PLAN
-- Removing the cap restores exactly the previous behaviour.
--
--   DROP POLICY IF EXISTS recommendations_anon_save_cap
--     ON public.recommendations;
--   DROP FUNCTION IF EXISTS public.current_user_save_count();
-- ============================================================
