# Catalog Restructure — Three-Level Drill-Down (Jul 2026)

Working plan. Committed so any session (or usage-limit reset) can resume.
**Resume rule: find the first unchecked phase below, read its notes, continue.**
Each phase ends with build green + commit. Delete this file in Phase 6.

Goals (Rajesh): SEO, page speed, user discovery, and graceful updates when a
new catalog PDF/IDML edition arrives (usually new devices or spec updates).

## Target architecture

- **Level 1 `/catalog`** — overview: Wireline Express™ band (Tool Taxis,
  Guides & Holefinders family cards), Focus™ band (Centralisers), compact
  Well Intervention row. Device Finder v1 (hole size + purpose → model
  list) + existing search (rewired to navigate to model pages). PDF
  download/email block stays prominent ("Full specifications for every
  model"). NO individual SKUs in the page HTML.
- **Level 2 `/catalog/[category]`** — NEW routes (today categories are
  `?category=` views). Family intro + SPEC TABLES (Model / role-context /
  Hole size / Bore / Temp / Weight), rows link to model pages, one
  representative image per group. Shapes: tool-taxis = one unified 8-model
  table w/ Role + Bearing columns; guides-holefinders = Pathfinder(+HT)
  featured, then vendor sections (SLB / Halliburton / Baker Hughes);
  focus-centralisers = Open Hole + Cased Hole sections; well-intervention =
  single Accessories table. 308-redirect `/catalog?category=X` →
  `/catalog/X`; update product-page breadcrumbs + BreadcrumbList JSON-LD;
  add family pages to sitemap.
- **Level 3 `/catalog/[category]/[slug]`** — unchanged + "Other models in
  this family" table at the bottom. All 32 slugs/URLs stable.

## Data design (decided; do not relitigate)

- `catalog.json` stays generated-only (NEVER hand-edit). Corruption fixes
  (CP12 rows, "�" fractions) go into `scripts/python/catalog_config.json`
  (`replacements` map / curation) + `pnpm run data:catalog` regen — IDML
  source is in `sources/catalog/`.
- NEW `src/features/catalog/content/enrich.ts` (name flexible): build-time
  enrichment over the generated JSON —
  - slug-keyed curation map: `vendor` ('slb'|'halliburton'|'baker-hughes'|
    'universal'), `purpose` ('orient'|'convey'|'centralise'|
    'formation-testing'|'well-access'|'intervention'), optional
    `role`/`bearing` labels for the taxi table.
  - spec-string parser deriving `holeMinIn/holeMaxIn/boreIn/tempF/weightLbs`
    (fraction-aware: 9-5/8" etc.; widest range across variants), plus a
    per-slug override map for values the parser can't get; originals
    untouched for display.
  - fail-soft for future editions: unknown new slugs get defaults +
    build-time console warning listing slugs missing curation.
- well-intervention `group: ""` → display-map to "Accessories" in the
  enrichment layer (JSON stays as generated).

## Phases

- [x] **Phase 0 — Verify against the PDF, record findings here.**
      Extract text from `public/flipbooks/catalog/petromac-product-catalog.pdf`.
      Confirm: (a) vendor mapping for the 12 fixed-angle guide products,
      (b) CP12 correct spec rows, (c) inventory of every corrupted fraction
      char across catalog.json. Write findings into "Phase 0 findings" below.
      No code changes. Commit doc.
- [x] **Phase 1 — Data layer.** (done 2026-07-27)
      catalog_config.json corruption fixes + regen; enrich.ts (curation map
      from Phase 0 findings, parser, overrides); accessors: families list w/
      computed counts, per-family model rows, finder index; types. Unit-ish
      sanity via a small node script or typecheck-time asserts. Commit.
- [ ] **Phase 2 — Family pages.**
      `/catalog/[category]/page.tsx` (SSG, generateStaticParams for 4 slugs)
      with the four shapes; redirects `?category=` → path (next.config or in
      /catalog page); update product breadcrumbs + JSON-LD to the family URL;
      sitemap adds 4 URLs. Commit.
- [ ] **Phase 3 — Overview rebuild.**
      Replace CatalogBrowser workspace with bands/family cards (computed
      counts, taglines from JSON categories[]), PDF block + caption, search
      navigates to model pages. Metadata: description mentions product lines,
      not devices. Commit.
- [ ] **Phase 4 — Device Finder v1.**
      Client island on the overview: hole-size input + presets (6, 7, 8.5,
      9-5/8, 12.25, 17.5) + purpose dropdown → result list (model, family,
      summary, hole range) linking to model pages. SSR = inert inputs, zero
      SKU names in HTML. Commit.
- [ ] **Phase 5 — Model pages.**
      "Other models in this family" table (same columns as Level 2) at the
      bottom of `[slug]/page.tsx`. Commit.
- [ ] **Phase 6 — Cleanup, docs, verify.**
      Retire dead CatalogBrowser/pane code; update CLAUDE.md, ARCHITECTURE,
      ADMIN (§2b note re enrichment), DECISIONS; run the full VERIFY list
      below; delete this file. Commit.

## VERIFY checklist (Phase 6)

- Build passes. All 32 model URLs 200 (script the check).
- curl /catalog → family cards + taglines + computed counts in raw HTML;
  no SKU names in markup.
- curl /catalog/tool-taxis → all 8 models, one table, Role column.
- curl /catalog/guides-holefinders → Pathfinder featured + three vendor
  sections in raw HTML.
- Finder: 8.5 + convey → conveyance taxis; 6 → in-line/slim devices.
- Search finds models by name and spec text; selection navigates.
- `?category=` URLs redirect. Sitemap has 4 family URLs.
- Report applied vendor mapping + any spec values not verifiable in PDF.

## Phase 0 findings

**Vendor mapping — VERIFIED against PDF TOC (page 5), by slug:**

- `universal`: pathfinder, pathfinder-ht ("UNIVERSAL HOLE FINDER")
- `slb` (9, "FIXED ANGLE GUIDE FOR SLB"): ahfc, hf-ait-zait, shf-ait,
  hf-qait, hf-fmi, shf-fmi, hf8-msct, hf6-mdt, hf9-bn6
- `halliburton` (2): hf9j, hf9-acrt
- `baker-hughes` (1): hf-b-wts

**Corrupted fraction glyphs:** 120 `�` occurrences in catalog.json. The �
is a custom fraction-slash glyph in the print font (pypdf shows the same
char, so it's a source-font mapping issue, not our extractor's bug).
Patterns → replacements: `1�2`→`1/2`, `1�4`→`1/4`, `3�4`→`3/4`,
`3�8`→`3/8`, `5�8`→`5/8`, `3�16`→`3/16`. Specials: `10-�/₈"` → `10-1/8"`
(PDF prints "10-1/ ₈""), `6- ¹�8”` → `6-1/8”` (verify page in Phase 1),
`14 4�4”` → likely `14-3/4”` typo — VERIFY against source PDF page in
Phase 1 before deciding. Fix location: replacements map in
scripts/python/catalog_config.json + regen (confirm the build script
applies replacements to spec values; extend if needed).

**CP12 "malformed" rows decoded:** the empty-label rows are the print
table's own header rows ("Bit Size:" / "Tool housing OD:" as a value row)
— structure is faithful to print and renders; only the glyphs need fixing.
The split "Minimum Hole Size" (label row + `10-⅝"` / `10-�/₈"` value row)
matches the PDF (Open Hole 10-5/8" / Cased hole 10-1/8").

**PDF-verified CP12 reference values:** weight 45 lbs, length 16",
max OD 11-3/4", collapsed 9.8", min hole OH 10-5/8" / CH 10-1/8",
temp 400°F, pressure 30,000 psi, taxi bore 4-1/2", max load 500 lbs.

**Category slugs for Level 2 routes:** tool-taxis, guides-holefinders,
focus-centralisers, well-intervention (from catalog.json categories[]).
Guides groups today: "Pathfinder" / "Fixed Angle Guides" — vendor field
will subdivide the latter.

## Phase 1 notes (for later phases)

- Corruption: fixed at the pipeline (fraction-glyph replacements in
  catalog_config.json + spec-table titles now pass through replacements in
  build_catalog_content.py). catalog.json regenerated — zero `�` remain.
  `14 4�4”` → `14-3/4` (PDF prints 14.75"), `¹�8`/`�/₈` → `1/8` (verified
  on PDF pages 38/39 and CP12 p42).
- `src/features/catalog/content/enrich.ts` is the website layer. Exports:
  `enrichedProducts`, `getEnriched(slug)`, `enrichedInCategory(cat)`,
  `familySummaries()` (overview cards: counts/groups/flagship image),
  `familyTableRows(cat)` (Level-2 table rows: models/role/bearing/vendor/
  holeRange/bore/temp/weight display strings), `buildFinderIndex()`
  (numeric fields + purpose for the finder), `PURPOSE_LABELS`,
  `formatInches`, `formatHoleRange`.
- Parser reads Min/Max Hole|Casing|Restriction Size, Bore, Temperature,
  Weight; normalizes vulgar + superscript/subscript fractions.
  PARSE_OVERRIDES (PDF-verified): cp12 10-1/8"–17-1/2", cp8 7-1/2"–8-1/2",
  ca7 7", cx9 7"–9-5/8". Bearing derived from model prefixes (TTA/TTB).
- New products in future editions: defaults + build-time console warning
  listing slugs missing curation.

## Session log

- 2026-07-27: plan written, phases agreed with Rajesh (SEO/speed/discovery/
  graceful-updates priorities confirmed; enrichment-layer approach approved).
