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
        mission: {
          bg: '#080d1a',
          surface: '#0d1527',
          surfaceHover: '#141f36',
          card: '#101a30',
          border: '#1f2e4d',
          borderLight: '#2c3e66',
          accent: '#6366f1',
          accentHover: '#4f46e5',
          cyan: '#06b6d4',
          cyanHover: '#0891b2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
