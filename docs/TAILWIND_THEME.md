# Tailwind Theme

This project uses Tailwind CSS 4 with a small Petromac brand layer in the root `tailwind.config.ts` and global overrides in `src/app/globals.css`.

## Fonts

- **Body:** Inter, loaded through `next/font/google` in `src/app/layout.tsx`
- **Headings:** IBM Plex Sans, also loaded in `src/app/layout.tsx`
- **Tailwind utilities:** `font-sans` maps to Inter and `font-heading` maps to IBM Plex Sans

## Brand Tokens

The configured brand tokens are:

```ts
colors: {
  brand: "#1E4A9A",
  brandblack: "#1D1D1B",
  brandgray: "#575756",
  accent: "#F59E0B",
}
```

Use Tailwind `slate` for extended neutral UI states. Prefer opacity utilities such as `bg-brand/90` for hover or dim states instead of inventing new brand shades.

## Config Scope

The root `tailwind.config.ts` scans:

- `src/app/**/*.{ts,tsx}`
- `src/components/**/*.{ts,tsx}`
- `src/features/**/*.{ts,tsx}`
- `src/pages/**/*.{ts,tsx}`
- `src/shared/**/*.{ts,tsx}`

Do not add a second Tailwind config file.

## Usage Guidelines

- Use `font-heading` on major headings.
- Use `bg-brand text-white hover:bg-brand/90` for primary CTAs.
- Use `text-brand` for links or focused emphasis on light backgrounds.
- Keep operational tools and kiosk surfaces restrained: slate backgrounds, clear hierarchy, and brand blue for actions.
- Maintain visible focus states for interactive controls.

## Global CSS

`src/app/globals.css` imports Tailwind and defines a few project utilities:

- Forced `.bg-brand` and `.text-brand` color overrides
- Horizontal scrollbar hiding via `.no-scrollbar`
- Flip-card 3D helpers used by team cards
