// app/api/feedback/route.ts
// Receives feedback. Sends beautiful formatted email to founder via Resend.
// Works without Resend key (logs to console) so UI never breaks.

import { NextResponse } from 'next/server'

const MODE_DETAILS: Record<string, { emoji: string; colour: string }> = {
  'delighted':       { emoji: '✦', colour: '#1fce94' },
  'frustrated':      { emoji: '◌', colour: '#c8151e' },
  'want-something':  { emoji: '→', colour: '#b87820' },
  'thought':         { emoji: '◦', colour: '#888'    },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userEmail, userName, saveCount, topSource, mode, modeLabel, message } = body

    if (!message?.trim()) {
      return NextResponse.json({ data: null, error: 'Message required' }, { status: 400 })
    }

    const resendKey    = process.env.RESEND_API_KEY
    const founderEmail = process.env.FOUNDER_EMAIL
    const details      = MODE_DETAILS[mode] ?? { emoji: '◦', colour: '#888' }

    if (!resendKey || !founderEmail) {
      console.log('\n━━━ taareef feedback ━━━')
      console.log(`From:    ${userName} <${userEmail}>`)
      console.log(`Mode:    ${modeLabel}`)
      console.log(`Saves:   ${saveCount}${topSource ? ` · top source: ${topSource}` : ''}`)
      console.log(`Message: ${message}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━\n')
      return NextResponse.json({ data: { sent: true }, error: null }, { status: 200 })
    }

    const context = topSource && saveCount >= 5
      ? `${saveCount} saves · mostly from ${topSource}`
      : `${saveCount} save${saveCount === 1 ? '' : 's'}`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d1910;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
  <tr><td style="padding:40px 32px 0;">

    <!-- Header -->
    <p style="font-size:11px;font-family:system-ui,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#1fce94;margin:0 0 6px;">
      taareef · beta feedback
    </p>
    <h1 style="font-size:32px;font-weight:300;font-style:italic;color:#f0e6c8;margin:0 0 4px;letter-spacing:-0.01em;">
      ${details.emoji} ${modeLabel}
    </h1>
    <p style="font-size:13px;color:rgba(240,230,200,0.45);font-family:system-ui,sans-serif;margin:0 0 32px;">
      ${userName} · ${userEmail} · ${context}
    </p>

    <!-- Divider -->
    <div style="height:0.5px;background:linear-gradient(to right,${details.colour}88,${details.colour}22,transparent);margin-bottom:28px;"></div>

    <!-- Message -->
    <div style="border-left:3px solid ${details.colour};padding:16px 20px;background:rgba(240,230,200,0.03);border-radius:0 10px 10px 0;margin-bottom:32px;">
      <p style="font-size:16px;color:rgba(240,230,200,0.90);line-height:1.7;margin:0;font-style:italic;">
        "${message}"
      </p>
    </div>

    <!-- Footer -->
    <p style="font-size:11px;font-family:system-ui,sans-serif;color:rgba(240,230,200,0.20);text-align:center;margin:0 0 40px;">
      reply directly to this email to respond to ${userName.split(' ')[0]}
    </p>

  </td></tr>
</table>
</body>
</html>`.trim()

    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        from:       'taareef <feedback@taareef.app>',
        to:         [founderEmail],
        reply_to:   userEmail,
        subject:    `${details.emoji} ${modeLabel} — ${userName}`,
        html,
      }),
    })

    return NextResponse.json({ data: { sent: true }, error: null }, { status: 200 })

  } catch (err) {
    console.error('[Feedback]', err)
    return NextResponse.json({ data: null, error: 'Something went wrong' }, { status: 500 })
  }
}
