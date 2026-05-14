// components/features/vault/empty-state.tsx
// Empty states — invitations, never apologies.
// Headline: Cormorant italic — same voice as the wordmark.
// Body: DM Sans 300 — warm, understated.
// Home empty: neon gem + whispered hairline invitation.
// Category empty: category-tinted gem + category-coloured CTA.

import { getCategoryConfig, type CategoryId } from '@/constants/categories'
import type { Category } from '@/lib/types'

type EmptyStateProps = {
  category?: Category
  onAdd?:    () => void
}

export function EmptyState({ category, onAdd }: EmptyStateProps) {
  if (!category) return <HomeEmpty onAdd={onAdd} />

  const config = getCategoryConfig(category as CategoryId)

  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      textAlign:       'center',
      padding:         '52px 24px',
      minHeight:       'calc(100dvh - 400px)',
      justifyContent:  'center',
    }}>

      {/* Category gem */}
      <div
        aria-hidden="true"
        style={{
          width:          '64px',
          height:         '64px',
          borderRadius:   '16px',
          background:     `radial-gradient(circle at 44% 36%, ${config.colourHex}22 0%, ${config.colourHex}05 100%)`,
          border:         `1px solid ${config.colourHex}28`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   '24px',
          boxShadow:      `0 0 40px ${config.colourHex}10`,
        }}
      >
        <svg
          width="24" height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={config.colourHex}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.80 }}
        >
          <path d="M6 3h12l4 6-10 13L2 9z"/>
          <path d="M2 9h20M12 3l4 6M12 3l-4 6"/>
        </svg>
      </div>

      {/* Headline — Cormorant italic, same voice as wordmark */}
      <h2 style={{
        fontFamily:    'var(--font-cormorant), Georgia, serif',
        fontWeight:    400,
        fontStyle:     'italic',
        fontSize:      '24px',
        letterSpacing: '-0.01em',
        color:         'rgba(240,230,200,0.95)',
        lineHeight:    1.2,
        marginBottom:  '10px',
      }}>
        {config.emptyState.headline}
      </h2>

      {/* Body */}
      <p style={{
        fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
        fontSize:     '13px',
        fontWeight:   300,
        color:        'rgba(240,230,200,0.52)',
        lineHeight:   1.70,
        maxWidth:     '220px',
        marginBottom: '32px',
      }}>
        {config.emptyState.body}
      </p>

      {/* CTA — category colour, 52px height (Fitts's Law) */}
      {onAdd && (
        <button
          onClick={onAdd}
          style={{
            background:              config.colourHex,
            color:                   '#080f0a',
            fontFamily:              'var(--font-rajdhani), system-ui, sans-serif',
            fontSize:                '13px',
            fontWeight:              700,
            letterSpacing:           '0.08em',
            textTransform:           'uppercase',
            padding:                 '0 24px',
            height:                  '48px',
            borderRadius:            '10px',
            border:                  'none',
            cursor:                  'pointer',
            boxShadow:               `0 4px 20px ${config.colourHex}42`,
            WebkitTapHighlightColor: 'transparent',
            display:                 'flex',
            alignItems:              'center',
          }}
        >
          {config.emptyState.cta}
        </button>
      )}
    </div>
  )
}

// ── HOME EMPTY ────────────────────────────────────────────────────
// The first thing a new user sees.
// Neon gem glows. Headline in Cormorant italic.
// The invitation whispers — it does not shout.

function HomeEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      textAlign:       'center',
      padding:         '52px 24px',
      minHeight:       'calc(100dvh - 400px)',
      justifyContent:  'center',
    }}>

      {/* Neon gem — the same accent as wordmark and FAB */}
      <div
        aria-hidden="true"
        style={{
          width:          '64px',
          height:         '64px',
          borderRadius:   '16px',
          background:     'radial-gradient(circle at 44% 36%, rgba(31,206,148,0.18) 0%, rgba(31,206,148,0.03) 100%)',
          border:         '1px solid rgba(31,206,148,0.20)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   '24px',
          boxShadow:      '0 0 40px rgba(31,206,148,0.08)',
        }}
      >
        <svg
          width="24" height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1fce94"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.80 }}
        >
          <path d="M6 3h12l4 6-10 13L2 9z"/>
          <path d="M2 9h20M12 3l4 6M12 3l-4 6"/>
        </svg>
      </div>

      {/* Headline — Cormorant italic, same voice as the wordmark */}
      <h2 style={{
        fontFamily:    'var(--font-cormorant), Georgia, serif',
        fontWeight:    400,
        fontStyle:     'italic',
        fontSize:      '24px',
        letterSpacing: '-0.01em',
        color:         'rgba(240,230,200,0.95)',
        lineHeight:    1.2,
        marginBottom:  '10px',
      }}>
        Your vault is waiting
      </h2>

      {/* Body — DM Sans 300, warm and unhurried */}
      <p style={{
        fontFamily:   'var(--font-dm-sans), system-ui, sans-serif',
        fontSize:     '13px',
        fontWeight:   300,
        color:        'rgba(240,230,200,0.50)',
        lineHeight:   1.75,
        maxWidth:     '210px',
        marginBottom: '32px',
      }}>
        Every recommendation someone gives you — restaurants, films, music, books — one place, with who told you, always.
      </p>

      {/*
        THE INVITATION
        Not a button. Not a CTA. A whisper.
        WKW never announces. He presents.
        Two neon hairlines bracket the text.
        You lean in and tap it.
      */}
      {onAdd && (
        <button
          onClick={onAdd}
          aria-label="Save your first recommendation"
          style={{
            display:                 'flex',
            alignItems:              'center',
            gap:                     '14px',
            background:              'none',
            border:                  'none',
            cursor:                  'pointer',
            padding:                 '10px 0',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Left hairline */}
          <div style={{
            height:     '0.5px',
            width:      '32px',
            background: '#1fce94',
            opacity:    0.38,
          }} aria-hidden="true" />

          <span style={{
            fontFamily:    'var(--font-dm-sans), system-ui, sans-serif',
            fontSize:      '11px',
            fontWeight:    600,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color:         '#1fce94',
          }}>
            Save your first one
          </span>

          {/* Right hairline */}
          <div style={{
            height:     '0.5px',
            width:      '32px',
            background: '#1fce94',
            opacity:    0.38,
          }} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
