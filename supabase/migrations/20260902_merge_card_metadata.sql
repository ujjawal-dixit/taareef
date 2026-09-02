-- 20260902_merge_card_metadata.sql
--
-- DDL ONLY (T18). Applied to production 2026-09-02. This file is the record of
-- what was run — it was written AFTER the fact, which is itself the lesson
-- below.
--
-- ⚠️ NOT YET USED BY ANY CODE. Adopting it is Session 19 work.
--
-- HOW IT CAME TO EXIST
-- Created while rebuilding a fix that had already been written and pushed as
-- PR #19 (see G20, second instance). The duplicate TypeScript was discarded;
-- this function was left running in production with no migration file and no
-- reference in any document. It was found at session close by asking "is the
-- doc update actually complete", not by any check.
--
-- The lesson is recorded in DATA_SAFETY.md: applying DDL and writing its
-- migration file are one action, not two. A function the database has and the
-- repo does not is how a future session comes to distrust the repo.
--
-- WHAT IT DOES
-- Merges a jsonb patch into recommendations.metadata INSIDE Postgres, so
-- sequential writes in one request cannot clobber each other from a stale
-- JavaScript snapshot. `||` is a shallow merge: keys in p_patch win, every
-- other existing key survives.
--
-- WHY IT IS STILL WORTH KEEPING
-- PR #19 solved the same problem with a TypeScript accumulator (MetaWriter),
-- which carries running state forward within one request. That is sufficient
-- for the bug we had — three defects caused by one function writing twice from
-- one snapshot.
--
-- This is strictly stronger: it cannot lose a CONCURRENT write from a different
-- request, which the accumulator can. Enrichment and a user edit landing in the
-- same second is rare today and will not stay rare.
--
-- SECURITY DEFINER is deliberately NOT used. The function runs as the caller,
-- so row-level security still applies, and p_user_id is checked explicitly as
-- well — ownership enforced twice rather than trusted once.
--
-- Verified on a scratch table before being applied: an earlier write survives a
-- later one, the later write applies, and pre-existing keys are preserved.

CREATE OR REPLACE FUNCTION merge_card_metadata(
  p_id      uuid,
  p_user_id uuid,
  p_patch   jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  merged jsonb;
BEGIN
  UPDATE recommendations
     SET metadata = COALESCE(metadata, '{}'::jsonb) || p_patch
   WHERE id = p_id
     AND user_id = p_user_id
  RETURNING metadata INTO merged;

  -- NULL means no row matched: wrong id, or not the caller's row. The caller
  -- can distinguish "merged nothing" from "merged onto empty".
  RETURN merged;
END;
$$;

COMMENT ON FUNCTION merge_card_metadata(uuid, uuid, jsonb) IS
  'Merges a jsonb patch into recommendations.metadata inside the database, so '
  'sequential writes in one request cannot clobber each other from a stale '
  'JavaScript snapshot. Created Session 18; not yet called by application code.';
