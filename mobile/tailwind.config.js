/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#059669",
          50: "#ecfdf5",
          100: "#d1fae5",
          light: "#6ee7b7",
        },
        text: {
          DEFAULT: "#111827",
          secondary: "#4b5563",
          muted: "#9ca3af",
        },
        border: {
          DEFAULT: "#e5e7eb",
          light: "#f3f4f6",
        },
      },
    },
  },
  plugins: [],
};
