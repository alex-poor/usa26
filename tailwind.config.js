/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wc: {
          gold: '#C9A84C',
          red: '#C0392B',
          dark: '#1a1a2e',
          card: '#16213e',
          border: '#0f3460',
        },
      },
    },
  },
  plugins: [],
}
