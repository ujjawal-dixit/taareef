import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import {
  GROQ_MODELS_URL,
  CONFIGURED_MODELS,
}                                     from '@/lib/constants/models'

// app/api/health/models/route.ts
//
// WHY THIS EXISTS (Session 15, 2026-07-26):
// On 2026-07-17 Groq shut down the vision model this app depended on.
// Screenshot capture was completely broken for nine days and nobody knew,
// because the failure surfaced to users as "couldn't read the screenshot"
// — indistinguishable from a blurry photo. Two more models were already
// scheduled for shutdown on 2026-08-16.
//
// This route asks Groq for its live model catalogue and checks that every
// model in CONFIGURED_MODELS is still listed. A retired model shows up here
// days or weeks before it starts failing in production.
//
// Runs daily via Vercel cron (see vercel.json). Can also be opened manually
// by a logged-in user at /api/health/models.

type ModelStatus = {
  id:        string
  powers:    string
  available: boolean
}

type HealthReport = {
  healthy:   boolean
  checked_at: string
  models:    ModelStatus[]
  missing:   string[]
}

/**
 * Allows the request if it is either Vercel's cron (which sends
 * `Authorization: Bearer $CRON_SECRET` when that env var is set) or a
 * logged-in user opening the URL directly.
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

/** Best-effort alert. Never throws — a failed email must not fail the check. */
async function sendAlert(missing: ModelStatus[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to     = process.env.FOUNDER_EMAIL
  if (!apiKey || !to) return

  const lines = missing
    .map(m => `• ${m.id} — powers ${m.powers}`)
    .join('\n')

  try {
    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Taareef <onboarding@resend.dev>',
        to:      [to],
        subject: `Taareef: ${missing.length} model(s) no longer available on Groq`,
        text:
          `The daily model health check found models that are no longer in Groq's catalogue.\n\n` +
          `${lines}\n\n` +
          `Update lib/constants/models.ts with the replacement IDs from ` +
          `https://console.groq.com/docs/deprecations and redeploy.\n`,
      }),
    })
  } catch (err) {
    console.error('[health/models] alert email failed:', err)
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorised(request))) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 503 })
  }

  let availableIds: Set<string>
  try {
    const res = await fetch(GROQ_MODELS_URL, {
      headers: { Authorization: `Bearer ${groqApiKey}` },
      cache:   'no-store',
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error(`[health/models] catalogue fetch failed status=${res.status} body=${detail.slice(0, 200)}`)
      return NextResponse.json(
        { error: `Could not reach Groq (status ${res.status})` }, { status: 502 }
      )
    }

    const json = await res.json() as { data?: Array<{ id?: string }> }
    availableIds = new Set((json.data ?? []).map(m => m.id).filter((id): id is string => Boolean(id)))
  } catch (err) {
    console.error('[health/models] catalogue fetch threw:', err)
    return NextResponse.json({ error: 'Could not reach Groq' }, { status: 502 })
  }

  const models: ModelStatus[] = CONFIGURED_MODELS.map(m => ({
    id:        m.id,
    powers:    m.powers,
    available: availableIds.has(m.id),
  }))

  const missing = models.filter(m => !m.available)

  const report: HealthReport = {
    healthy:    missing.length === 0,
    checked_at: new Date().toISOString(),
    models,
    missing:    missing.map(m => m.id),
  }

  if (missing.length > 0) {
    console.error(`[health/models] UNAVAILABLE: ${missing.map(m => m.id).join(', ')}`)
    await sendAlert(missing)
  } else {
    console.log(`[health/models] all ${models.length} models available`)
  }

  // 200 either way — the body carries the verdict. A non-200 would make
  // Vercel's cron dashboard report an infrastructure failure, which this
  // is not; the check itself ran fine.
  return NextResponse.json<HealthReport>(report)
}
