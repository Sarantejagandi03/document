/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0f172a",
          mist: "#dbeafe",
          aqua: "#6ee7f9",
          lime: "#d9f99d",
          sand: "#fef3c7",
        },
      },
      fontFamily: {
        display: ["Georgia", "ui-serif", "serif"],
        body: ["Trebuchet MS", "Segoe UI", "sans-serif"],
        mono: ["Consolas", "Monaco", "monospace"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.16)",
      },
    },
  },
  plugins: [],
};
