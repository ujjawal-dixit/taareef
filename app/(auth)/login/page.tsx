import { GoogleSignInButton } from './google-sign-in-button'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Sign in · taareef' }
export default function LoginPage() {
  return (
    <div style={{
      maxWidth: '430px', margin: '0 auto', minHeight: '100dvh',
      background: '#080f0a', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '0 32px',
    }}>
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <span style={{
          fontFamily: 'var(--f-display)',
          fontWeight: 300, fontStyle: 'italic', fontSize: '64px',
          letterSpacing: '-0.01em', lineHeight: 1, color: '#1fce94',
          textShadow: '0 0 20px rgba(31,206,148,0.60), 0 0 48px rgba(31,206,148,0.25)',
          display: 'block', textAlign: 'center', marginBottom: '10px',
        }}>taareef</span>
        <p style={{
          fontFamily: 'var(--f-body)',
          fontSize: '14px', fontWeight: 300, color: 'rgba(240,230,200,0.42)',
          lineHeight: 1.65, textAlign: 'center', maxWidth: '280px', margin: '0 auto',
        }}>
          Save what you trust.<br />Share what you love.
        </p>
      </div>
      <div style={{
        height: '0.5px', marginBottom: '40px',
        background: 'linear-gradient(to right, transparent, rgba(31,206,148,0.35), transparent)',
      }} />
      <GoogleSignInButton />
      <p style={{
        fontFamily: 'var(--f-body)',
        fontSize: '11px', color: 'rgba(240,230,200,0.25)',
        textAlign: 'center', marginTop: '24px', lineHeight: 1.6,
      }}>
        Private by default. Trust works both ways.
      </p>
    </div>
  )
}
