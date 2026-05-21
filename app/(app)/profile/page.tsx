// app/(app)/profile/page.tsx
// Fixed:
// 1. Back button at TOP — not bottom. Neon, 44px target.
// 2. SIGN OUT at bottom — completely separated from back button.
// 3. All queries run in parallel via Promise.all — eliminates latency.
// 4. Top source computed from already-fetched data — no extra query.

import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { SignOutButton }  from './sign-out-button'
import { ProfileClient } from './profile-client'
import Link              from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile · taareef' }

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // All queries in parallel — eliminates sequential waterfall latency
  const [savedResult, experiencedResult, sourcesResult] = await Promise.all([
    supabase
      .from('recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'dismissed'),
    supabase
      .from('recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'saved')
      .neq('status', 'dismissed'),
    supabase
      .from('recommendations')
      .select('source_name')
      .eq('user_id', user.id)
      .neq('status', 'dismissed'),
  ])

  const savedCount      = savedResult.count      ?? 0
  const experiencedCount = experiencedResult.count ?? 0

  // Top source from already-fetched data — no extra round-trip
  const counts: Record<string, number> = {}
  sourcesResult.data?.forEach(r => {
    counts[r.source_name] = (counts[r.source_name] ?? 0) + 1
  })
  const topSource = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const name   = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'You'
  const email  = user.email ?? ''
  const avatar = user.user_metadata?.avatar_url ?? null

  return (
    <div style={{
      maxWidth:      '430px',
      margin:        '0 auto',
      minHeight:     '100dvh',
      background:    '#080f0a',
      paddingBottom: '120px',
    }}>

      {/* ── BACK TO VAULT — top left, always ──────────────── */}
      {/*
        This is the correct position. Profile is reached via the nav bar.
        The way back is a clear top-left back button — not a bottom bar
        that sits beside sign out and creates accidental tap risk.
      */}
      <div style={{ padding: '52px 20px 0' }}>
        <Link
          href="/dashboard"
          aria-label="Back to vault"
          style={{
            display:                 'inline-flex',
            alignItems:              'center',
            gap:                     '5px',
            color:                   '#1fce94',
            fontFamily:              'var(--f-body)',
            fontSize:                '12px',
            fontWeight:              500,
            letterSpacing:           '0.04em',
            textDecoration:          'none',
            textShadow:              '0 0 10px rgba(31,206,148,0.40)',
            minHeight:               '44px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          vault
        </Link>
      </div>

      {/* ── AVATAR + NAME ─────────────────────────────────── */}
      <header style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        {avatar ? (
          <img src={avatar} alt={name} style={{
            width: '68px', height: '68px', borderRadius: '50%',
            border: '1.5px solid rgba(31,206,148,0.28)',
            margin: '0 auto 14px', display: 'block', objectFit: 'cover',
          }} />
        ) : (
          <div style={{
            width: '68px', height: '68px', borderRadius: '50%',
            border: '1.5px solid rgba(31,206,148,0.18)',
            background: 'rgba(31,206,148,0.05)',
            margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="rgba(31,206,148,0.45)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
        )}

        <h1 style={{
          fontFamily:    'var(--f-display)',
          fontWeight:    400, fontStyle: 'italic',
          fontSize:      '26px', letterSpacing: '-0.01em',
          color:         'rgba(240,230,200,0.95)', margin: '0 0 4px',
        }}>
          {name}
        </h1>
        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize:   '12px', color: 'rgba(240,230,200,0.30)',
        }}>
          {email}
        </p>

        <div style={{
          height: '0.5px', margin: '18px auto',
          maxWidth: '80px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.30), transparent)',
        }} />
      </header>

      {/* ── STATS ─────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px' }}>
        {[
          { n: savedCount,       label: 'saved'       },
          { n: experiencedCount, label: 'experienced' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center',
            background: 'rgba(240,230,200,0.03)',
            border: '1px solid rgba(240,230,200,0.07)',
            borderRadius: '14px', padding: '16px 12px',
          }}>
            <div style={{
              fontFamily:   'var(--f-display)',
              fontWeight:   400, fontStyle: 'italic',
              fontSize:     '34px', lineHeight: 1,
              color:        '#1fce94',
              textShadow:   '0 0 18px rgba(31,206,148,0.45)',
              marginBottom: '4px',
            }}>
              {s.n}
            </div>
            <div style={{
              fontFamily:    'var(--f-ui)',
              fontSize:      '9px', fontWeight: 700,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              color:         'rgba(240,230,200,0.30)',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height:'0.5px', margin:'0 20px 20px', background:'rgba(240,230,200,0.05)' }} />

      {/* ── FEEDBACK ─────────────────────────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <ProfileClient
          userEmail={email}
          userName={name}
          saveCount={savedCount}
          topSource={topSource}
        />
      </div>

      {/* Divider */}
      <div style={{ height:'0.5px', margin:'24px 20px', background:'rgba(240,230,200,0.05)' }} />

      {/* ── SIGN OUT — clearly separated, bottom ─────────── */}
      {/*
        Sign out is a destructive action. It lives at the very bottom
        of the page, clearly separated from everything else.
        No fixed bars. No proximity to the back button.
      */}
      <div style={{ padding: '0 20px' }}>
        <SignOutButton />
      </div>

    </div>
  )
}
