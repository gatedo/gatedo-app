/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      colors: {
        gatedo: {
          bg: '#efeeff',
          primary: '#823fff',
          accent: '#e7ff60',
          card: '#FFFFFF',
          text: '#1A1A1A',

          vet: '#aaffdc',
          store: '#c0e8ff',
          creative: '#e3c1ff',
          community: '#ffc7ad',

          dark: '#4B40C6',
          accentNeon: '#e7ff60',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#0EA5E9',
        },
      },

      fontFamily: {
        sans: ['"Nunito"', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.75rem' }],
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },

      boxShadow: {
        float: '0 10px 30px -5px rgba(74, 58, 255, 0.15)',
        card: '0 2px 16px rgba(97, 88, 202, 0.08)',
        purple: '0 8px 24px rgba(97, 88, 202, 0.35)',
        accent: '0 0 20px rgba(223, 255, 64, 0.5)',
        glow: '0 0 40px rgba(97, 88, 202, 0.25)',
      },

      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(223,255,64,0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(223,255,64,0.7)' },
        },
      },

      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) both',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
      },

      spacing: {
        nav: '88px',
        safe: '104px',
      },

      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
        200: '200',
      },
    },
  },

  plugins: [
    function ({ addUtilities }) {
      addUtilities({

        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },

        '.pb-nav': { 'padding-bottom': '88px' },
        '.pb-safe': { 'padding-bottom': '104px' },

        '.text-gradient-purple': {
          background: 'linear-gradient(135deg, #7865da, #8B5CF6)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },

        '.text-gradient-accent': {
          background: 'linear-gradient(135deg, #ebfc66, #DFFF40)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },

        '.glass': {
          background: 'rgba(255,255,255,0.12)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
        },

        '.glass-dark': {
          background: 'rgba(0,0,0,0.25)',
          'backdrop-filter': 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      });
    },
  ],
};