-- ============================================================================
-- TAAREEF · MEASUREMENT LAYER — VERIFICATION
-- Repo path: supabase/checks/verify_measurement.sql
--
-- WHAT THIS DOES:  Reads the current state. Changes nothing.
-- SAFE TO RE-RUN:  Yes. Always. As often as you like.
-- HOW TO RUN:      Paste the WHOLE file. It is ONE statement.
-- CORRECT OUTPUT:  Every row in the `status` column reads PASS.
-- ============================================================================

SELECT check_name, expected, found,
       CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT 'measurement tables exist'  AS check_name, '6' AS expected,
         (SELECT count(*)::text FROM pg_tables WHERE schemaname='public'
           AND tablename IN ('events','search_log','rollup_daily',
                             'rollup_card_monthly','rollup_enrichment','snapshot_weekly')) AS found,
         (SELECT count(*)=6 FROM pg_tables WHERE schemaname='public'
           AND tablename IN ('events','search_log','rollup_daily',
                             'rollup_card_monthly','rollup_enrichment','snapshot_weekly')) AS ok,
         1 AS sort

  UNION ALL SELECT 'events partitions (12 monthly + default)', '13',
         (SELECT count(*)::text FROM pg_inherits WHERE inhparent='events'::regclass),
         (SELECT count(*)=13 FROM pg_inherits WHERE inhparent='events'::regclass), 2

  UNION ALL SELECT 'events indexes (PK + one only)', '2',
         (SELECT count(*)::text FROM pg_indexes WHERE tablename='events'),
         (SELECT count(*)=2 FROM pg_indexes WHERE tablename='events'), 3

  UNION ALL SELECT 'new columns on recommendations', '2',
         (SELECT count(*)::text FROM information_schema.columns
           WHERE table_name='recommendations'
             AND column_name IN ('status_changed_at','last_opened_at')),
         (SELECT count(*)=2 FROM information_schema.columns
           WHERE table_name='recommendations'
             AND column_name IN ('status_changed_at','last_opened_at')), 4

  UNION ALL SELECT 'backfill: no saved row has a timestamp', '0',
         (SELECT count(*)::text FROM recommendations
           WHERE status='saved' AND status_changed_at IS NOT NULL),
         (SELECT count(*)=0 FROM recommendations
           WHERE status='saved' AND status_changed_at IS NOT NULL), 5

  UNION ALL SELECT 'backfill: no non-saved row is missing one', '0',
         (SELECT count(*)::text FROM recommendations
           WHERE status<>'saved' AND status_changed_at IS NULL),
         (SELECT count(*)=0 FROM recommendations
           WHERE status<>'saved' AND status_changed_at IS NULL), 6

  UNION ALL SELECT 'claim_anonymous_session exists', '1',
         (SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='claim_anonymous_session'),
         (SELECT count(*)=1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='claim_anonymous_session'), 7

  UNION ALL SELECT 'claim_anonymous_session is SECURITY DEFINER', 'true',
         (SELECT prosecdef::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='claim_anonymous_session'),
         (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='claim_anonymous_session'), 8

  UNION ALL SELECT 'pg_cron installed', '1',
         (SELECT count(*)::text FROM pg_extension WHERE extname='pg_cron'),
         (SELECT count(*)=1 FROM pg_extension WHERE extname='pg_cron'), 9

  UNION ALL SELECT 'RLS on all 6 measurement tables', '6',
         (SELECT count(*)::text FROM pg_class WHERE relrowsecurity
           AND relname IN ('events','search_log','rollup_daily',
                           'rollup_card_monthly','rollup_enrichment','snapshot_weekly')),
         (SELECT count(*)=6 FROM pg_class WHERE relrowsecurity
           AND relname IN ('events','search_log','rollup_daily',
                           'rollup_card_monthly','rollup_enrichment','snapshot_weekly')), 10

  UNION ALL SELECT 'recommendations untouched by all of this', '33',
         (SELECT count(*)::text FROM recommendations),
         (SELECT count(*)=33 FROM recommendations), 11

  UNION ALL SELECT 'old claim_anonymous_saves still present', '1',
         (SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='claim_anonymous_saves'),
         (SELECT count(*)=1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='claim_anonymous_saves'), 12
) t
ORDER BY sort;
