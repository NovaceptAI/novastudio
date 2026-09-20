/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
    },
    extend: {
      colors: {
        canvas: 'hsl(var(--canvas) / <alpha-value>)',
        subtle: 'hsl(var(--subtle) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        'border-strong': 'hsl(var(--border-strong) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        foreground: 'hsl(var(--fg) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-fg) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--fg) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar) / <alpha-value>)',
          hover: 'hsl(var(--sidebar-hover) / <alpha-value>)',
          active: 'hsl(var(--sidebar-active) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-fg) / <alpha-value>)',
          muted: 'hsl(var(--sidebar-muted) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          hover: 'hsl(var(--primary-hover) / <alpha-value>)',
          soft: 'hsl(var(--primary-soft) / <alpha-value>)',
          'soft-foreground': 'hsl(var(--primary-soft-fg) / <alpha-value>)',
          foreground: 'hsl(0 0% 100% / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          soft: 'hsl(var(--success-soft) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          soft: 'hsl(var(--warning-soft) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          soft: 'hsl(var(--danger-soft) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          soft: 'hsl(var(--info-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 hsl(40 10% 20% / 0.04), 0 1px 3px 0 hsl(40 10% 20% / 0.04)',
        pop: '0 4px 6px -1px hsl(40 10% 20% / 0.07), 0 10px 20px -4px hsl(40 10% 20% / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 140ms ease-out',
        'slide-up': 'slide-up 160ms ease-out',
        'slide-in-right': 'slide-in-right 180ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
