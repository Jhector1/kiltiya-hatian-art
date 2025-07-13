/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ---------- COLORS ---------- */
      colors: {
        surface: "#0b0f19", // dark base
      },

      /* ---------- BACKGROUND IMAGES ---------- */
      backgroundImage: {
        // dotted grid (one tiny dot every 20 px)
        "dot-grid":
          "radial-gradient(circle at 0 0, rgba(255,255,255,0.10) 1px, transparent 1px)",

        // beveled tile grid (lines every 16 px)
        "tile-grid":
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 16px), \
           repeating-linear-gradient(180deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 16px)",

        // subtle corner glow
        "hero-radial":
          "radial-gradient(circle at 25% 25%, rgba(0,255,195,0.10), transparent 45%), \
           radial-gradient(circle at 75% 75%, rgba(0,140,255,0.10), transparent 50%)",
      },

      /* ---------- BACKGROUND SIZE ---------- */
      backgroundSize: {
        "dot-grid": "20px 20px", // <— only size values here
      },
    },
  },
  plugins: [],
};
