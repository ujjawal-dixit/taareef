// app/(app)/profile/page.tsx
//
// PROFILE BACK BUTTON — redesigned.
// The current "vault" link in small cream text top-left reads as an afterthought.
// Profile is a different room. Returning to vault should feel like
// stepping back through a doorframe — not tapping a footnote.
//
// Solution: A full-width "return to vault" bar at the bottom of the page,
// above the nav bar. It is always visible. It says exactly what it does.
// The vault icon matches the nav bar vault icon. Neon — because you're going home.
//
// The top of the page: no back button. You got here via the nav bar.
// The nav bar is always visible. Profile doesn't need a top back button.

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

  const { count: savedCount } = await supabase
    .from('recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'dismissed')

  const { count: experiencedCount } = await supabase
    .from('recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'saved')
    .neq('status', 'dismissed')

  // Top source for feedback personalisation
  const { data: recs } = await supabase
    .from('recommendations')
    .select('source_name')
    .eq('user_id', user.id)
    .neq('status', 'dismissed')

  const counts: Record<string, number> = {}
  recs?.forEach(r => { counts[r.source_name] = (counts[r.source_name] ?? 0) + 1 })
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
      // Extra bottom padding: nav bar (64px) + some breathing room
      paddingBottom: '100px',
    }}>

      {/* ── HEADER — name and avatar ─────────────────────────── */}
      <header style={{ padding: '60px 20px 0', textAlign: 'center' }}>

        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{
              width:        '72px', height: '72px',
              borderRadius: '50%',
              border:       '1.5px solid rgba(31,206,148,0.28)',
              margin:       '0 auto 16px', display: 'block',
              objectFit:    'cover',
            }}
          />
        ) : (
          <div style={{
            width:          '72px', height: '72px', borderRadius: '50%',
            border:         '1.5px solid rgba(31,206,148,0.18)',
            background:     'rgba(31,206,148,0.05)',
            margin:         '0 auto 16px',
            display:        'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="rgba(31,206,148,0.45)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
        )}

        {/* Name — Cormorant italic, same register as wordmark */}
        <h1 style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    400, fontStyle: 'italic',
          fontSize:      '28px', letterSpacing: '-0.01em',
          color:         'rgba(240,230,200,0.95)',
          margin:        '0 0 4px',
        }}>
          {name}
        </h1>

        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '12px', color: 'rgba(240,230,200,0.32)',
          marginBottom: '0',
        }}>
          {email}
        </p>

        {/* Hairline */}
        <div style={{
          height: '0.5px', margin: '20px auto',
          maxWidth: '80px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.30), transparent)',
        }} />
      </header>

      {/* ── STATS ────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 32px', display: 'flex', gap: '10px' }}>
        {[
          { n: savedCount ?? 0,       label: 'saved'       },
          { n: experiencedCount ?? 0, label: 'experienced' },
        ].map(s => (
          <div key={s.label} style={{
            flex:         1,
            textAlign:    'center',
            background:   'rgba(240,230,200,0.03)',
            border:       '1px solid rgba(240,230,200,0.07)',
            borderRadius: '14px',
            padding:      '18px 12px',
          }}>
            <div style={{
              fontFamily:   'var(--font-cormorant), Georgia, serif',
              fontWeight:   400, fontStyle: 'italic',
              fontSize:     '36px', lineHeight: 1,
              color:        '#1fce94',
              textShadow:   '0 0 20px rgba(31,206,148,0.45)',
              marginBottom: '4px',
            }}>
              {s.n}
            </div>
            <div style={{
              fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
              fontSize:      '10px', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color:         'rgba(240,230,200,0.32)',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Section divider */}
      <div style={{
        height: '0.5px', margin: '0 20px 28px',
        background: 'rgba(240,230,200,0.05)',
      }} />

      {/* ── FEEDBACK ─────────────────────────────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <ProfileClient
          userEmail={email}
          userName={name}
          saveCount={savedCount ?? 0}
          topSource={topSource}
        />
      </div>

      {/* Section divider */}
      <div style={{
        height: '0.5px', margin: '28px 20px',
        background: 'rgba(240,230,200,0.05)',
      }} />

      {/* ── SIGN OUT ─────────────────────────────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <SignOutButton />
      </div>

      {/* ── RETURN TO VAULT ──────────────────────────────────── */}
      {/*
        This is the redesigned back mechanism.
        Not a top-left footnote. A deliberate, visible affordance.
        Fixed above the nav bar. Full width. Neon.
        When you're done with your profile, it is unmissably there.
        It says "← back to vault" — specific, honest, warm.
      */}
      <Link
        href="/dashboard"
        style={{
          position:               'fixed',
          bottom:                 '72px', // sits just above the nav bar
          left:                   '50%',
          transform:              'translateX(-50%)',
          width:                  'calc(100% - 32px)',
          maxWidth:               '398px',
          height:                 '48px',
          borderRadius:           '14px',
          background:             'rgba(8,15,10,0.97)',
          backdropFilter:         'blur(24px)',
          WebkitBackdropFilter:   'blur(24px)',
          border:                 '1px solid rgba(31,206,148,0.22)',
          display:                'flex',
          alignItems:             'center',
          justifyContent:         'center',
          gap:                    '8px',
          textDecoration:         'none',
          fontFamily:             'var(--font-rajdhani), system-ui, sans-serif',
          fontSize:               '13px',
          fontWeight:             700,
          letterSpacing:          '0.07em',
          textTransform:          'uppercase',
          color:                  '#1fce94',
          textShadow:             '0 0 12px rgba(31,206,148,0.40)',
          WebkitTapHighlightColor:'transparent',
          zIndex:                 50,
          transition:             'border-color 160ms ease, background 160ms ease',
          boxShadow:              '0 4px 24px rgba(0,0,0,0.50)',
        }}
        aria-label="Return to vault"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        back to vault
      </Link>

    </div>
  )
}
