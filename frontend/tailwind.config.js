/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        finpath: {
          bg: '#0B1120',
          sidebar: '#101827',
          card: '#151F30',
          border: '#1E293B',
          primary: '#3B82F6',
          cyan: '#22D3EE',
          success: '#22C55E',
          warning: '#F59E0B',
          failure: '#EF4444',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

