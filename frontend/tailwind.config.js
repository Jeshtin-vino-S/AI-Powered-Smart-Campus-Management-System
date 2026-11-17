/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#061129',
          900: '#0A1629',
          850: '#0E1D38',
          800: '#152A4A',
          700: '#1C355E',
        },
        primary: {
          50: '#EEF5FF',
          100: '#E0EDFE',
          200: '#BAD9FD',
          300: '#7EBAFB',
          400: '#38BDF8',
          500: '#1E6BFF',
          600: '#1354DB',
          700: '#1041B2',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'pill': '0 4px 16px 0 rgba(30, 107, 255, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
