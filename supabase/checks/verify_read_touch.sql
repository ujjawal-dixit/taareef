-- verify_read_touch.sql
--
-- VERIFICATION ONLY (T18). Run AFTER
-- 20260819_read_touch_does_not_bump_updated_at.sql.
--
-- Run the whole file in one execution. The last statement is the results
-- table, so the Supabase editor shows it. An earlier draft ended in ROLLBACK
-- and would have displayed nothing — the editor shows only the final result.
--
-- WHAT THIS TESTS
-- The REAL update_updated_at() function, attached to a scratch table. Not a
-- copy of it, and not the real recommendations table. A copy would prove
-- nothing about what is deployed; the real table should not be written to just
-- to satisfy a test. A scratch table gets both.
--
-- Nothing here reads, writes or locks recommendations. The scratch objects are
-- dropped at the end and the drop is verified.

DROP TABLE IF EXISTS verify_read_touch_scratch;

CREATE TABLE verify_read_touch_scratch (
  id             int PRIMARY KEY,
  title          text,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  last_opened_at timestamptz
);

-- The real trigger function, under test.
CREATE TRIGGER verify_read_touch_trg
  BEFORE UPDATE ON verify_read_touch_scratch
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- A row whose updated_at is clearly in the past, so "unchanged" and
-- "restamped" cannot be mistaken for each other.
INSERT INTO verify_read_touch_scratch (id, title, updated_at)
VALUES (1, 'before', now() - interval '5 days');

CREATE TEMP TABLE vrt_base ON COMMIT DROP AS
SELECT updated_at AS u0 FROM verify_read_touch_scratch WHERE id = 1;

-- Branch 1 — a read mark alone must NOT move updated_at.
UPDATE verify_read_touch_scratch SET last_opened_at = now() WHERE id = 1;

CREATE TEMP TABLE vrt_read ON COMMIT DROP AS
SELECT updated_at AS u1, last_opened_at AS o1
FROM verify_read_touch_scratch WHERE id = 1;

-- Branch 2 — a genuine edit MUST move updated_at.
UPDATE verify_read_touch_scratch SET title = 'after' WHERE id = 1;

CREATE TEMP TABLE vrt_edit ON COMMIT DROP AS
SELECT updated_at AS u2 FROM verify_read_touch_scratch WHERE id = 1;

-- Branch 3 — a read mark AND an edit together must still move updated_at.
UPDATE verify_read_touch_scratch
SET title = 'after again', last_opened_at = now() WHERE id = 1;

CREATE TEMP TABLE vrt_both ON COMMIT DROP AS
SELECT updated_at AS u3 FROM verify_read_touch_scratch WHERE id = 1;

DROP TABLE verify_read_touch_scratch;

-- One result set. Every check arrives together, or the editor hides some.
SELECT 'read touch preserves updated_at' AS check,
       CASE WHEN (SELECT u1 FROM vrt_read) = (SELECT u0 FROM vrt_base)
            THEN 'PASS' ELSE 'FAIL' END AS status
UNION ALL
SELECT 'read touch does write last_opened_at',
       CASE WHEN (SELECT o1 FROM vrt_read) IS NOT NULL
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'real edit still moves updated_at',
       CASE WHEN (SELECT u2 FROM vrt_edit) > (SELECT u0 FROM vrt_base)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
-- Compared against u0, NOT u2. now() is transaction-start time, so every
-- statement in this file shares one timestamp: u3 > u2 can never be true here
-- however correct the function is. Comparing to the 5-day-old baseline asks
-- the real question — did the stamp move at all.
SELECT 'edit + read mark together still moves updated_at',
       CASE WHEN (SELECT u3 FROM vrt_both) > (SELECT u0 FROM vrt_base)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'scratch table dropped',
       CASE WHEN to_regclass('public.verify_read_touch_scratch') IS NULL
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'recommendations untouched (35 expected)',
       count(*)::text FROM recommendations
UNION ALL
SELECT 'empty string is still not a uuid (N1 premise)',
       CASE WHEN pg_input_is_valid('', 'uuid') = false
            THEN 'PASS' ELSE 'FAIL' END;
