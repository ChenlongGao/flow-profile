/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'deep-space': {
          900: '#0B1120',
          800: '#0F172A',
          700: '#1E293B',
          600: '#334155',
        },
        'ai-blue': {
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
        },
        'func': {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#6366F1',
        },
        'accent': {
          cyan: '#22D3EE',
          purple: '#8B5CF6',
          pink: '#EC4899',
          emerald: '#10B981',
        },
        'text-primary': '#F1F5F9',
        'text-secondary': '#CBD5E1',
        'text-muted': '#64748B',
      },
      fontSize: {
        'l1': ['40px', { lineHeight: '48px', fontWeight: '700' }],
        'l2': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'l3': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        'l4': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'l5': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 40px rgba(14, 165, 233, 0.12)',
        'glow': '0 0 20px rgba(14, 165, 233, 0.2)',
        'glow-sm': '0 0 10px rgba(14, 165, 233, 0.15)',
      },
      borderRadius: {
        'card': '12px',
        'card-sm': '8px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.5)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'breathe': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
