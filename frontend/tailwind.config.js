/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cipher-bg': '#1A1A2E',
        'cipher-accent': '#E94560',
        'cipher-green': '#00FF41',
        'cipher-dark-panel': '#16213E',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
