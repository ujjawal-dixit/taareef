// app/(app)/profile/page.tsx
// Profile with back-to-vault button at top.

import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { SignOutButton }  from './sign-out-button'
import Link              from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile · taareef' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count } = await supabase
    .from('recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'dismissed')

  const { count: experienced } = await supabase
    .from('recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'saved')
    .neq('status', 'dismissed')

  const name   = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'You'
  const email  = user.email ?? ''
  const avatar = user.user_metadata?.avatar_url ?? null

  return (
    <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100dvh', background: '#080f0a', paddingBottom: '100px' }}>

      {/* Back to vault */}
      <div style={{ padding: '52px 20px 0' }}>
        <Link
          href="/dashboard"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '5px',
            color:          'rgba(240,230,200,0.38)',
            textDecoration: 'none',
            fontFamily:     'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:       '12px',
            letterSpacing:  '0.04em',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          vault
        </Link>
      </div>

      {/* Avatar + name */}
      <header style={{ padding: '28px 20px 0', textAlign: 'center' }}>
        {avatar ? (
          <img src={avatar} alt={name} style={{
            width: '72px', height: '72px', borderRadius: '50%',
            border: '1.5px solid rgba(31,206,148,0.28)',
            margin: '0 auto 16px', display: 'block', objectFit: 'cover',
          }} />
        ) : (
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            border: '1.5px solid rgba(31,206,148,0.20)',
            background: 'rgba(31,206,148,0.06)',
            margin: '0 auto 16px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(31,206,148,0.55)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
        )}

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
          fontSize: '12px', color: 'rgba(240,230,200,0.35)',
        }}>
          {email}
        </p>

        {/* Hairline */}
        <div style={{
          height: '0.5px', margin: '20px auto',
          maxWidth: '100px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.35), transparent)',
        }} />
      </header>

      {/* Stats */}
      <div style={{ padding: '0 20px 32px', display: 'flex', gap: '10px' }}>
        {[
          { n: count ?? 0, label: 'saved' },
          { n: experienced ?? 0, label: 'experienced' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center',
            background: 'rgba(240,230,200,0.03)',
            border: '1px solid rgba(240,230,200,0.08)',
            borderRadius: '14px', padding: '18px 12px',
          }}>
            <div style={{
              fontFamily:  'var(--font-cormorant), Georgia, serif',
              fontWeight:  400, fontStyle: 'italic',
              fontSize:    '36px', lineHeight: 1,
              color:       '#1fce94',
              textShadow:  '0 0 20px rgba(31,206,148,0.50)',
              marginBottom:'4px',
            }}>
              {s.n}
            </div>
            <div style={{
              fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
              fontSize:      '10px', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color:         'rgba(240,230,200,0.35)',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 20px' }}>
        <SignOutButton />
      </div>

    </div>
  )
}
