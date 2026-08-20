# Brand masters

Editable source artwork for the logos published under
`public/images/logos/`. Unlike the other `sources/` folders this one is **not**
a pipeline drop zone and **is** committed — there is no script that regenerates
these, so the master is the only copy.

| File                | What it is                                                                        |
| ------------------- | --------------------------------------------------------------------------------- |
| `athena-logo-v2.ai` | Athena hornbill logo, v2 (Aug 2026). 3 artboards: mark, lockup, lockup + tagline. |

## Publishing a new version

Export each artboard to SVG, then per variant:

1. Strip InDesign/Illustrator's generated `.uuid-*` class + `<style>` block and
   put a single `fill` on the root `<svg>` — that is what makes the white
   variant a one-value change rather than a find-and-replace over every path.
2. Crop the `viewBox` to the artwork. Illustrator exports the whole artboard,
   so an uncropped file carries invisible padding that no CSS can remove and
   the logo never sits where you place it.
3. Ship a blue (`#0c55a6`) and a `-white` variant of each — the site puts these
   on both light cards and dark navy bands.

The PNGs alongside them are fallbacks for contexts that can't take an SVG
(email HTML, OG images); trim the transparent margin before saving.
