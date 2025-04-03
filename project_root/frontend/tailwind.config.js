/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all relevant files in src
  ],
  theme: {
    extend: {
      // Add custom theme extensions here (colors, fonts, etc.)
      // Example:
      // colors: {
      //   primary: {
      //     DEFAULT: '#3b82f6', // blue-500
      //     dark: '#1e40af',   // blue-800
      //   },
      // },
    },
  },
  plugins: [
     // require('@tailwindcss/forms'), // Example plugin
  ],
}