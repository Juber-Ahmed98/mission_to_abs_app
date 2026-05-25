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
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs: ['12px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.45' }],
        base: ['15px', { lineHeight: '1.5' }],
        lg: ['17px', { lineHeight: '1.45' }],
        xl: ['20px', { lineHeight: '1.35' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '4xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '5xl': ['64px', { lineHeight: '1', letterSpacing: '-0.02em' }],
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
      },
      animation: {
        'ring-pulse': 'ring-pulse 1.6s cubic-bezier(0.32, 0.72, 0, 1) infinite',
        'fade-up': 'fade-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
      },
    },
  },
  plugins: [],
};
