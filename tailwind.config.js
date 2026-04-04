/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          dark: '#5C3D2E',
          medium: '#8B6F47',
          light: '#D2B48C',
          cream: '#F5E6D3',
        },
        cream: {
          50: '#FFFDF9',
          100: '#FDF6EE',
          200: '#F9ECDA',
          300: '#F5E0C4',
          400: '#EECFA3',
        },
      },
      boxShadow: {
        'coffee': '0 4px 15px rgba(111, 78, 55, 0.15)',
        'coffee-lg': '0 8px 30px rgba(111, 78, 55, 0.25)',
        'coffee-glow': '0 0 40px rgba(111, 78, 55, 0.2)',
        'glass': '0 8px 32px rgba(92, 61, 46, 0.12)',
        'glass-lg': '0 16px 48px rgba(92, 61, 46, 0.18)',
        'glass-inset': 'inset 0 1px 0 rgba(255,255,255,0.4)',
        'btn-glow': '0 4px 20px rgba(92, 61, 46, 0.35), 0 0 60px rgba(92, 61, 46, 0.1)',
        'btn-glow-hover': '0 8px 30px rgba(92, 61, 46, 0.45), 0 0 80px rgba(92, 61, 46, 0.15)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-lg': '30px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(92, 61, 46, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(92, 61, 46, 0.3)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
