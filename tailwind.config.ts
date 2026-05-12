import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary — warm terracotta
        primary: {
          50:  'hsl(16, 80%, 97%)',
          100: 'hsl(16, 78%, 93%)',
          200: 'hsl(16, 74%, 85%)',
          300: 'hsl(16, 70%, 74%)',
          400: 'hsl(16, 68%, 62%)',
          500: 'hsl(16, 65%, 52%)',
          600: 'hsl(16, 62%, 43%)',
          700: 'hsl(16, 60%, 35%)',
          800: 'hsl(16, 55%, 27%)',
          900: 'hsl(16, 50%, 20%)',
        },
        // Neutral — warm grey
        neutral: {
          50:  'hsl(40, 20%, 98%)',
          100: 'hsl(40, 15%, 95%)',
          200: 'hsl(40, 12%, 90%)',
          300: 'hsl(40, 10%, 82%)',
          400: 'hsl(40, 8%, 68%)',
          500: 'hsl(40, 6%, 55%)',
          600: 'hsl(40, 5%, 42%)',
          700: 'hsl(40, 5%, 32%)',
          800: 'hsl(40, 4%, 22%)',
          900: 'hsl(40, 4%, 12%)',
        },
        // Semantic
        success: 'hsl(145, 55%, 42%)',
        warning: 'hsl(38, 90%, 52%)',
        error:   'hsl(0, 68%, 52%)',
        info:    'hsl(210, 70%, 52%)',
        // Reaction colours
        reaction: {
          loved: 'hsl(350, 75%, 55%)',
          good:  'hsl(145, 55%, 42%)',
          okay:  'hsl(40, 60%, 52%)',
          skip:  'hsl(40, 6%, 55%)',
        },
        // Category accent colours
        category: {
          restaurant: 'hsl(16, 65%, 52%)',
          bar:        'hsl(280, 45%, 52%)',
          film:       'hsl(230, 55%, 55%)',
          tv:         'hsl(200, 65%, 48%)',
          music:      'hsl(320, 55%, 52%)',
          book:       'hsl(35, 65%, 48%)',
          city:       'hsl(160, 50%, 42%)',
          activity:   'hsl(180, 55%, 40%)',
          podcast:    'hsl(265, 55%, 55%)',
          person:     'hsl(25, 60%, 50%)',
        },
      },
      spacing: {
        1:  '4px',
        2:  '8px',
        3:  '12px',
        4:  '16px',
        5:  '20px',
        6:  '24px',
        8:  '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      maxWidth: {
        container: '480px',
      },
      fontSize: {
        // Type scale from UX_PRINCIPLES.md
        'display': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'page':    ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'card':    ['18px', { lineHeight: '1.3', fontWeight: '500' }],
        'body':    ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'source':  ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'meta':    ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'chip':    ['12px', { lineHeight: '1.0', fontWeight: '600' }],
        'button':  ['16px', { lineHeight: '1.0', fontWeight: '600' }],
      },
      borderRadius: {
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      keyframes: {
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-enter': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'save-confirm': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'card-enter':   'card-enter 180ms ease-out',
        'sheet-enter':  'sheet-enter 200ms ease-out',
        'save-confirm': 'save-confirm 150ms ease-out',
        'fade-in':      'fade-in 200ms ease-in-out',
      },
      height: {
        nav: '64px',
      },
    },
  },
  plugins: [],
}

export default config
