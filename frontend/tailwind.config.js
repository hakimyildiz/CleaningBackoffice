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
          dark: '#0B132B', // Deep navy
          light: '#F4F7F6', // Off-white background
          accent: '#00B4D8', // Bright teal
          primary: '#1C2541', // Dark slate navy
          hover: '#0096C7' // Teal hover
        }
      }
    },
  },
  plugins: [],
}
