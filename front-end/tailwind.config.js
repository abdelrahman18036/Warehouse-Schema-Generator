// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enable dark mode via class
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        titanite: {
          DEFAULT: "#0f766e", // Green Titanite color
          light: "#2dd4bf",
          dark: "#0d9488",
        },
        background: "#121212", // Dark background
        surface: "#1e1e1e", // Surface elements
      },
    },
  },
  plugins: [],
};
