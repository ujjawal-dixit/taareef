// app/(app)/profile/page.tsx
// Simple profile page. User info + sign out.
// No social features. Private by default.

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { SignOutButton } from './sign-out-button'
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

  const name  = user.user_metadata?.full_name  ?? user.email?.split('@')[0] ?? 'You'
  const email = user.email ?? ''
  const avatar= user.user_metadata?.avatar_url ?? null

  return (
    <div style={{
      maxWidth:      '430px',
      margin:        '0 auto',
      minHeight:     '100dvh',
      background:    '#080f0a',
      paddingBottom: '100px',
    }}>

      {/* Header */}
      <header style={{ padding: '56px 20px 0', textAlign: 'center' }}>
        {avatar && (
          <img
            src={avatar}
            alt={name}
            style={{
              width:        '72px',
              height:       '72px',
              borderRadius: '50%',
              border:       '1.5px solid rgba(31,206,148,0.30)',
              margin:       '0 auto 16px',
              display:      'block',
              objectFit:    'cover',
            }}
          />
        )}

        <h1 style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    400,
          fontStyle:     'italic',
          fontSize:      '28px',
          color:         'rgba(240,230,200,0.95)',
          letterSpacing: '-0.01em',
          margin:        '0 0 4px',
        }}>
          {name}
        </h1>

        <p style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize:   '13px',
          color:      'rgba(240,230,200,0.38)',
        }}>
          {email}
        </p>

        {/* Hairline */}
        <div style={{
          height:    '0.5px',
          margin:    '20px auto',
          maxWidth:  '120px',
          background:'linear-gradient(to right, transparent, rgba(31,206,148,0.40), transparent)',
        }} />
      </header>

      {/* Stats */}
      <div style={{ padding: '0 20px 32px', textAlign: 'center' }}>
        <div style={{
          background:   'rgba(240,230,200,0.03)',
          border:       '1px solid rgba(240,230,200,0.08)',
          borderRadius: '14px',
          padding:      '20px',
          display:      'inline-block',
          minWidth:     '140px',
        }}>
          <div style={{
            fontFamily:    'var(--font-cormorant), Georgia, serif',
            fontWeight:    400,
            fontStyle:     'italic',
            fontSize:      '40px',
            color:         '#1fce94',
            textShadow:    '0 0 20px rgba(31,206,148,0.50)',
            lineHeight:    1,
            marginBottom:  '4px',
          }}>
            {count ?? 0}
          </div>
          <div style={{
            fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:      '11px',
            fontWeight:    500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color:         'rgba(240,230,200,0.38)',
          }}>
            saved
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 20px' }}>
        <SignOutButton />
      </div>

    </div>
  )
}
