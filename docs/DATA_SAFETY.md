# DATA_SAFETY.md — Taareef

> How we avoid losing or corrupting data. Milestone-triggered, not calendar-driven — a reminder that fires monthly when you have one user is noise you learn to ignore.
> Claude reads this each session and flags any trigger that has been crossed.
> Last updated: Session 16 — 2026-08-10

---

## 1. Pre-flight checklist for any destructive SQL

Applies to anything containing `DROP`, `UPDATE`, `DELETE`, `ALTER`, or `TRUNCATE`. This is tenet **T3** made operational.

**Before running:**

- [ ] **Preview.** Run a `SELECT` that returns exactly the rows or objects the statement will affect. Read the output. Does the count match what was expected?
- [ ] **Export, if rows are affected.** Not needed for policy-only changes — see the note below.
- [ ] **Transaction test.** Wrap the statement in `BEGIN;` … `ROLLBACK;` and run it. This proves it executes without error and changes nothing.
- [ ] **Read the file.** Confirm the migration says what you think it says.

**After running:**

- [ ] **Verification query.** Prove the intended state — and that nothing beyond the intent changed.
- [ ] **Smoke test the app.** Open Taareef, load the vault, save something. Policy changes don't announce themselves; a broken one looks like an empty screen.
- [ ] **Commit the migration file** to `supabase/migrations/` with its number. The folder is the record of everything ever done to this database.

**Match the guard to the risk — this matters more than following a ritual:**

| Migration type | Real risk | Right guard |
|---|---|---|
| `UPDATE` / `DELETE` on rows | Data loss or corruption | CSV export **and** preview |
| `DROP POLICY` / `ALTER POLICY` | Losing access, or exposing data | Verification queries; an export protects against neither |
| `CREATE TABLE` / `ADD COLUMN` | Almost none — additive | Preview optional |
| Enum changes | Hard to reverse in Postgres | Discuss before writing |

---

## 2. Milestone triggers

Not dates. Conditions. When one is crossed, the requirement changes permanently.

| Trigger | What becomes required | Status |
|---|---|---|
| **Any migration that touches rows** | CSV export first, no exceptions | Active |
| **First non-founder user saves anything** | Weekly CSV export begins | Not yet crossed — 2 user_ids exist in production, both belonging to the founder |
| **More than 10 users** | Upgrade to Supabase Pro. Free tier has **no automated backups** — acceptable while it's only test data, not once other people's vaults are involved | Not yet crossed |
| **Anonymous auth enabled** | Cleanup job for abandoned anonymous sessions must exist before, not after | Not yet crossed |
| **First real Google Places spend** | Review the 1,000/month enrichment cap | Not yet crossed |
| **App published to Production** | Open sign-up — revisit abuse controls and the enrichment cap together | Not yet crossed |

---

## 3. Scenario register

Ten ways data could be lost or corrupted, ordered by actual likelihood rather than drama.

**1. Operator error in a migration — the largest risk by far.**
A `DROP` or `UPDATE` with a wrong `WHERE` is instant and irreversible. Mitigation: the checklist in section 1.

**2. Expiring external URLs — CONFIRMED LIVE, Session 16.**
Google Places photo URLs are signed and expire. They were stored as permanent `image_url` values. Verified: 6 cards already dead, 0 recoverable because `photo_ref` was never kept, 14 TMDB URLs unaffected. Every new Dine/Visit/Do save still plants a photo that will die. Mitigation shipped is containment only — cards now fall back to the motif instead of showing a broken image. The cure is BACKLOG Priority 9.

**3. Enrichment overwriting user-set data.**
Live and specific to this codebase. The pipeline writes `image_url` and `metadata` after a save; a bad run could overwrite a photo the user chose manually. Mitigation: enrichment must never overwrite a user-set field. **Not yet audited — open item.**

**3. Free-tier project pause after ~1 week of inactivity.**
Data survives; the app appears broken. Mitigation: Pro, or regular use.

**4. Project deletion after prolonged inactivity.**
Real on free tier. Mitigation: Pro, or exports.

**5. A write path missing its `user_id` filter.**
RLS is the only thing standing between a bug and cross-user data access — which is exactly why policy migrations get verified, not assumed.

**6. Supabase infrastructure failure.**
Low probability, but with no backups on free tier it is unrecoverable. Mitigation: Pro provides daily backups.

**7. Accidental project deletion in the dashboard.**
Rare, catastrophic, entirely human.

**8. Orphaned anonymous-user data.**
A risk we are about to introduce. Someone demos, saves, never signs in. Acceptable by design — but the cleanup job must only remove genuinely abandoned sessions.

**9. Identity-linking conflict.**
Anonymous user signs into a Google account that already has a vault. Linking fails. A naive implementation strands the demo save. Mitigation: explicit graceful path in the build.

**10. Credential compromise.**
Lowest. `SUPABASE_SERVICE_ROLE_KEY` is not referenced anywhere in the codebase — the app runs on the anon key plus RLS, so the exposed surface is small.

---

## 3b. Silent unavailability — added Session 16

The project paused after ~2 weeks of inactivity and nobody knew. The health-check cron at `/api/health/models` checks **Groq's model catalogue and not the database**, so the one failure that took the whole product down was the one it could not see.

Extending it to ping Supabase is a small change to a route that already exists, and it belongs near the top of the list.

---

## 4. Current state — verified 2026-08-10

- Database: **ACTIVE_HEALTHY**, `ap-south-1`, restored after an inactivity pause
- **32 recommendations · 16 users · 12 of them anonymous · 8 policies · 3 functions**
- **12 orphaned anonymous users** — the cleanup job named as a prerequisite before enabling anonymous auth was never built
- 6 cards holding expired Places URLs; 4 carrying the placeholder source name `"Someone"`
- Backups: **still none** (free tier)

---

## 4b. Previous state — verified 2026-07-27

- Database size: **11 MB of 500 MB** (~2%)
- Rows: **19 recommendations**, ~1 KB each
- Users: **3 total, 0 anonymous**
- RLS: **enabled on all three tables**
- `api_usage`: RLS enabled, **zero policies — this is intentional.** It is written through a `security definer` function which bypasses RLS by design. Do not "fix" this by adding a policy.
- Backups: **none** (free tier)
- Known gap: `user_preferences` has select/insert/update policies but **no delete policy** — users cannot delete their preferences. Probably harmless; noted rather than changed.

---

## 5. Review

Revisit this file whenever a trigger in section 2 is crossed, and at minimum when the first real beta user joins.
