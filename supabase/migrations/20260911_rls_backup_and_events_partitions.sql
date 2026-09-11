-- Enable Row Level Security on 14 tables that were created without it:
-- public.recommendations_backup and 13 partitions of public.events.
--
-- Verified before writing this (2026-09-11):
--   - Zero references to any of these 14 table names anywhere in app/ or lib/
--     (grep across the repo) -- the app only ever queries the parent
--     `events` table and `recommendations`, never a partition or the backup
--     table directly.
--   - Zero existing policies on any of the 14 tables (pg_policies).
--   - restore_from_backup() and cleanup_anonymous_users() are SECURITY
--     DEFINER, owned by `postgres` -- RLS does not apply to a table's
--     owner, so enabling RLS here does not affect them.
--
-- Without this, the public anon key (shipped in every client bundle by
-- design) could read or write every row in these tables directly via the
-- Supabase REST API, bypassing the app entirely -- including
-- recommendations_backup, which holds full historical snapshots of the
-- private vault.

-- recommendations_backup: internal safety net only, never queried by the
-- app. No client-facing policy -> anon/authenticated get nothing.
alter table public.recommendations_backup enable row level security;

-- events partitions: mirror the parent table's own-row policies exactly,
-- so behaviour is identical whether Postgres routes through the parent
-- `events` table or a partition is queried directly.
do $$
declare
  t text;
begin
  foreach t in array array[
    'events_default','events_2026_08','events_2026_09','events_2026_10',
    'events_2026_11','events_2026_12','events_2027_01','events_2027_02',
    'events_2027_03','events_2027_04','events_2027_05','events_2027_06','events_2027_07'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists events_insert_own on public.%I', t);
    execute format(
      'create policy events_insert_own on public.%I for insert to authenticated with check (user_id = auth.uid())', t
    );
    execute format('drop policy if exists events_select_own on public.%I', t);
    execute format(
      'create policy events_select_own on public.%I for select to authenticated using (user_id = auth.uid())', t
    );
  end loop;
end $$;
