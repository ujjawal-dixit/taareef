-- ============================================================
-- 006_claim_anonymous_saves.sql
-- Taareef — Move an anonymous session's saves to the account that
--           just signed in.
--
-- WHY THIS REPLACES IDENTITY LINKING (Session 15, 2026-07-28):
-- The first attempt used supabase.auth.linkIdentity() to attach a
-- Google identity to the anonymous user, keeping one user id so nothing
-- needed moving. Verified against auth.identities: it never once
-- succeeded. Three anonymous users exist, all with identity_count = 0.
--
-- Two structural reasons, not bugs:
--   1. It is a redirect flow. Errors surface after the browser has
--      left, so a client-side error check can never catch them.
--   2. It cannot work at all when the Google account already has a
--      Taareef vault — that identity belongs to another user. This is
--      a normal case, not an edge case.
--
-- The failure was silent and looked like success: the visitor stayed
-- anonymous, saw their one demo card, and believed they were signed in.
--
-- THIS APPROACH INSTEAD:
-- Always sign in normally — the path that already works. Then move the
-- rows. There is no conflict case: a new account receives the card, an
-- existing vault gains the card. Same code path, both correct.
--
-- WHY SECURITY DEFINER RATHER THAN THE SERVICE ROLE KEY:
-- Moving a row between users means writing a row the caller does not
-- own, which RLS forbids. The alternative is SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS everywhere and appears nowhere in this codebase
-- today. A narrow function with explicit guards is a far smaller grant
-- of power than a key that can do anything.
--
-- THE GUARDS, and what each one prevents:
--   1. Caller must be authenticated      — no anonymous claiming
--   2. Caller must not be anonymous      — only a real account receives
--   3. Cannot claim yourself             — no-op protection
--   4. Source must be anonymous          — a real user's vault can
--                                          never be claimed
--   5. Source must hold <= 3 saves       — matches the demo cap, so a
--                                          large vault is out of scope
--   6. Source created within 2 hours     — a stale or guessed id fails
--
-- Residual risk, stated plainly: someone who knows an anonymous user's
-- exact UUID, within two hours, could claim up to three demo cards.
-- Low value, hard to obtain, and bounded. Accepted knowingly.
--
-- IDEMPOTENT: after a successful move the source holds zero rows, so
-- running it again moves zero. Safe to call twice.
--
-- HOW TO RUN — DATA_SAFETY.md section 1. This one DOES touch rows, so
-- take a CSV export first (SELECT * FROM recommendations, Download CSV).
-- ============================================================


-- ============================================================
-- STEP 0 — PREVIEW. Read-only.
-- Shows every anonymous user and what they hold.
-- Expect: 3 rows, two holding 1 save each.
-- ============================================================

SELECT u.id,
       u.created_at,
       (SELECT count(*) FROM public.recommendations r WHERE r.user_id = u.id) AS saves
FROM auth.users u
WHERE u.is_anonymous IS TRUE
ORDER BY u.created_at DESC;


-- ============================================================
-- STEP 1 — DRY RUN. Creates the function, then undoes it.
-- Expect: no errors.
-- ============================================================

BEGIN;

  CREATE OR REPLACE FUNCTION public.claim_anonymous_saves(anon_user_id uuid)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  DECLARE
    target_user     uuid := auth.uid();
    target_is_anon  boolean;
    source_is_anon  boolean;
    source_created  timestamptz;
    source_count    integer;
    moved_count     integer;
  BEGIN
    -- Guard 1: caller must be signed in.
    IF target_user IS NULL THEN
      RETURN 0;
    END IF;

    -- Guard 2: only a real account may receive saves.
    SELECT is_anonymous INTO target_is_anon FROM auth.users WHERE id = target_user;
    IF target_is_anon IS TRUE THEN
      RETURN 0;
    END IF;

    -- Guard 3: claiming yourself is a no-op.
    IF anon_user_id = target_user THEN
      RETURN 0;
    END IF;

    -- Guard 4 and 6: source must be anonymous and recent.
    SELECT is_anonymous, created_at
      INTO source_is_anon, source_created
      FROM auth.users
     WHERE id = anon_user_id;

    IF source_is_anon IS NOT TRUE THEN
      RETURN 0;
    END IF;

    IF source_created IS NULL OR source_created < now() - interval '2 hours' THEN
      RETURN 0;
    END IF;

    -- Guard 5: only a demo-sized set, matching the cap in migration 005.
    SELECT count(*) INTO source_count
      FROM public.recommendations
     WHERE user_id = anon_user_id;

    IF source_count = 0 OR source_count > 3 THEN
      RETURN 0;
    END IF;

    UPDATE public.recommendations
       SET user_id = target_user
     WHERE user_id = anon_user_id;

    GET DIAGNOSTICS moved_count = ROW_COUNT;
    RETURN moved_count;
  END;
  $$;

  REVOKE ALL ON FUNCTION public.claim_anonymous_saves(uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.claim_anonymous_saves(uuid) TO authenticated;

ROLLBACK;


-- ============================================================
-- STEP 2 — THE REAL CHANGE. Only after STEP 1 succeeded.
-- ============================================================

BEGIN;

  CREATE OR REPLACE FUNCTION public.claim_anonymous_saves(anon_user_id uuid)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  DECLARE
    target_user     uuid := auth.uid();
    target_is_anon  boolean;
    source_is_anon  boolean;
    source_created  timestamptz;
    source_count    integer;
    moved_count     integer;
  BEGIN
    IF target_user IS NULL THEN
      RETURN 0;
    END IF;

    SELECT is_anonymous INTO target_is_anon FROM auth.users WHERE id = target_user;
    IF target_is_anon IS TRUE THEN
      RETURN 0;
    END IF;

    IF anon_user_id = target_user THEN
      RETURN 0;
    END IF;

    SELECT is_anonymous, created_at
      INTO source_is_anon, source_created
      FROM auth.users
     WHERE id = anon_user_id;

    IF source_is_anon IS NOT TRUE THEN
      RETURN 0;
    END IF;

    IF source_created IS NULL OR source_created < now() - interval '2 hours' THEN
      RETURN 0;
    END IF;

    SELECT count(*) INTO source_count
      FROM public.recommendations
     WHERE user_id = anon_user_id;

    IF source_count = 0 OR source_count > 3 THEN
      RETURN 0;
    END IF;

    UPDATE public.recommendations
       SET user_id = target_user
     WHERE user_id = anon_user_id;

    GET DIAGNOSTICS moved_count = ROW_COUNT;
    RETURN moved_count;
  END;
  $$;

  COMMENT ON FUNCTION public.claim_anonymous_saves(uuid) IS
    'Moves a recent anonymous session''s demo saves to the account that just signed in. Called only from the OAuth callback. Guards: caller authenticated and not anonymous, source anonymous, source under 2 hours old, source holding 1-3 saves. Idempotent.';

  REVOKE ALL ON FUNCTION public.claim_anonymous_saves(uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.claim_anonymous_saves(uuid) TO authenticated;

COMMIT;


-- ============================================================
-- STEP 3 — VERIFICATION.
-- ============================================================

-- 3a. Expect one row, prosecdef = true.
SELECT proname, prosecdef
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'claim_anonymous_saves';

-- 3b. Expect `authenticated=X/postgres` in the ACL, and no `=X/` entry
--     for PUBLIC — only signed-in users may execute it.
SELECT proname, proacl::text
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'claim_anonymous_saves';

-- 3c. Guard proof. Run as the SQL editor (no auth.uid()), so this must
--     return 0 — an unauthenticated caller can never claim anything.
SELECT public.claim_anonymous_saves('00000000-0000-0000-0000-000000000000'::uuid) AS must_be_zero;


-- ============================================================
-- ROLLBACK PLAN
--   DROP FUNCTION IF EXISTS public.claim_anonymous_saves(uuid);
-- Removing it restores the previous behaviour exactly: demo saves stay
-- with the anonymous user and are not transferred.
-- ============================================================
