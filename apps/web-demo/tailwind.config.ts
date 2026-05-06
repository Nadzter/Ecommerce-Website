import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A2540',
          50: '#F4F7FB',
          100: '#E1E9F2',
          200: '#C2D2E4',
          300: '#9CB3CD',
          400: '#6D87A6',
          500: '#41597C',
          600: '#1F365A',
          700: '#0F2647',
          800: '#0A2540',
          900: '#06182C',
        },
        accent: {
          DEFAULT: '#00C2A8',
          50: '#E6FBF6',
          100: '#C6F2E8',
          200: '#8DE6D2',
          300: '#54D9BC',
          400: '#1FCEAA',
          500: '#00B398',
          600: '#008F79',
          700: '#006A5A',
          800: '#00463C',
          900: '#00231E',
        },
        sand: {
          DEFAULT: '#F8F6F1',
          50: '#FBFAF6',
          100: '#F8F6F1',
          200: '#EFE9DC',
          300: '#DCD2BC',
          400: '#B6A786',
          500: '#8C7A55',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        phone: '0 25px 60px -25px rgba(10, 37, 64, 0.45), 0 10px 30px -15px rgba(10, 37, 64, 0.25)',
        soft: '0 1px 2px rgba(10, 37, 64, 0.06), 0 1px 3px rgba(10, 37, 64, 0.04)',
        card: '0 4px 14px -6px rgba(10, 37, 64, 0.12)',
      },
      keyframes: {
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
