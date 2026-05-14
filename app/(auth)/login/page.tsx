// app/(auth)/login/page.tsx
// Login page. Google OAuth only in V1.
// Warm, minimal. Brand name in neon. One tap to enter.

import { GoogleSignInButton } from './google-sign-in-button'
import type { Metadata }      from 'next'

export const metadata: Metadata = { title: 'Sign in · taareef' }

export default function LoginPage() {
  return (
    <div
      style={{
        maxWidth:       '430px',
        margin:         '0 auto',
        minHeight:      '100dvh',
        background:     'var(--bg0)',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '0 32px',
      }}
    >

      {/* Brand */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <span
          className="brand-name"
          style={{
            fontSize:   '64px',
            display:    'block',
            textAlign:  'center',
            marginBottom: '10px',
          }}
        >
          taareef
        </span>
        <p style={{
          fontFamily:  'var(--f-body)',
          fontSize:    '14px', fontWeight: 300,
          color:       'var(--t2)',
          lineHeight:  1.6, textAlign: 'center',
          maxWidth:    '240px',
          margin:      '0 auto',
        }}>
          Every recommendation you'll ever get. One place.
        </p>
      </div>

      {/* Hairline */}
      <div
        style={{
          height:     '0.5px',
          background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.35), transparent)',
          marginBottom: '40px',
        }}
      />

      {/* Sign in */}
      <GoogleSignInButton />

      {/* Fine print */}
      <p style={{
        fontFamily:  'var(--f-body)',
        fontSize:    '11px', fontWeight: 400,
        color:       'var(--t3)',
        textAlign:   'center',
        marginTop:   '24px',
        lineHeight:  1.6,
      }}>
        Private by default. Your vault belongs to you.
      </p>

    </div>
  )
}
