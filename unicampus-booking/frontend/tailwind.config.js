/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #1E3A8A)',
          accent: 'var(--brand-accent, #10B981)',
        }
      }
    },
  },
  plugins: [],
}