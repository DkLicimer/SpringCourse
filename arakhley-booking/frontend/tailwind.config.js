/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Кастомная природная палитра по ТЗ (Страница 3)
        natural: {
          blue: '#1E3A8A',      // Тёмно-синий
          sky: '#3B82F6',       // Голубой
          green: '#10B981',     // Зелёный (активный/свободный)
          wood: '#8B5A2B',      // Древесный
          sand: '#F5E6D3',      // Песочный (фоновые элементы)
          dark: '#1F2937',      // Тёмно-серый для текста
        }
      }
    },
  },
  plugins: [],
}