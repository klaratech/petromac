# Tailwind Theme: Colors & Typography (Aligned with Brandbook)

**Purpose:** Align Tailwind theme with Petromac brandbook colors and modern engineering-forward web fonts.  
**Deliverable for agent:** Implement this configuration without altering app logic. Apply colors/typography to public components (`Hero`, `ProblemSection`, `ProductTeaser`, `Footer`) and keep intranet styles minimal.

---

## 1) Fonts (Modern, slick, engineering ethos)

- **Headings:** `IBM Plex Sans` (technical/industrial, highly legible).  
- **Body:** `Inter` (clean, contemporary, excellent UI legibility).  
- **Logo:** Keep **Calibri** only inside the logo asset (SVG/PNG). Do not use Calibri site‑wide.

### Add fonts
Use Next.js font optimization:
```ts
// app/layout.tsx
import "./globals.css";
import { Inter, IBM_Plex_Sans } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-plex" });

export const metadata = { title: "Petromac" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plex.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

---

## 2) Brand Palette (from brandbook)

**Exact hex values provided:**  
- **Blue (Primary):** `#1E4A9A` (C96 M75 Y0 K0, R30 G74 B154)  
- **Black:** `#1D1D1B` (C0 M0 Y0 K100, R29 G29 B27)  
- **Grey:** `#575756` (C0 M0 Y0 K80, R87 G87 B86)  
- **White:** `#FFFFFF`

We will expose these as Tailwind tokens and keep Tailwind `slate` for extended neutrals. For hover/dim states, prefer Tailwind’s opacity utility (e.g., `bg-brand/90`) to avoid inventing unofficial shades.

---

## 3) `tailwind.config.ts` (drop-in)

> **Agent:** Create/overwrite `tailwind.config.ts` with this content (adjust `content` globs if needed).

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
    "./pages/**/*.{ts,tsx}",
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
        // Optional accent if needed for highlights; remove if not part of brand system
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
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};

export default config;
```

---

## 4) Usage Guidelines

- **Headings:** apply `font-heading` and brand blue when appropriate:
  ```tsx
  <h1 className="font-heading text-5xl md:text-6xl tracking-tight text-brand">...</h1>
  ```
- **Body:** default `font-sans` via `<body className="font-sans">` in layout.  
- **Buttons:**  
  - Primary: `bg-brand text-white hover:bg-brand/90`  
  - Secondary: `bg-slate-800 text-white hover:bg-slate-900`  
- **Text on dark:** use `text-white` or `text-slate-100`.  
- **Long-form content:** wrap with `prose prose-slate`.

---

## 5) Apply to Public Components (non-breaking)

- `Hero.tsx`: `font-heading` on the H1; primary CTA `bg-brand hover:bg-brand/90`; secondary `bg-slate-800`.  
- `ProblemSection.tsx`: titles `text-slate-900`, body `text-slate-600`, links `text-brand`.  
- `ProductTeaser.tsx`: title `font-heading text-slate-900`, CTA `bg-brand text-white`.  
- `Footer.tsx`: keep neutral `bg-slate-900 text-slate-300`.

---

## 6) Accessibility & Contrast

- Maintain AA contrast (brand blue on white meets contrast for large text and buttons).  
- Prefer `text-slate-900` on light backgrounds; `text-white` on brand/dark sections.  
- Provide `focus-visible` rings for interactive elements where needed.

---

## 7) Agent Acceptance Criteria

- Fonts wired with Next Font and mapped in Tailwind.  
- `brand`, `brandblack`, and `brandgray` tokens defined as above; no scattered hex codes in components.  
- Public components updated to reference tokens and opacity utilities (no structural refactors).  
- Build passes; visuals maintain current layout with updated colors & typography.
