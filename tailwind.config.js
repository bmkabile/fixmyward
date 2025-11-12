/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: '#007A33',
        yellow: '#FFD100',
        red: '#EF3340',
      },
    },
  },
  plugins: [],
}
