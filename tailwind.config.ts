import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", md: "2rem", lg: "2rem", xl: "3rem" },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1E4A9A", // Brand Blue (Primary)
        },
        brandblack: {
          DEFAULT: "#1D1D1B",
        },
        brandgray: {
          DEFAULT: "#575756",
        },
        // Keep Tailwind neutrals; prefer slate for body text/backgrounds
        accent: {
          DEFAULT: "#F59E0B",
        },
      },
      fontFamily: {
        // Map Next Font CSS variables → Tailwind
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"],
        heading: ["var(--font-plex)", "IBM Plex Sans", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace","SFMono-Regular","Menlo","Monaco","Consolas","Liberation Mono","Courier New","monospace"],
      },
      // Typography scale tuned for engineering tone
      fontSize: {
        xs:   ["0.75rem", { lineHeight: "1.25rem" }], // 12/20
        sm:   ["0.875rem",{ lineHeight: "1.5rem" }],  // 14/24
        base: ["1rem",    { lineHeight: "1.75rem" }], // 16/28
        lg:   ["1.125rem",{ lineHeight: "1.85rem" }], // 18/~30
        xl:   ["1.25rem", { lineHeight: "1.95rem" }], // 20/~31
        "2xl":["1.5rem",  { lineHeight: "2.1rem" }],  // 24/33.6
        "3xl":["1.875rem",{ lineHeight: "2.3rem", letterSpacing: "-0.01em" }], // 30
        "4xl":["2.25rem", { lineHeight: "2.5rem",  letterSpacing: "-0.01em" }], // 36
        "5xl":["3rem",    { lineHeight: "1.1",     letterSpacing: "-0.02em" }], // 48
        "6xl":["3.75rem", { lineHeight: "1.05",    letterSpacing: "-0.02em" }], // 60
      },
      borderRadius: { xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
      boxShadow: {
        card: "0 10px 25px -10px rgba(0,0,0,0.25)",
        subtle: "0 4px 14px -6px rgba(0,0,0,0.15)",
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [],
};

export default config;
