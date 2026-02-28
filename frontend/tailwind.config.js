/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gatedo: {
          bg: "#f4f3ffef",
          primary: "#7865da",
          accent: "#ebfc66",
          card: "#FFFFFF",
          text: "#1A1A1A",
          vet: "#aaffdc",
          store: "#c0e8ff",
          creative: "#e3c1ff",
          community: "#ffc7ad"
        }
      },
      fontFamily: {
        sans: ['"Nunito"', 'sans-serif'],
      },
      boxShadow: {
        'float': '0 10px 30px -5px rgba(74, 58, 255, 0.15)',
      }
    },
  },
  plugins: [],
}