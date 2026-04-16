/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#f0faf5',
          200: '#a8edcc',
          500: '#22a06b',
          700: '#1a6647',
          800: '#145239',
          900: '#0f3d2e',
        },
        gray: {
          50:  '#f8f9fa',
          100: '#f1f3f5',
          300: '#ced4da',
          500: '#6c757d',
          800: '#212529',
        },
        danger: '#d7263d',
        warning: '#f59f00',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"DM Serif Display"', 'serif'],
      }
    },
  },
  plugins: [],
}
