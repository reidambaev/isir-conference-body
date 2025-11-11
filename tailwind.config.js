/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1a3a6c",
        secondary: "#f3b72c",
        accent: "#e9ecef",
      },
    },
  },
  plugins: [],
};
