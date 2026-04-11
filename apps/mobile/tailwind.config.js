/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2B7A9E",
          secondary: "#4CAF7D",
          accent: "#F5A623",
          background: "#F7F9FC",
          text: "#1A2B3C",
        },
      },
    },
  },
  plugins: [],
};
