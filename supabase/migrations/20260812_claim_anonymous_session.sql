-- ============================================================================
-- TAAREEF · ANONYMOUS SESSION TRANSFER
-- Repo path: supabase/migrations/20260812_claim_anonymous_session.sql
-- Run in:    Supabase SQL Editor (project tcuyfrcmjrtczneklhmx)
-- Spec:      KB-MEASUREMENT_SPEC.md §7 · KB-MEASUREMENT_DECISIONS.md F1
--
-- WHY THIS EXISTS
-- `claim_anonymous_saves` contains:
--     IF source_count = 0 OR source_count > 3 THEN RETURN 0;
-- Both branches are correct for saves and wrong for events:
--   · = 0  — a browse-and-leave session has no saves and is the most
--            interesting session there is
--   · > 3  — an enthusiastic first session loses its entire event history
--
-- SAFETY PROPERTY
-- For RECOMMENDATIONS this function produces byte-identical outcomes to
-- `claim_anonymous_saves` in every case. The only behavioural difference is
-- that events and search_log now travel too. Nothing that moves today stops
-- moving; nothing that is refused today is accepted.
--
-- `claim_anonymous_saves` is left in place and untouched. Do not delete it
-- until this function has been proven in production.
-- ============================================================================


-- ============================================================================
-- PART 1 — Enable pg_cron
-- ============================================================================
-- Omitted from the previous delivery in error. Required before any scheduled
-- job (nightly rollup, weekly snapshot) can exist.

CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ============================================================================
-- PART 2 — claim_anonymous_session
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_anonymous_session(anon_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user     uuid := auth.uid();
  target_is_anon  boolean;
  source_is_anon  boolean;
  source_created  timestamptz;
  rec_count       integer;
  event_count     integer;
  search_count    integer;
  moved_recs      integer := 0;
  moved_events    integer := 0;
  moved_searches  integer := 0;
BEGIN
  -- ── GUARD 1 — there must be a signed-in target ───────────────────────────
  -- Verbatim from claim_anonymous_saves.
  IF target_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_target');
  END IF;

  -- ── GUARD 2 — the target must be a real account, not another anon ────────
  SELECT is_anonymous INTO target_is_anon FROM auth.users WHERE id = target_user;
  IF target_is_anon IS TRUE THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'target_is_anonymous');
  END IF;

  -- ── GUARD 3 — source and target must differ ──────────────────────────────
  IF anon_user_id = target_user THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'same_user');
  END IF;

  -- ── GUARD 4 — the source must genuinely be an anonymous account ──────────
  SELECT is_anonymous, created_at
    INTO source_is_anon, source_created
    FROM auth.users
   WHERE id = anon_user_id;

  IF source_is_anon IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'source_not_anonymous');
  END IF;

  -- ── GUARD 5 — the source must be recent (2 hours) ────────────────────────
  -- Stops someone claiming an arbitrary historical anonymous account.
  IF source_created IS NULL OR source_created < now() - interval '2 hours' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'source_too_old');
  END IF;

  SELECT count(*) INTO rec_count    FROM public.recommendations WHERE user_id = anon_user_id;
  SELECT count(*) INTO event_count  FROM public.events          WHERE user_id = anon_user_id;
  SELECT count(*) INTO search_count FROM public.search_log      WHERE user_id = anon_user_id;

  -- ── GUARD 6a — recommendation cap, UNCHANGED from the original ───────────
  -- The original refused > 3. Preserved exactly. Note the deliberate change:
  -- rec_count = 0 no longer aborts, because a zero-save session may still
  -- carry the events we most want.
  IF rec_count > 3 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'too_many_recommendations');
  END IF;

  -- ── GUARD 6b — event cap, sized for events rather than saves ─────────────
  IF event_count > 500 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'too_many_events');
  END IF;

  -- ── GUARD 7 — nothing to do ──────────────────────────────────────────────
  IF rec_count = 0 AND event_count = 0 AND search_count = 0 THEN
    RETURN jsonb_build_object('ok', true, 'recommendations', 0, 'events', 0, 'searches', 0);
  END IF;

  -- ── TRANSFER — one transaction. Both or neither. ─────────────────────────
  -- Saves moving while events do not would leave the two permanently
  -- disagreeing, which is worse than moving neither.

  UPDATE public.recommendations SET user_id = target_user WHERE user_id = anon_user_id;
  GET DIAGNOSTICS moved_recs = ROW_COUNT;

  -- user_id is not the partition key (local_date is), so this does not move
  -- rows between partitions.
  UPDATE public.events SET user_id = target_user WHERE user_id = anon_user_id;
  GET DIAGNOSTICS moved_events = ROW_COUNT;

  UPDATE public.search_log SET user_id = target_user WHERE user_id = anon_user_id;
  GET DIAGNOSTICS moved_searches = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'recommendations', moved_recs,
    'events',          moved_events,
    'searches',        moved_searches
  );
END;
$function$;

COMMENT ON FUNCTION public.claim_anonymous_session(uuid) IS
  'Transfers an anonymous session (recommendations + events + search_log) to the signed-in account, atomically. Replaces claim_anonymous_saves, whose count guard silently dropped zero-save sessions. See KB-MEASUREMENT_DECISIONS.md F1.';

GRANT EXECUTE ON FUNCTION public.claim_anonymous_session(uuid) TO authenticated;


-- ============================================================================
-- TESTS — run these after the parts above
-- ============================================================================
-- NOTE: auth.uid() returns NULL in the SQL Editor (no authenticated session).
-- Tests 2–4 simulate a session with set_config inside a rolled-back
-- transaction, so nothing below changes any data.

-- ── TEST 1 — the function exists and pg_cron is installed ────────────────────
SELECT
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'claim_anonymous_session') AS fn_exists,
  (SELECT count(*) FROM pg_extension WHERE extname = 'pg_cron')           AS cron_installed;
-- CORRECT: fn_exists = 1, cron_installed = 1
-- BROKEN:  either is 0 — a part above failed; re-read the error, do not re-run blindly


-- ── TEST 2 — Guard 1 fires with no session ──────────────────────────────────
SELECT public.claim_anonymous_session('00000000-0000-0000-0000-000000000001'::uuid);
-- CORRECT: {"ok": false, "reason": "no_target"}
-- BROKEN:  anything with "ok": true — the function is running without an
--          authenticated caller, which would be a serious security failure


-- ── TEST 3 — Guard 4 fires for a non-anonymous source ───────────────────────
-- Simulates a signed-in real user trying to claim another REAL account.
BEGIN;
  SELECT set_config(
    'request.jwt.claims',
    json_build_object('sub', (SELECT id FROM auth.users WHERE is_anonymous IS NOT TRUE ORDER BY created_at LIMIT 1))::text,
    true
  );
  SELECT public.claim_anonymous_session(
    (SELECT id FROM auth.users WHERE is_anonymous IS NOT TRUE ORDER BY created_at DESC LIMIT 1)
  );
ROLLBACK;
-- CORRECT: {"ok": false, "reason": "source_not_anonymous"}
--          (or "same_user" if only one real account exists — also a pass)
-- BROKEN:  "ok": true — a real account's data could be stolen by another user


-- ── TEST 4 — Guard 5 fires for a stale anonymous account ────────────────────
-- All 12 existing anonymous users are far older than 2 hours, so this MUST refuse.
BEGIN;
  SELECT set_config(
    'request.jwt.claims',
    json_build_object('sub', (SELECT id FROM auth.users WHERE is_anonymous IS NOT TRUE ORDER BY created_at LIMIT 1))::text,
    true
  );
  SELECT public.claim_anonymous_session(
    (SELECT id FROM auth.users WHERE is_anonymous IS TRUE ORDER BY created_at LIMIT 1)
  );
ROLLBACK;
-- CORRECT: {"ok": false, "reason": "source_too_old"}
-- BROKEN:  "ok": true — the 2-hour window is not being enforced and any
--          historical anonymous account could be claimed


-- ── TEST 5 — nothing was mutated by the tests ───────────────────────────────
SELECT
  (SELECT count(*) FROM recommendations) AS recs,
  (SELECT count(*) FROM events)          AS events,
  (SELECT count(*) FROM search_log)      AS searches;
-- CORRECT: recs = 33, events = 0, searches = 0
-- BROKEN:  recs <> 33 — a test transaction committed instead of rolling back


-- ============================================================================
-- END-TO-END TEST (in the app, AFTER track.ts is wired)
-- ============================================================================
-- This is the only test that proves the real path. Run it once wiring lands.
--
--  1. Open the app in a private window. Do NOT sign in.
--  2. Browse a category and open a card. Do NOT save anything.
--     → This is the exact case the old function dropped.
--  3. Sign in with Google.
--  4. Run:  SELECT kind, count(*) FROM events
--             WHERE user_id = '<your real user id>'
--             GROUP BY kind;
--
--  CORRECT: app_opened / category_viewed / card_opened rows are present under
--           the REAL user id, with zero recommendations transferred.
--  BROKEN:  events exist under an anonymous user id that no longer signs in —
--           the transfer did not fire, and first-session data is being orphaned.
