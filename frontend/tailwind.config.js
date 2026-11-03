/** @type {import("tailwindcss").Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Space Grotesk 500/600 for display — matches landing page .sc-mark and h1
        display: ['"Space Grotesk"', 'sans-serif'],
        // Inter 400/500 for body — matches landing page base stack
        sans: ['"Inter"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0A0E14',
          900: '#0F141D',   // landing --fg
          850: '#141A24',
          800: '#1A2130',
          700: '#242C3D',
          600: '#333D52',
          500: '#4A5568',
          400: '#6B7688',   // landing --fg-faint base
          300: '#9AA4B5',
          200: '#C7CDD8',
          100: '#E8EAEF',   // landing --rule base
          50:  '#F5F6F8',   // landing --shade / body bg
        },
        signal: {
          DEFAULT: '#5B6EF5', // landing --accent
          50:  '#EEF0FE',
          100: '#DBE0FD',
          400: '#7C8CF8',
          500: '#5B6EF5',     // landing --pill-bg
          600: '#4351D6',     // landing pill hover
          700: '#333EAD',
        },
        mint: {
          DEFAULT: '#2BD9A8',
          500: '#2BD9A8',
          600: '#1FB88C',
        },
        amber: {
          DEFAULT: '#F5A623',
          500: '#F5A623',
        },
        coral: {
          DEFAULT: '#F5566B',
          500: '#F5566B',
        },
      },
      boxShadow: {
        // Landing page soft surface shadow
        soft:    '0 1px 2px rgba(15,20,29,0.04), 0 8px 24px -8px rgba(15,20,29,0.08)',
        'soft-lg':'0 4px 12px rgba(15,20,29,0.06), 0 20px 40px -12px rgba(15,20,29,0.14)',
        // Landing page pill / primary button glow — matches --accent shadow
        glow:    '0 0 0 1px rgba(91,110,245,0.15), 0 8px 24px -4px rgba(91,110,245,0.25)',
        // Inset shine on pill (from spec)
        'pill-inset': 'inset 0 1px 0 rgba(255,255,255,0.10)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeIn:       { from: { opacity: 0, transform: 'translateY(6px)' },  to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:      { from: { opacity: 0, transform: 'scale(0.96)' },      to: { opacity: 1, transform: 'scale(1)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseRing:    { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
      animation: {
        fadeIn:       'fadeIn 0.45s cubic-bezier(.22,.61,.36,1) both',
        scaleIn:      'scaleIn 0.2s cubic-bezier(.22,.61,.36,1) both',
        slideInRight: 'slideInRight 0.3s cubic-bezier(.22,.61,.36,1) both',
        pulseRing:    'pulseRing 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
