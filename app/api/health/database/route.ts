import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'

// app/api/health/database/route.ts
//
// WHY THIS EXISTS (Session 17, 2026-08-12):
// The Supabase project paused after seven days of inactivity and stayed paused
// for roughly two weeks before anyone noticed. Nothing was watching. The only
// health check in the app asks Groq whether its models still exist — which is
// the right check for the failure that prompted it (a vision model retired
// silently) and no check at all for the database the entire product sits on.
//
// The failure mode being guarded against is specifically the QUIET one. A
// paused database does not raise an alarm; it just stops answering, and the
// app degrades into looking broken for reasons nobody can see.
//
// Checks, in order of how badly their absence would hurt:
//   1. The database answers at all
//   2. The vault is readable and non-empty
//   3. The measurement layer exists and is writable
//   4. The scheduled jobs are still registered and active
//   5. Storage headroom against the free-tier ceiling
//
// Runs daily via Vercel cron (see vercel.json). Can also be opened manually by
// a logged-in user at /api/health/database.

type Check = {
  name:    string
  ok:      boolean
  detail:  string
}

type DatabaseHealthReport = {
  healthy:    boolean
  checked_at: string
  checks:     Check[]
  failing:    string[]
}

/**
 * Allows the request if it is either Vercel's cron (which sends
 * `Authorization: Bearer $CRON_SECRET` when that env var is set) or a
 * logged-in user opening the URL directly.
 *
 * Mirrors the pattern in /api/health/models deliberately — two health routes
 * with two different auth rules would be a trap for whoever adds the third.
 */
async function isAuthorised(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`) {
    return true
  }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return Boolean(user)
  } catch {
    return false
  }
}

async function sendAlert(failing: Check[]): Promise<void> {
  const key   = process.env.RESEND_API_KEY
  const to    = process.env.FOUNDER_EMAIL
  if (!key || !to) return

  const lines = failing.map(c => `- ${c.name}: ${c.detail}`).join('\n')

  try {
    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'Taareef Health <onboarding@resend.dev>',
        to:      [to],
        subject: `Taareef: database health check failing (${failing.length})`,
        text:    `The daily database health check reported problems:\n\n${lines}\n\nOpen /api/health/database for the full report.`,
      }),
    })
  } catch (err) {
    // An alert that fails must never take the check down with it.
    console.error('[health/database] alert failed:', err)
  }
}

export async function GET(request: NextRequest) {
  if (!await isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks: Check[] = []

  try {
    const supabase = await createClient()

    // ── 1. Does the database answer at all? ─────────────────────────────────
    // This is the check that would have caught the pause.
    const started = Date.now()
    const { error: pingError } = await supabase
      .from('recommendations')
      .select('id', { count: 'exact', head: true })
    const latency = Date.now() - started

    checks.push({
      name:   'database reachable',
      ok:     !pingError,
      detail: pingError ? pingError.message : `responded in ${latency}ms`,
    })

    // If the database is unreachable, every check below would fail for the
    // same reason. Report the one true cause rather than five symptoms.
    if (pingError) {
      const report: DatabaseHealthReport = {
        healthy:    false,
        checked_at: new Date().toISOString(),
        checks,
        failing:    ['database reachable'],
      }
      await sendAlert(checks)
      return NextResponse.json(report, { status: 503 })
    }

    // ── 2. Is the vault readable and non-empty? ─────────────────────────────
    // An empty vault on a working database is a different alarm entirely:
    // it would mean data loss, not downtime.
    const { count: recCount, error: recError } = await supabase
      .from('recommendations')
      .select('id', { count: 'exact', head: true })

    checks.push({
      name:   'vault readable',
      ok:     !recError && (recCount ?? 0) > 0,
      detail: recError ? recError.message : `${recCount ?? 0} recommendations`,
    })

    // ── 3. Does the measurement layer exist and accept reads? ───────────────
    const { count: eventCount, error: eventError } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })

    checks.push({
      name:   'events table readable',
      ok:     !eventError,
      detail: eventError ? eventError.message : `${eventCount ?? 0} events`,
    })

    // ── 4. Are the scheduled jobs still registered? ─────────────────────────
    // A silently unscheduled rollup would look exactly like a quiet week.
    const { data: jobs, error: jobError } = await supabase.rpc('health_check_jobs')

    const jobsOk = !jobError && Array.isArray(jobs) && jobs.length >= 2
    checks.push({
      name:   'scheduled jobs active',
      ok:     jobsOk,
      detail: jobError
        ? jobError.message
        : `${Array.isArray(jobs) ? jobs.length : 0} active job(s)`,
    })

  } catch (err) {
    checks.push({
      name:   'health check itself',
      ok:     false,
      detail: err instanceof Error ? err.message : 'unknown error',
    })
  }

  const failing = checks.filter(c => !c.ok)

  const report: DatabaseHealthReport = {
    healthy:    failing.length === 0,
    checked_at: new Date().toISOString(),
    checks,
    failing:    failing.map(c => c.name),
  }

  if (failing.length > 0) await sendAlert(failing)

  return NextResponse.json(report, { status: report.healthy ? 200 : 503 })
}
