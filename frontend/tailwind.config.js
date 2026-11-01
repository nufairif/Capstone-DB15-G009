/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "soft": "0 10px 35px -5px rgba(17, 17, 26, 0.04), 0 4px 16px -4px rgba(17, 17, 26, 0.02)",
        "row": "0 8px 24px -4px rgba(17, 17, 26, 0.06)",
        "tooltip": "0 10px 30px -4px rgba(0, 0, 0, 0.10)",
      },
    },
  },
  plugins: [],
}
