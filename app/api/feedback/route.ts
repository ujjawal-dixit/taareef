// app/api/feedback/route.ts
// Receives feedback from the FeedbackCard component.
// Sends directly to founder email via Resend.
// Free tier: 3,000 emails/month. No credit card required.
// Get your key at resend.com — add RESEND_API_KEY to Vercel env vars.
// Set FOUNDER_EMAIL to your personal email in Vercel env vars.

import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userEmail, userName, saveCount, topSource,
      type, tone, message,
    } = body

    if (!message?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Message is required' }, { status: 400 }
      )
    }

    const resendKey    = process.env.RESEND_API_KEY
    const founderEmail = process.env.FOUNDER_EMAIL

    // If Resend not configured yet — log and return success
    // So the UI still works even before you add the key
    if (!resendKey || !founderEmail) {
      console.log('[Feedback received — Resend not configured]', {
        from: userName, email: userEmail,
        type, tone, message, saveCount, topSource,
      })
      return NextResponse.json<ApiResponse<{ sent: boolean }>>(
        { data: { sent: true }, error: null }, { status: 200 }
      )
    }

    const typeLabel = type === 'new-feature' ? 'New feature suggestion' : 'Existing feature feedback'
    const toneLabel = tone === 'feeling'     ? 'Feeling / vibe'         : 'Specific'

    const emailBody = `
<div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; color: #1a1a1a; padding: 32px 24px;">

  <p style="font-size: 28px; font-style: italic; font-weight: 300; color: #080f0a; margin: 0 0 8px;">
    taareef feedback
  </p>

  <p style="font-size: 13px; color: #888; margin: 0 0 32px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
    From <strong>${userName}</strong> (${userEmail}) · ${saveCount} saves${topSource ? ` · mostly from ${topSource}` : ''}
  </p>

  <table style="width: 100%; margin-bottom: 24px;">
    <tr>
      <td style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #999; padding-bottom: 6px; width: 50%;">Type</td>
      <td style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #999; padding-bottom: 6px;">Tone</td>
    </tr>
    <tr>
      <td style="font-size: 14px; color: #333; font-weight: 500;">${typeLabel}</td>
      <td style="font-size: 14px; color: #333; font-weight: 500;">${toneLabel}</td>
    </tr>
  </table>

  <div style="background: #f8f7f4; border-left: 3px solid #1fce94; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 32px;">
    <p style="font-size: 15px; color: #1a1a1a; line-height: 1.65; margin: 0; font-style: italic;">
      "${message}"
    </p>
  </div>

  <p style="font-size: 11px; color: #bbb; text-align: center; margin: 0;">
    taareef · beta feedback
  </p>

</div>
    `.trim()

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'taareef feedback <feedback@taareef.app>',
        to:      [founderEmail],
        subject: `[taareef] ${typeLabel} from ${userName}`,
        html:    emailBody,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Feedback] Resend error:', err)
      // Still return success to user — don't expose email config errors
    }

    return NextResponse.json<ApiResponse<{ sent: boolean }>>(
      { data: { sent: true }, error: null }, { status: 200 }
    )

  } catch (err) {
    console.error('[Feedback] Unexpected error:', err)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Something went wrong' }, { status: 500 }
    )
  }
}
