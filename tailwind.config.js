/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // IC3 Brand — Deep Navy Blue
        primary: {
          50:  '#eef4ff',
          100: '#d9e8ff',
          200: '#bcd4fe',
          300: '#8eb8fd',
          400: '#5993fa',
          500: '#3370f6',
          600: '#1a50eb',
          700: '#133cd8',
          800: '#1632af',
          900: '#182e89',
          950: '#131f54',
        },
        // IC3 Accent — Cyan / Teal
        accent: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Gold / Amber highlight
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Dark surfaces
        navy: {
          800: '#0f172a',
          850: '#0d1424',
          900: '#080d1a',
          950: '#040810',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'ic3-gradient': 'linear-gradient(135deg, #0f172a 0%, #182e89 50%, #0e7490 100%)',
        'ic3-card':     'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'ic3-glow':     'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(51,112,246,0.3), transparent)',
      },
      boxShadow: {
        'glow-blue':  '0 0 30px rgba(51,112,246,0.35)',
        'glow-cyan':  '0 0 20px rgba(6,182,212,0.3)',
        'card':       '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.14)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease both',
        'slide-up':  'slideUp 0.4s ease both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
