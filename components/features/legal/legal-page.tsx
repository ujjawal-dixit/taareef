// components/features/legal/legal-page.tsx
//
// Shared shell for /privacy and /terms.
//
// One component rather than two near-identical pages: this codebase has
// been bitten before by the same markup living in two files and quietly
// diverging (the detail screen and card component). Anything visual that
// appears twice gets one source of truth.

import Link from 'next/link'

export type LegalSection = {
  heading: string
  body:    string[]
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title:    string
  updated:  string
  intro:    string
  sections: LegalSection[]
}) {
  return (
    <div style={{
      maxWidth:   '640px',
      margin:     '0 auto',
      minHeight:  '100dvh',
      background: '#080f0a',
      padding:    'clamp(32px, 8vh, 64px) clamp(20px, 6vw, 32px) 80px',
    }}>
      <Link
        href="/"
        style={{
          fontFamily:    'var(--f-ui)',
          fontWeight:    700,
          fontSize:      '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color:         '#1fce94',
          textDecoration:'none',
          display:       'inline-block',
          marginBottom:  '40px',
        }}
      >
        ← taareef
      </Link>

      <h1 style={{
        fontFamily:    'var(--f-display)',
        fontWeight:    300,
        fontStyle:     'italic',
        fontSize:      'clamp(30px, 7vw, 40px)',
        lineHeight:    1.15,
        letterSpacing: '-0.01em',
        color:         '#F4F3EE',
        margin:        '0 0 8px',
      }}>
        {title}
      </h1>

      <p style={{
        fontFamily: 'var(--f-body)',
        fontSize:   '12px',
        color:      'rgba(240,230,200,0.30)',
        margin:     '0 0 32px',
      }}>
        Last updated {updated}
      </p>

      <p style={{
        fontFamily:   'var(--f-body)',
        fontSize:     'clamp(15px, 3.6vw, 16px)',
        lineHeight:   1.7,
        color:        'rgba(240,230,200,0.72)',
        margin:       '0 0 40px',
        paddingBottom:'32px',
        borderBottom: '0.5px solid rgba(31,206,148,0.18)',
      }}>
        {intro}
      </p>

      {sections.map(section => (
        <section key={section.heading} style={{ marginBottom: '36px' }}>
          <h2 style={{
            fontFamily:    'var(--f-ui)',
            fontWeight:    700,
            fontSize:      '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         '#1fce94',
            margin:        '0 0 12px',
          }}>
            {section.heading}
          </h2>

          {section.body.map((paragraph, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--f-body)',
                fontSize:   'clamp(14px, 3.4vw, 15px)',
                lineHeight: 1.75,
                color:      'rgba(240,230,200,0.62)',
                margin:     i === 0 ? '0' : '14px 0 0',
              }}
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
