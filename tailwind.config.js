// src/lab is the dev-only direction lab: its JS is dead-code-eliminated from
// production builds, so its classes must not leak into production CSS either.
const isProd = process.env.NODE_ENV === 'production';

// The house ease. JS-side source of truth is src/lib/motionTokens.ts; this
// config (outside src/) emits the CSS side, including :root --ease-apple.
const EASE_CSS = 'cubic-bezier(0.32, 0.72, 0, 1)';

/** @type {import('tailwindcss').Config} */
export default {
  content: isProd
    ? ['./index.html', './src/*.{ts,tsx}', './src/!(lab)/**/*.{ts,tsx}']
    : ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        track: 'var(--track)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',

        stage: 'var(--stage)',
        'stage-soft': 'var(--stage-soft)',
        'stage-0': 'var(--stage-0)',
        'stage-0-soft': 'var(--stage-0-soft)',
        'stage-1': 'var(--stage-1)',
        'stage-1-soft': 'var(--stage-1-soft)',
        'stage-2': 'var(--stage-2)',
        'stage-2-soft': 'var(--stage-2-soft)',
        'stage-3': 'var(--stage-3)',
        'stage-3-soft': 'var(--stage-3-soft)',
        'stage-4': 'var(--stage-4)',
        'stage-4-soft': 'var(--stage-4-soft)',

        // Deprecated v2 aliases — retired by the Phase 6–11 component sweep.
        lemon: 'var(--lemon)',
        'lemon-soft': 'var(--lemon-soft)',
        lime: 'var(--lime)',
        'lime-soft': 'var(--lime-soft)',
        tangerine: 'var(--tangerine)',
        'tangerine-soft': 'var(--tangerine-soft)',
        coral: 'var(--coral)',
        'coral-soft': 'var(--coral-soft)',
        missed: 'var(--missed)',

        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-soft': 'var(--accent-soft)',

        success: 'var(--success)',
        'success-bg': 'var(--success-bg)',
        rest: 'var(--rest)',
        'rest-bg': 'var(--rest-bg)',
        partial: 'var(--partial)',
        'partial-bg': 'var(--partial-bg)',
        failed: 'var(--failed)',
        'failed-bg': 'var(--failed-bg)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        card: 'var(--radius-card)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        lift: 'var(--shadow-lift)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        sheet: '280ms',
        slide: '340ms',
        pop: '450ms',
        fill: '500ms',
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
        xs: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        sm: ['0.8125rem', { lineHeight: '1.45' }],
        base: ['0.9375rem', { lineHeight: '1.5' }],
        lg: ['1.0625rem', { lineHeight: '1.45', fontWeight: '500' }],
        xl: ['1.25rem', { lineHeight: '1.35', fontWeight: '500' }],
        '2xl': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        '3xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        '4xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        '5xl': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      transitionTimingFunction: {
        apple: EASE_CSS,
      },
      keyframes: {
        'ring-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.18)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slot-shimmer': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'ring-pulse': `ring-pulse 1.6s ${EASE_CSS} infinite`,
        'fade-up': `fade-up 0.28s ${EASE_CSS} both`,
        'slot-shimmer': `slot-shimmer 1.2s ${EASE_CSS} infinite`,
      },
    },
  },
  plugins: [
    // Emit the CSS-side ease token once, from outside src/ — components and
    // lab CSS consume var(--ease-apple); JS consumes src/lib/motionTokens.ts.
    function easeToken({ addBase }) {
      addBase({ ':root': { '--ease-apple': EASE_CSS } });
    },
  ],
};
