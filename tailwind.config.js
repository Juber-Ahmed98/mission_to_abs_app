/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',

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
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.32, 0.72, 0, 1)',
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
        'ring-pulse': 'ring-pulse 1.6s cubic-bezier(0.32, 0.72, 0, 1) infinite',
        'fade-up': 'fade-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
        'slot-shimmer': 'slot-shimmer 1.2s cubic-bezier(0.32, 0.72, 0, 1) infinite',
      },
    },
  },
  plugins: [],
};
