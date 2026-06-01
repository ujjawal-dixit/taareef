// app/(app)/profile/page.tsx
// Session 9 redesign:
// - Avatar: Cormorant italic initial in neon + progress arc (experienced/saved ratio)
// - Stats: 4 elements — most trusted source, most active category, ratio, unreacted nudge
// - Feedback block: deep teal bg, neon border, "Help us make this better"
// - Source name removed from feedback opening line
// - Joined date below email
// - Consistent neon pill back nav

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

  const [savedResult, experiencedResult, sourcesResult, categoryResult, unreactedResult] = await Promise.all([
    supabase.from('recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).neq('status', 'dismissed'),
    supabase.from('recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).neq('status', 'saved').neq('status', 'dismissed'),
    supabase.from('recommendations')
      .select('source_name')
      .eq('user_id', user.id).neq('status', 'dismissed'),
    supabase.from('recommendations')
      .select('category')
      .eq('user_id', user.id).neq('status', 'dismissed'),
    supabase.from('recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('status', 'experienced').is('reaction', null),
  ])

  const savedCount       = savedResult.count      ?? 0
  const experiencedCount = experiencedResult.count ?? 0
  const unreactedCount   = unreactedResult.count   ?? 0

  // Most trusted source
  const sourceCounts: Record<string, number> = {}
  sourcesResult.data?.forEach(r => {
    sourceCounts[r.source_name] = (sourceCounts[r.source_name] ?? 0) + 1
  })
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] ?? null

  // Most active category
  const catCounts: Record<string, number> = {}
  categoryResult.data?.forEach(r => {
    catCounts[r.category] = (catCounts[r.category] ?? 0) + 1
  })
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0] ?? null

  const name        = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'You'
  const email       = user.email ?? ''
  const avatar      = user.user_metadata?.avatar_url ?? null
  const joinedDate  = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null

  // Progress arc: experienced / saved ratio (0–1)
  const ratio = savedCount > 0 ? Math.min(experiencedCount / savedCount, 1) : 0

  return (
    <div style={{
      maxWidth:      '430px',
      margin:        '0 auto',
      minHeight:     '100dvh',
      background:    '#080f0a',
      display:       'flex',
      flexDirection: 'column',
      paddingBottom: '140px',
    }}>

      {/* Back to vault */}
      <div style={{ padding: '52px 20px 0' }}>
        <Link
          href="/dashboard"
          aria-label="Back to vault"
          style={{
            display:                 'flex',
            alignItems:              'center',
            justifyContent:          'center',
            gap:                     '8px',
            height:                  '50px',
            borderRadius:            '14px',
            border:                  '1px solid rgba(31,206,148,0.38)',
            background:              'rgba(31,206,148,0.06)',
            fontFamily:              'var(--f-ui)',
            fontSize:                '13px',
            fontWeight:              700,
            letterSpacing:           '0.08em',
            textTransform:           'uppercase',
            color:                   '#1fce94',
            textDecoration:          'none',
            textShadow:              '0 0 12px rgba(31,206,148,0.45)',
            boxShadow:               '0 0 24px rgba(31,206,148,0.08)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          back to vault
        </Link>
      </div>

      {/* Avatar — neon initial + progress arc */}
      <header style={{ padding: '28px 20px 0', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 14px' }}>
          {/* Progress arc SVG */}
          <svg
            width="80" height="80" viewBox="0 0 80 80"
            style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx="40" cy="40" r="36"
              stroke="rgba(31,206,148,0.12)"
              strokeWidth="3"
              fill="none"
            />
            {/* Progress */}
            {ratio > 0 && (
              <circle
                cx="40" cy="40" r="36"
                stroke="#1fce94"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - ratio)}`}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(31,206,148,0.55))' }}
              />
            )}
          </svg>

          {/* Avatar circle */}
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              style={{
                width:        '68px',
                height:       '68px',
                borderRadius: '50%',
                objectFit:    'cover',
                position:     'absolute',
                top:          '6px',
                left:         '6px',
              }}
            />
          ) : (
            <div style={{
              width:          '68px',
              height:         '68px',
              borderRadius:   '50%',
              background:     '#0d1810',
              position:       'absolute',
              top:            '6px',
              left:           '6px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontFamily:  'var(--f-display)',
                fontStyle:   'italic',
                fontWeight:  300,
                fontSize:    '32px',
                color:       '#1fce94',
                textShadow:  '0 0 14px rgba(31,206,148,0.50)',
                lineHeight:  1,
              }}>
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <h1 style={{
          fontFamily:    'var(--f-display)',
          fontWeight:    400,
          fontStyle:     'italic',
          fontSize:      '26px',
          letterSpacing: '-0.01em',
          color:         'rgba(240,230,200,0.95)',
          margin:        '0 0 4px',
        }}>
          {name}
        </h1>

        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize:   '12px',
          fontWeight: 300,
          color:      'rgba(240,230,200,0.30)',
          margin:     0,
        }}>
          {email}
        </p>

        {joinedDate && (
          <p style={{
            fontFamily: 'var(--f-body)',
            fontSize:   '11px',
            fontWeight: 300,
            color:      'rgba(240,230,200,0.18)',
            margin:     '4px 0 0',
          }}>
            Saving since {joinedDate}
          </p>
        )}

        <div style={{
          height:     '0.5px',
          margin:     '18px auto',
          maxWidth:   '80px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.30), transparent)',
        }} />
      </header>

      {/* Stats — 4 elements */}
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Saved + Experienced row */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { n: savedCount,       label: 'saved'       },
            { n: experiencedCount, label: 'experienced' },
          ].map(s => (
            <div key={s.label} style={{
              flex:         1,
              textAlign:    'center',
              background:   'rgba(240,230,200,0.03)',
              border:       '1px solid rgba(240,230,200,0.07)',
              borderRadius: '14px',
              padding:      '14px 12px',
            }}>
              <div style={{
                fontFamily:  'var(--f-display)',
                fontWeight:  400,
                fontStyle:   'italic',
                fontSize:    '32px',
                lineHeight:  1,
                color:       '#1fce94',
                textShadow:  '0 0 18px rgba(31,206,148,0.45)',
                marginBottom:'4px',
              }}>
                {s.n}
              </div>
              <div style={{
                fontFamily:    'var(--f-ui)',
                fontSize:      '9px',
                fontWeight:    700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color:         'rgba(240,230,200,0.30)',
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Most trusted source */}
        {topSource && (
          <div style={{
            background:   'rgba(240,230,200,0.03)',
            border:       '1px solid rgba(240,230,200,0.07)',
            borderRadius: '14px',
            padding:      '14px 16px',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'space-between',
          }}>
            <div style={{
              fontFamily:    'var(--f-ui)',
              fontSize:      '9px',
              fontWeight:    700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color:         'rgba(240,230,200,0.30)',
            }}>
              Most trusted source
            </div>
            <div style={{
              fontFamily: 'var(--f-body)',
              fontSize:   '13px',
              fontWeight: 500,
              color:      'rgba(240,230,200,0.82)',
            }}>
              {topSource[0]}
            </div>
          </div>
        )}

        {/* Most active category */}
        {topCategory && (
          <div style={{
            background:   'rgba(240,230,200,0.03)',
            border:       '1px solid rgba(240,230,200,0.07)',
            borderRadius: '14px',
            padding:      '14px 16px',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'space-between',
          }}>
            <div style={{
              fontFamily:    'var(--f-ui)',
              fontSize:      '9px',
              fontWeight:    700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color:         'rgba(240,230,200,0.30)',
            }}>
              Most active
            </div>
            <div style={{
              fontFamily:    'var(--f-body)',
              fontSize:      '13px',
              fontWeight:    500,
              color:         'rgba(240,230,200,0.82)',
              textTransform: 'capitalize',
            }}>
              {topCategory[0]}
            </div>
          </div>
        )}

        {/* Unreacted nudge — only if there are unreacted saves */}
        {unreactedCount > 0 && (
          <Link href="/dashboard" style={{
            background:     'rgba(31,206,148,0.04)',
            border:         '1px solid rgba(31,206,148,0.18)',
            borderRadius:   '14px',
            padding:        '14px 16px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            cursor:         'pointer',
          }}>
            <div style={{
              fontFamily: 'var(--f-body)',
              fontSize:   '13px',
              fontWeight: 400,
              color:      'rgba(255,255,255,0.65)',
              lineHeight: 1.4,
            }}>
              {unreactedCount} {unreactedCount === 1 ? 'save' : 'saves'} waiting for your verdict
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="rgba(31,206,148,0.60)" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        )}
      </div>

      <div style={{ height: '0.5px', margin: '0 20px 20px', background: 'rgba(240,230,200,0.05)' }} />

      {/* Feedback block — distinct material */}
      <div style={{ padding: '0 20px' }}>
        <ProfileClient
          userEmail={email}
          userName={name}
          saveCount={savedCount}
          topSource={topSource?.[0] ?? null}
        />
      </div>

      <div style={{ height: '0.5px', margin: '24px 20px', background: 'rgba(240,230,200,0.05)' }} />

      {/* Sign out */}
      <div style={{ padding: '0 20px' }}>
        <SignOutButton />
      </div>

    </div>
  )
}
