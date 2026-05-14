import type { Config } from 'tailwindcss'

// ═══════════════════════════════════════════════════════════════════
// TAAREEF DESIGN TOKENS
// Extracted from WKW references. Every value traceable.
//
// CANVAS:   #080f0a — green-dark HK night street
// NEON:     #1fce94 — WKW shopfront neon, the single saturated accent
// SIGNAL:   #c8151e — cheongsam crimson, source attribution only
// TEXT:     rgba(240,230,200,0.95) — lamp-lit cream, never white
//
// FONT:     Rajdhani — condensed, architectural, Devanagari-rooted
//           DM Sans  — body, warm and readable at 11px on dark
//
// Itten:    Saturation contrast is the governing principle.
//           One saturated element (neon) in a desaturated field.
//           Everything else is dimmed. Neon advances. Canvas recedes.
// ═══════════════════════════════════════════════════════════════════

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './constants/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        title: ['var(--font-rajdhani)', 'sans-serif'],
        body:  ['var(--font-dm-sans)',  'sans-serif'],
      },

      colors: {
        // Canvas surfaces — green-dark HK night
        canvas: {
          0: '#080f0a',
          1: '#0d1910',
          2: '#142014',
          3: '#1a2818',
        },

        // Neon — the single saturated element
        // WKW shopfront green. Subtle. Not garish.
        neon: {
          DEFAULT: '#1fce94',
          dim:     'rgba(31,206,148,0.14)',
          glow:    'rgba(31,206,148,0.35)',
        },

        // Signal — crimson. Source attribution ONLY.
        signal: {
          DEFAULT: '#c8151e',
          dim:     'rgba(200,21,30,0.14)',
        },

        // Text — warm cream at three opacity levels
        cream: {
          high: 'rgba(240,230,200,0.95)',
          mid:  'rgba(240,230,200,0.58)',
          low:  'rgba(240,230,200,0.38)',
          ghost:'rgba(240,230,200,0.18)',
        },

        // Category jewel tones — each a WKW film's dominant neon
        // Used ONLY on active tile border/glow and card badges
        category: {
          food:     '#c8151e',
          film:     '#1a52c8',
          music:    '#9a1572',
          bar:      '#6a15c8',
          book:     '#b87820',
          tv:       '#155a8a',
          city:     '#1fce94',
          podcast:  '#3315c8',
          activity: '#158a6a',
          person:   '#c84515',
        },
      },

      borderColor: {
        subtle: 'rgba(240,230,200,0.09)',
        mid:    'rgba(240,230,200,0.14)',
      },

      // Touch targets — Fitts's Law minimum 44px
      spacing: {
        'touch': '44px',
        'fab':   '58px',
        'nav':   '64px',
        'safe':  'env(safe-area-inset-bottom, 0px)',
      },

      maxWidth: {
        'app': '430px',
      },

      borderRadius: {
        card:  '16px',
        tile:  '10px',
        chip:  '6px',
        pill:  '9999px',
      },

      // Box shadows — all use warm cream or neon glow
      boxShadow: {
        card:    '0 4px 24px rgba(0,0,0,0.50)',
        fab:     '0 0 0 0 rgba(31,206,148,0), 0 5px 22px rgba(31,206,148,0.40)',
        'fab-pulse': '0 0 0 7px rgba(31,206,148,0.08), 0 7px 32px rgba(31,206,148,0.55)',
        neon:    '0 0 12px rgba(31,206,148,0.40)',
        tile:    '0 0 8px rgba(31,206,148,0.30)',
      },

      keyframes: {
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fab-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(31,206,148,0), 0 5px 22px rgba(31,206,148,0.40)' },
          '50%':     { boxShadow: '0 0 0 7px rgba(31,206,148,0.08), 0 7px 32px rgba(31,206,148,0.55)' },
        },
        'screen-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },

      animation: {
        'card-enter': 'card-enter 280ms cubic-bezier(0.16,1,0.3,1)',
        'fab-pulse':  'fab-pulse 3.2s ease-in-out infinite',
        'screen-up':  'screen-up 260ms cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fade-in 220ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
