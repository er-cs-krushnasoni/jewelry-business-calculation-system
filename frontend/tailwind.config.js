/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          50: '#fef7e7',
          100: '#fdecc4',
          200: '#fbdf9d',
          300: '#f9d176',
          400: '#f7c759',
          500: '#f5bd3c', // Gold base
          600: '#d4a433',
          700: '#b38829',
          800: '#926c20',
          900: '#715316',
        },
        // Secondary - Adaptive metal tones
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Bright gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        silver: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // Silver base
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Luxury accent colors
        luxury: {
          cream: '#FFF8F0',
          pearl: '#FAFAF9',
          charcoal: '#1C1C1E',
          midnight: '#0A0A0B',
          rose: '#B76E79',
          platinum: '#E5E4E2',
        },
        // Semantic colors
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      boxShadow: {
        'luxury': '0 4px 20px rgba(245, 189, 60, 0.15)',
        'luxury-lg': '0 10px 40px rgba(245, 189, 60, 0.25)',
        'gold': '0 4px 20px rgba(245, 158, 11, 0.2)',
        'silver': '0 4px 20px rgba(100, 116, 139, 0.15)',
        'inner-luxury': 'inset 0 2px 8px rgba(0, 0, 0, 0.06)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.4)',
        'glow-silver': '0 0 20px rgba(148, 163, 184, 0.4)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        'gradient-silver': 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)',
        'gradient-luxury': 'linear-gradient(135deg, #f5bd3c 0%, #d4a433 50%, #b38829 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1C1C1E 0%, #0A0A0B 100%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}