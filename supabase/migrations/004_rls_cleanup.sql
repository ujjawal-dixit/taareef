-- ============================================================
-- 004_rls_cleanup.sql
-- Taareef — Remove duplicate RLS policies, retarget to `authenticated`
--
-- STEP 1 of the anonymous-auth build.
--
-- WHY (Session 15, 2026-07-27):
-- A live audit of pg_policies found `recommendations` carrying EIGHT
-- policies where four would do. Two migrations each created a full set
-- under different names:
--     recs_select_own          ≡  recommendations_select_own
--     recs_insert_own          ≡  recommendations_insert_own
--     recs_update_own          ≡  recommendations_update_own
--     recs_delete_own          ≡  recommendations_delete_own
-- Verified identical: same command, same USING / WITH CHECK expression
-- (auth.uid() = user_id), both PERMISSIVE. Dropping one set changes
-- access for nobody.
--
-- This matters now because anonymous users are about to exist. More
-- policies means more surface to reason about incorrectly, and RLS is
-- the only thing standing between a bug and cross-user data access.
--
-- Second change: every policy currently targets the `public` role.
-- That is safe today — auth.uid() is NULL for unauthenticated requests,
-- so nothing matches — but `authenticated` is the correct target and
-- states the intent explicitly. Anonymous users in Supabase use the
-- `authenticated` role too, so this does not exclude them.
--
-- WHAT THIS DOES NOT DO:
-- Not a single row is read, written or deleted. This changes only who
-- may access rows, never the rows themselves. A CSV export would not
-- protect against a mistake here — verification queries would. Both are
-- included below.
--
-- HOW TO RUN — follow DATA_SAFETY.md section 1:
--   1. Run STEP 0 and read the output
--   2. Run STEP 1 (dry run — ends in ROLLBACK, changes nothing)
--   3. Run STEP 2 (the real change)
--   4. Run STEP 3 and confirm the expected counts
--   5. Open Taareef and load your vault — a broken policy looks like
--      an empty screen, not an error
--   6. Commit this file to supabase/migrations/
-- ============================================================


-- ============================================================
-- STEP 0 — PREVIEW. Read-only. Run this first.
-- Expect: 11 rows. 8 on recommendations, 3 on user_preferences.
-- Every roles value should read {public}.
-- ============================================================

SELECT tablename, policyname, cmd, roles::text, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ============================================================
-- STEP 1 — DRY RUN. Executes everything, then undoes it.
-- Proves the statements are valid. Changes nothing.
-- Expect: the SELECT inside to show 7 policies, all {authenticated}.
-- ============================================================

BEGIN;

  DROP POLICY IF EXISTS recs_select_own ON public.recommendations;
  DROP POLICY IF EXISTS recs_insert_own ON public.recommendations;
  DROP POLICY IF EXISTS recs_update_own ON public.recommendations;
  DROP POLICY IF EXISTS recs_delete_own ON public.recommendations;

  ALTER POLICY recommendations_select_own ON public.recommendations TO authenticated;
  ALTER POLICY recommendations_insert_own ON public.recommendations TO authenticated;
  ALTER POLICY recommendations_update_own ON public.recommendations TO authenticated;
  ALTER POLICY recommendations_delete_own ON public.recommendations TO authenticated;

  ALTER POLICY prefs_select_own ON public.user_preferences TO authenticated;
  ALTER POLICY prefs_insert_own ON public.user_preferences TO authenticated;
  ALTER POLICY prefs_update_own ON public.user_preferences TO authenticated;

  SELECT tablename, policyname, roles::text
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;

ROLLBACK;


-- ============================================================
-- STEP 2 — THE REAL CHANGE. Only run after STEP 1 succeeded.
--
-- ALTER POLICY is used rather than DROP + CREATE deliberately: it
-- changes the role in place, so there is never an instant where the
-- table sits unprotected.
-- ============================================================

BEGIN;

  DROP POLICY IF EXISTS recs_select_own ON public.recommendations;
  DROP POLICY IF EXISTS recs_insert_own ON public.recommendations;
  DROP POLICY IF EXISTS recs_update_own ON public.recommendations;
  DROP POLICY IF EXISTS recs_delete_own ON public.recommendations;

  ALTER POLICY recommendations_select_own ON public.recommendations TO authenticated;
  ALTER POLICY recommendations_insert_own ON public.recommendations TO authenticated;
  ALTER POLICY recommendations_update_own ON public.recommendations TO authenticated;
  ALTER POLICY recommendations_delete_own ON public.recommendations TO authenticated;

  ALTER POLICY prefs_select_own ON public.user_preferences TO authenticated;
  ALTER POLICY prefs_insert_own ON public.user_preferences TO authenticated;
  ALTER POLICY prefs_update_own ON public.user_preferences TO authenticated;

COMMIT;


-- ============================================================
-- STEP 3 — VERIFICATION. All three must pass.
-- ============================================================

-- 3a. Expect exactly 7 rows, every roles value {authenticated}.
--     4 on recommendations, 3 on user_preferences.
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3b. Expect zero rows. Any survivor means a DROP silently missed.
SELECT policyname
FROM pg_policies
WHERE schemaname = 'public' AND policyname LIKE 'recs\_%';

-- 3c. Expect rls_enabled = true for all three tables.
--     api_usage correctly has zero policies — it is written through a
--     security definer function. Do not add one.
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       (SELECT count(*) FROM pg_policies p
        WHERE p.tablename = c.relname AND p.schemaname = 'public') AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;


-- ============================================================
-- ROLLBACK PLAN
-- If the app cannot read the vault after STEP 2, restore the previous
-- state by recreating the dropped duplicates. Access is governed by the
-- recommendations_* set, so this is a belt-and-braces restore rather
-- than a true revert.
--
--   CREATE POLICY recs_select_own ON public.recommendations
--     FOR SELECT TO public USING (auth.uid() = user_id);
--   CREATE POLICY recs_insert_own ON public.recommendations
--     FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
--   CREATE POLICY recs_update_own ON public.recommendations
--     FOR UPDATE TO public USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);
--   CREATE POLICY recs_delete_own ON public.recommendations
--     FOR DELETE TO public USING (auth.uid() = user_id);
-- ============================================================
