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
          accent: '#6366f1', // Indigo
          secondary: '#8b5cf6', // Violet
          textDark: '#f3f4f6',
          textLight: '#1f2937'
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        glassAccent: '0 8px 32px 0 rgba(99, 102, 241, 0.15)',
      }
    },
  },
  plugins: [],
}
