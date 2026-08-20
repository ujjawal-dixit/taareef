-- 20260819_read_touch_does_not_bump_updated_at.sql
--
-- DDL ONLY (T18). Verification lives in
-- supabase/checks/verify_read_touch.sql and is run separately, AFTER this.
--
-- WHY
-- recommendations.last_opened_at has been NULL on every row since it was added
-- in Session 17, because nothing ever wrote to it. Session 18 wires the write
-- into trackCardOpened — but recommendations carries a BEFORE UPDATE trigger
-- that stamps updated_at on any update at all. Wiring the write without this
-- change would mean every card OPEN bumped updated_at, and updated_at is:
--
--   · the only proxy the vault has for "when was this last edited"
--   · the column status_changed_at was backfilled from in Session 17 (R01)
--
-- A read that is indistinguishable from a write is a corrupted column, and it
-- would have corrupted quietly, which is the kind this project keeps meeting.
--
-- WHAT CHANGES
-- update_updated_at() now compares the row to itself, ignoring updated_at and
-- last_opened_at. If nothing else differs, the touch is a read: updated_at is
-- preserved rather than restamped. Every genuine edit behaves exactly as
-- before. The rule is written generically (a set of "read-marking" columns)
-- so last_read_at, last_viewed_at or similar inherit it without a second
-- migration and a second chance to forget.
--
-- BLAST RADIUS
-- This function is attached to recommendations only (verified: one non-internal
-- trigger on the table). Replacing it changes no data. It is reversible by
-- restoring the two-line body.
--
-- ORDERING
-- Run this BEFORE merging the code that writes last_opened_at. In the other
-- order, every card open between deploy and migration silently bumps
-- updated_at, and those bumps cannot be told apart from real edits afterwards.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  -- Columns that record that a row was LOOKED AT, never that it changed.
  read_marks text[] := ARRAY['last_opened_at'];
  before_row jsonb;
  after_row  jsonb;
  col        text;
BEGIN
  before_row := to_jsonb(OLD) - 'updated_at';
  after_row  := to_jsonb(NEW) - 'updated_at';

  FOREACH col IN ARRAY read_marks LOOP
    before_row := before_row - col;
    after_row  := after_row  - col;
  END LOOP;

  IF before_row = after_row THEN
    -- Nothing changed but a read mark. Not an edit; leave the edit clock alone.
    NEW.updated_at := OLD.updated_at;
  ELSE
    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at() IS
  'Stamps updated_at on real edits only. An update that changes nothing but a '
  'read-marking column (last_opened_at) preserves updated_at, so a read is '
  'never mistaken for an edit. Session 18.';
