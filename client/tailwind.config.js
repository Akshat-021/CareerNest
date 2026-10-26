/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Toggle using class list on html element
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#f4f6fb',
          dark: '#0b0f19',
          cardLight: 'rgba(255, 255, 255, 0.75)',
          cardDark: 'rgba(17, 24, 39, 0.7)',
          accent: '#6366f1', // Indigo 500
          accentHover: '#4f46e5', // Indigo 600
          secondary: '#8b5cf6', // Violet 500
          textDark: '#f3f4f6', // Slate 50
          textLight: '#1f2937', // Gray 800
          mutedLight: '#475569', // Slate 600 (WCAG AA 5.5:1 contrast against white)
          mutedDark: '#94a3b8', // Slate 400 (WCAG AA 6.2:1 contrast against dark)
          borderLight: 'rgba(226, 232, 240, 0.8)',
          borderDark: 'rgba(31, 41, 55, 0.6)'
        },
        status: {
          success: '#10b981',
          successLight: '#059669',
          successDark: '#34d399',
          warning: '#f59e0b',
          warningLight: '#d97706',
          warningDark: '#fbbf24',
          danger: '#f43f5e',
          dangerLight: '#e11d48',
          dangerDark: '#fb7185',
          info: '#0ea5e9',
          infoLight: '#0284c7',
          infoDark: '#38bdf8'
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        glassAccent: '0 8px 32px 0 rgba(99, 102, 241, 0.15)',
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        cardHover: '0 12px 28px -4px rgba(15, 23, 42, 0.12)',
        modal: '0 24px 48px -12px rgba(0, 0, 0, 0.25)'
      }
    },
  },
  plugins: [],
}
