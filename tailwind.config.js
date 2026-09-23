/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#eef1f5",
          panel: "#ffffff",
          border: "#dde2ea",
          ink: "#1d2430",
          muted: "#68707d",
          navy: "#173a63",
          crimson: "#bd3438",
          soft: "#fdeceb",
        },
      },
      fontFamily: {
        ui: ["Inter", "system-ui", "sans-serif"],
        doc: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
