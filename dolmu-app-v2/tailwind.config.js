/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'sheet': '0 -10px 30px -5px rgba(15, 23, 42, 0.18)',
        'sheet-dark': '0 -10px 35px -5px rgba(0, 0, 0, 0.65)',
      },
    },
  },
  plugins: [],
};
