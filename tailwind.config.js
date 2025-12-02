/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['IBM Plex Mono', 'monospace'],
        body: ['Noto Sans JP', 'sans-serif'],
      },
      colors: {
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        secondary: 'var(--color-secondary)',
      },
    },
  },
  plugins: [],
}

