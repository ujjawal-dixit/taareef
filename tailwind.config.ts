import type { Config } from 'tailwindcss'

// Taareef Design System — Wong Kar-wai Edition
// Colour philosophy: deep, saturated, warm — like candlelight on silk.
// Every colour is slightly richer and more intimate than a standard palette.
// Reference: In the Mood for Love — deep reds, warm ambers, private and glowing.

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {

      // ============================================================
      // TYPOGRAPHY
      // Fraunces — display, headings, card titles. Warm, editorial.
      // DM Sans — body, metadata, UI text. Clean without being cold.
      // ============================================================

      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Display — onboarding headlines, brand moments
        'display':  ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        // Page — section titles
        'page':     ['24px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
        // Card title — the name of the recommendation
        'card':     ['18px', { lineHeight: '1.3', fontWeight: '500' }],
        // Body — notes, descriptions
        'body':     ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        // Source — "From Ahmed" — always terracotta
        'source':   ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        // Meta — dates, counts, secondary info
        'meta':     ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        // Chip — category labels, status indicators
        'chip':     ['11px', { lineHeight: '1.0', fontWeight: '600', letterSpacing: '0.04em' }],
        // Button — all CTAs
        'button':   ['16px', { lineHeight: '1.0', fontWeight: '600' }],
        // Nudge — home screen questions, subtle prompts
        'nudge':    ['15px', { lineHeight: '1.5', fontWeight: '400' }],
      },

      // ============================================================
      // COLOURS
      // Wong Kar-wai palette — deeper, richer, more saturated.
      // Nothing is flat. Everything glows slightly.
      // ============================================================

      colors: {

        // Primary — deep burnt terracotta
        // Pushed from HSL 16 toward 12 — warmer, more intimate
        primary: {
          50:  'hsl(12, 80%, 97%)',
          100: 'hsl(12, 75%, 93%)',
          200: 'hsl(12, 70%, 84%)',
          300: 'hsl(12, 68%, 72%)',
          400: 'hsl(12, 65%, 58%)',
          500: 'hsl(12, 72%, 45%)',   // main brand — deeper than before
          600: 'hsl(12, 68%, 37%)',
          700: 'hsl(12, 65%, 29%)',
          800: 'hsl(12, 60%, 21%)',
          900: 'hsl(12, 55%, 14%)',
        },

        // Neutral — warm cream, not grey
        // Background feels like aged paper, not a white wall
        neutral: {
          50:  'hsl(35, 25%, 97%)',   // page background — warm cream
          100: 'hsl(35, 20%, 93%)',
          200: 'hsl(35, 15%, 87%)',
          300: 'hsl(35, 12%, 76%)',
          400: 'hsl(35, 8%, 62%)',
          500: 'hsl(35, 6%, 50%)',
          600: 'hsl(35, 5%, 38%)',
          700: 'hsl(35, 5%, 28%)',
          800: 'hsl(35, 4%, 18%)',
          900: 'hsl(35, 4%, 10%)',   // primary text — almost black, never pure
        },

        // Semantic
        success: 'hsl(145, 50%, 35%)',   // experienced — muted, not garish
        warning: 'hsl(38, 85%, 45%)',
        error:   'hsl(0, 65%, 45%)',
        info:    'hsl(210, 65%, 45%)',

        // Reaction colours — jewel-toned, rich
        reaction: {
          loved: 'hsl(348, 70%, 48%)',   // deep rose — warm not pink
          good:  'hsl(145, 50%, 35%)',   // deep sage green
          okay:  'hsl(38, 65%, 45%)',    // warm amber
          skip:  'hsl(35, 6%, 50%)',     // neutral — same as neutral-500
        },

        // Category accent colours — jewel-toned, Wong Kar-wai depth
        // Each feels like a different mood in the same film
        category: {
          restaurant: 'hsl(12, 72%, 45%)',    // deep terracotta — same as primary
          bar:        'hsl(272, 45%, 35%)',   // deep plum
          film:       'hsl(228, 60%, 35%)',   // deep indigo
          tv:         'hsl(198, 65%, 35%)',   // deep teal blue
          music:      'hsl(338, 58%, 38%)',   // deep rose burgundy
          book:       'hsl(32, 68%, 35%)',    // rich amber
          city:       'hsl(158, 48%, 30%)',   // deep sage
          activity:   'hsl(178, 52%, 28%)',   // deep teal
          podcast:    'hsl(262, 52%, 38%)',   // deep violet
          person:     'hsl(22, 62%, 38%)',    // warm burnt orange
        },

        // Surface colours — warm, never clinical white
        surface: {
          page:   'hsl(35, 25%, 97%)',    // page background
          card:   'hsl(30, 20%, 99%)',    // card background — barely warm
          border: 'hsl(35, 15%, 87%)',    // subtle borders
          overlay: 'hsla(35, 20%, 10%, 0.6)',  // frosted overlay for signin moment
        },
      },

      // ============================================================
      // SPACING — base 4px, consistent throughout
      // ============================================================

      spacing: {
        px:  '1px',
        0.5: '2px',
        1:   '4px',
        1.5: '6px',
        2:   '8px',
        2.5: '10px',
        3:   '12px',
        3.5: '14px',
        4:   '16px',
        5:   '20px',
        6:   '24px',
        7:   '28px',
        8:   '32px',
        9:   '36px',
        10:  '40px',
        11:  '44px',   // minimum tap target
        12:  '48px',
        14:  '56px',   // FAB size
        16:  '64px',   // nav height
        20:  '80px',
        24:  '96px',
        28:  '112px',
        32:  '128px',
      },

      // ============================================================
      // LAYOUT
      // ============================================================

      maxWidth: {
        container: '480px',   // max content width — mobile feel on desktop
      },

      height: {
        nav:     '64px',    // bottom navigation
        fab:     '56px',    // floating action button
        'card-image-poster': '40%',   // visual category card image
        'card-image-split':  '100%',  // split card image (full height of card)
      },

      // ============================================================
      // BORDER RADIUS
      // Slightly more generous than before — warmer, more inviting
      // ============================================================

      borderRadius: {
        sm:   '6px',
        DEFAULT: '8px',
        md:   '10px',
        lg:   '12px',
        xl:   '16px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px',
      },

      // ============================================================
      // SHADOWS — warm tinted, never grey
      // ============================================================

      boxShadow: {
        'card':    '0 2px 8px hsla(35, 20%, 10%, 0.08), 0 0 1px hsla(35, 20%, 10%, 0.04)',
        'card-hover': '0 8px 24px hsla(35, 20%, 10%, 0.12), 0 0 1px hsla(35, 20%, 10%, 0.06)',
        'sheet':   '0 -4px 32px hsla(35, 20%, 10%, 0.12)',
        'fab':     '0 4px 16px hsla(12, 72%, 45%, 0.35)',   // terracotta tinted
        'nav':     '0 -1px 0 hsla(35, 15%, 87%, 1)',
      },

      // ============================================================
      // ANIMATIONS — Wong Kar-wai pacing
      // Slower and more deliberate than standard UI animations.
      // Things arrive — they don't snap.
      // ============================================================

      keyframes: {

        // Card enters the vault — slides up from slight offset, fades in
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },

        // Card saves to vault — scales down and travels to position
        // Used for the confirmation → vault animation
        'card-save': {
          '0%':   { opacity: '1', transform: 'scale(1) translateY(0)' },
          '60%':  { opacity: '0.8', transform: 'scale(0.85) translateY(8px)' },
          '100%': { opacity: '0', transform: 'scale(0.3) translateY(40px)' },
        },

        // Bottom sheet slides up from off-screen
        'sheet-enter': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },

        // Bottom sheet exits down
        'sheet-exit': {
          from: { transform: 'translateY(0)' },
          to:   { transform: 'translateY(100%)' },
        },

        // Radial menu options bloom outward
        'radial-bloom': {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },

        // Fade in — used for overlays, tooltips, nudge questions
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },

        // Fade out
        'fade-out': {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },

        // Subtle pulse — used for loading states
        'pulse-warm': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },

        // Save confirmation — brief scale pulse on the saved card
        'save-confirm': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },

        // Nudge question slides down from top of home screen
        'nudge-enter': {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },

        // Tooltip appears and disappears
        'tooltip-life': {
          '0%':   { opacity: '0' },
          '15%':  { opacity: '1' },
          '85%':  { opacity: '1' },
          '100%': { opacity: '0' },
        },

        // Category bar selection — active chip scales slightly
        'chip-select': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },

      animation: {
        // Card animations
        'card-enter':   'card-enter 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        'card-save':    'card-save 350ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'save-confirm': 'save-confirm 200ms ease-out',

        // Sheet animations
        'sheet-enter':  'sheet-enter 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-exit':   'sheet-exit 250ms cubic-bezier(0.4, 0, 1, 1)',

        // Radial menu
        'radial-bloom': 'radial-bloom 200ms cubic-bezier(0.16, 1, 0.3, 1)',

        // Fade animations
        'fade-in':      'fade-in 250ms ease-out',
        'fade-out':     'fade-out 200ms ease-in',

        // Loading
        'pulse-warm':   'pulse-warm 1.8s ease-in-out infinite',

        // Nudge and tooltip
        'nudge-enter':  'nudge-enter 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'tooltip-life': 'tooltip-life 4000ms ease-in-out forwards',

        // Category bar
        'chip-select':  'chip-select 150ms ease-out',
      },

      // ============================================================
      // TRANSITIONS — for hover and state changes
      // ============================================================

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '350': '350ms',
      },

      // ============================================================
      // BACKDROP BLUR — for the signin overlay moment
      // ============================================================

      backdropBlur: {
        'card': '8px',    // subtle blur behind signin overlay
      },
    },
  },
  plugins: [],
}

export default config
