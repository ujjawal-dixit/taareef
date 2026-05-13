import type { Config } from 'tailwindcss'

// Taareef — Wong Kar-wai Design System
// Deep, warm, intimate. Like candlelight on silk.
// Reference: In the Mood for Love — rich reds, warm ambers, private and glowing.

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './constants/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Override — not extend — so Tailwind's default grey scale doesn't conflict
    extend: {

      fontFamily: {
        // Fraunces — warm editorial serif for all display text
        // next/font sets --font-fraunces as a CSS variable on <html>
        // Tailwind uses the literal name first, CSS var as fallback pattern
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display': ['32px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'page':    ['24px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.01em' }],
        'card':    ['17px', { lineHeight: '1.3',  fontWeight: '500' }],
        'body':    ['15px', { lineHeight: '1.65', fontWeight: '400' }],
        'source':  ['13px', { lineHeight: '1.4',  fontWeight: '500' }],
        'meta':    ['12px', { lineHeight: '1.4',  fontWeight: '400' }],
        'chip':    ['11px', { lineHeight: '1.0',  fontWeight: '600', letterSpacing: '0.02em' }],
        'button':  ['15px', { lineHeight: '1.0',  fontWeight: '600' }],
        'nudge':   ['14px', { lineHeight: '1.5',  fontWeight: '400' }],
        'label':   ['10px', { lineHeight: '1.0',  fontWeight: '600', letterSpacing: '0.06em' }],
      },

      colors: {
        // Primary — deep burnt terracotta. Wong Kar-wai red.
        primary: {
          50:  '#fdf4f2',
          100: '#fae3dc',
          200: '#f5c4b3',
          300: '#ed9a80',
          400: '#e06a4a',
          500: '#c44a28',  // main brand — rich, not orange
          600: '#a33820',
          700: '#852b18',
          800: '#6d2415',
          900: '#5a1f12',
        },

        // Neutral — warm cream. Aged paper, not hospital white.
        neutral: {
          50:  '#faf8f5',  // page background — the warmest off-white
          100: '#f2ede6',
          200: '#e5ddd3',
          300: '#d0c5b8',
          400: '#b0a396',
          500: '#8f8278',
          600: '#6e6360',
          700: '#524d4b',
          800: '#373432',
          900: '#1e1c1a',  // text — warm near-black
        },

        // Category accent colours — jewel-toned, deep, each a different mood
        category: {
          restaurant: '#c44a28',  // deep terracotta
          bar:        '#6b3fa0',  // deep plum
          film:       '#2d4a8a',  // deep indigo
          tv:         '#1a5f7a',  // deep teal blue
          music:      '#8a2252',  // deep rose burgundy
          book:       '#8a5a1a',  // rich amber
          city:       '#1a6b4a',  // deep sage
          activity:   '#1a5f5f',  // deep teal
          podcast:    '#5a2d8a',  // deep violet
          person:     '#8a4a1a',  // warm burnt orange
        },

        // Semantic
        success: '#2d6b3d',
        warning: '#8a6218',
        error:   '#8a2020',
        info:    '#1a4a8a',

        // Reaction colours
        reaction: {
          loved: '#8a2252',
          good:  '#2d6b3d',
          okay:  '#8a6218',
          skip:  '#8f8278',
        },
      },

      spacing: {
        px:   '1px',
        0.5:  '2px',
        1:    '4px',
        1.5:  '6px',
        2:    '8px',
        2.5:  '10px',
        3:    '12px',
        3.5:  '14px',
        4:    '16px',
        5:    '20px',
        6:    '24px',
        7:    '28px',
        8:    '32px',
        9:    '36px',
        10:   '40px',
        11:   '44px',
        12:   '48px',
        14:   '56px',
        16:   '64px',
        18:   '72px',
        20:   '80px',
        24:   '96px',
        28:   '112px',
        32:   '128px',
        safe: 'env(safe-area-inset-bottom, 0px)',
      },

      maxWidth: {
        container: '480px',
      },

      borderRadius: {
        sm:    '6px',
        DEFAULT:'8px',
        md:    '10px',
        lg:    '14px',
        xl:    '18px',
        '2xl': '22px',
        '3xl': '28px',
        full:  '9999px',
      },

      // Shadows as pure CSS strings — no Tailwind color processing
      // This ensures they generate correctly every time
      boxShadow: {
        'card':      '0 1px 4px rgba(30,28,26,0.06), 0 4px 12px rgba(30,28,26,0.06)',
        'card-hover':'0 4px 8px rgba(30,28,26,0.08), 0 12px 28px rgba(30,28,26,0.10)',
        'sheet':     '0 -2px 24px rgba(30,28,26,0.10)',
        'fab':       '0 4px 12px rgba(196,74,40,0.40)',
        'nav':       '0 -0.5px 0 rgba(30,28,26,0.10)',
        'chip':      '0 1px 3px rgba(30,28,26,0.08)',
      },

      keyframes: {
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'card-save': {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '60%':  { opacity: '0.7', transform: 'scale(0.85) translateY(8px)' },
          '100%': { opacity: '0', transform: 'scale(0.3) translateY(40px)' },
        },
        'sheet-enter': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'sheet-exit': {
          from: { transform: 'translateY(0)' },
          to:   { transform: 'translateY(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },
        'screen-enter': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'nudge-enter': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'save-confirm': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        'pulse-warm': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.45' },
        },
        'tooltip-life': {
          '0%':   { opacity: '0' },
          '12%':  { opacity: '1' },
          '88%':  { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },

      animation: {
        'card-enter':    'card-enter 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'card-save':     'card-save 380ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'sheet-enter':   'sheet-enter 340ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-exit':    'sheet-exit 260ms cubic-bezier(0.4, 0, 1, 1)',
        'fade-in':       'fade-in 260ms ease-out',
        'fade-out':      'fade-out 200ms ease-in',
        'screen-enter':  'screen-enter 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        'nudge-enter':   'nudge-enter 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        'save-confirm':  'save-confirm 220ms ease-out',
        'pulse-warm':    'pulse-warm 1.8s ease-in-out infinite',
        'tooltip-life':  'tooltip-life 4200ms ease-in-out forwards',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
