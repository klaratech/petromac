/**
 * Legacy-URL resolution for the WordPress → Next.js migration (Jul 2026).
 *
 * WordPress served every page with a TRAILING SLASH (`/contacts/`), and those
 * are the URLs Google has indexed. Next's built-in trailing-slash handling
 * runs before both `redirects()` in next.config and the proxy, so a request
 * for `/contacts/` was normalised to `/contacts` first and only then matched
 * against the redirect table — turning every legacy hit into a 308 → 301
 * chain at best, and a plain 404 when no rule existed for the slashless form.
 *
 * So `skipTrailingSlashRedirect` is ON in next.config.ts and slash handling
 * lives here instead, in the same pass as the legacy lookup. That is what
 * makes `/contacts/` and `/contacts` BOTH resolve in a single 301 hop.
 *
 * This module is deliberately free of Next imports: it is pure string logic
 * so `redirects.test.ts` can assert the whole mapping table directly.
 * `src/proxy.ts` is the thin adapter that turns a resolution into a response.
 */

/** What the proxy should do with a request. `null` means "leave it alone". */
export type LegacyResolution =
  | { type: 'redirect'; location: string; status: 301 | 307 | 308 }
  | { type: 'gone' }
  | { type: 'notFound' }
  | null;

/**
 * Paths the proxy never touches. Kiosk/intranet, the API and the OAuth
 * callbacks carry their own query params (`?lane=`, `?sd=`, `?code=`,
 * `?returnTo=`) and are robots-Disallowed anyway, so none of the SEO rules
 * below should apply to them.
 */
const UNTOUCHED_PREFIXES = ['/_next', '/api', '/auth', '/intranet'];

/**
 * Static asset trees. These are files, never trailing-slashed, and some are
 * fetched by the kiosk service worker with cache-busting query strings — the
 * unrecognised-param rule must not touch them. (`/patent_pdfs` is NOT here:
 * it has rename redirects of its own, handled before this is consulted.)
 */
const ASSET_PREFIXES = [
  '/images',
  '/videos',
  '/models',
  '/draco',
  '/icons',
  '/data',
  '/flipbooks',
  '/fonts',
];

/**
 * Legacy WordPress paths → their home in the current app. Keys are slashless
 * and lower-case; both `/x` and `/x/` resolve through them.
 *
 * The click/impression figures are from the 30 Jul 2026 Search Console audit
 * (last 6 months) and are why these are P0: they were live traffic 404ing.
 */
/**
 * Catalog product pages folded into another product's page. Kept separate
 * from LEGACY_PATHS because these are not WordPress-era URLs — they are our
 * own pages, indexed and live, retired by an editorial merge. Add a line here
 * whenever a slug is added to MERGED_INTO, or the old URL 404s.
 */
export const MERGED_PRODUCT_PATHS: Record<string, string> = {
  // Near-duplicate of TTB-S75/S85 (0.67 Jaccard): identical description,
  // applications, materials and standoff tables. Aug 2026.
  '/catalog/tool-taxis/ttb-s75u-ttb-s85': '/catalog/tool-taxis/ttb-s75-ttb-s85',
};

export const LEGACY_PATHS: Record<string, string> = {
  '/contacts': '/contact', // 59 clicks / 1,045 impressions
  '/patents': '/about/patents', // 24 clicks / 438 impressions
  '/origins': '/about', // 7 clicks / 429 impressions
  '/publications': '/about/publications', // 123 impressions
  '/privacy-policy': '/privacy',
  '/terms-of-use': '/terms',
  // WP's "download" page was the catalog-PDF landing page.
  '/download': '/catalog',
  // WP taxonomy archives. Both listed success stories, so both land on the index.
  '/category/orientation': '/success-stories',
  '/author/adm_petromac': '/success-stories',
  // The public success-stories flipbook, retired Jul 2026. (Bare
  // /success-stories needs no entry — it has been the REAL route since the
  // Aug 2026 rename; an entry here would redirect the page to itself.)
  '/success-stories/flipbook': '/success-stories',
};

/**
 * The 21 case studies WordPress served at ROOT-level slugs
 * (petromac.co.nz/<slug>/). Frozen: these must stay in step with
 * src/features/case-studies/content/case-studies.json — the slugs were kept
 * deliberately when the PDF-derived pages replaced the WP content.
 */
export const LEGACY_CASE_STUDY_SLUGS = [
  'cast-cbl-successfully-deployed-to-82-deviation-in-norway',
  'cement-evaluation-without-gemco-centralizers-to-85-deviation-in-ksa',
  'elimination-of-pcl-saves-8-days-of-rig-time-in-mexico',
  'expanding-logging-program',
  'formation-testing-5000psi-overbalance',
  'hermes-drag-planner-convinces-client-to-run-mdt-in-nigeria',
  'high-quality-x-y-density-data-in-deviated-wellbores-in-new-zealand',
  'high-side-sampling',
  'holefinder-success-in-azerbaijan-2',
  'image-tool-rotation',
  'mril-d-conveyance-in-highly-deviated-casings-in-malaysia',
  'ngi-logged-over-2400m-section-at-67-deviation-in-new-zealand',
  'oriented-coring-avoids-wellbore-damage-in-the-gulf-of-mexico',
  'oriented-hrsct-optimum-sidewall-core-recovery-in-mexico',
  'positive-orientation-provides-100-fmi-image-coverage-in-iraq',
  'slim-tool-taxis-facilitate-logging-a-highly-deviated-6-hole-section-on-wireline',
  'smooth-mril-xl-logging-at-extreme-deviations-in-mexico',
  'sonic-centralization',
  'stick-slip',
  'successful-open-hole-wireline-logging-to-79-deviation-in-uae',
  'tlc-unable-to-pass-ledge',
] as const;

/**
 * Patent PDFs whose filenames carried spaces or commas. Google had the
 * percent-encoded forms indexed (`/patent_pdfs/MY-169945%20B.pdf`), which are
 * ugly to cite and easy for link-checkers to mangle. Renamed on disk to the
 * house convention documented in docs/ADMIN.md §3 — the bare patent number
 * with spaces and commas removed — with the old paths 301ing here.
 */
export const PATENT_PDF_RENAMES: Record<string, string> = {
  'BR taxi.pdf': 'BR-taxi.pdf',
  'CA3085434 Granted specification.pdf': 'CA3085434.pdf',
  'MY-169945 B.pdf': 'MY-169945-B.pdf',
  'US12,281,525.pdf': 'US12281525.pdf',
};

/**
 * Query parameters that may appear on any public URL. Tracking params are
 * stripped by analytics, never read by the app, and must not 404 — a
 * campaign link with `?utm_source=linkedin` has to keep working.
 */
const GLOBAL_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'ttclid',
  'li_fat_id',
  'mc_cid',
  'mc_eid',
  '_gl',
  'ref',
]);

/**
 * Query parameters a specific public route legitimately reads. Empty today:
 * no public page reads a search param (`?category=` and `?stories=` are
 * legacy-only and are redirected above before this is consulted), so anything
 * else on a public URL is crawler noise. THIS IS THE EXTENSION POINT — a new
 * feature that reads `searchParams` must add its param here or the page will
 * 404 when the param is present.
 */
const ROUTE_QUERY_PARAMS: Record<string, readonly string[]> = {};

/** Catalog family slugs — the only valid values of the legacy `?category=`. */
const CATALOG_CATEGORY_SLUGS = [
  'tool-taxis',
  'guides-holefinders',
  'focus-centralisers',
  'well-intervention',
];

/** Dead WordPress feed endpoints — 410 Gone, so Google drops them promptly. */
function isDeadFeed(path: string): boolean {
  return path === '/feed' || path === '/comments/feed' || path.endsWith('/feed');
}

/**
 * WordPress internals that no longer exist and never will. These are asset and
 * admin paths, not content, so there is nothing to redirect them TO — a 404
 * merely says "not here right now" and Google rechecks it for months.
 * `/wp-includes/js/wp-emoji-release.min.js` was still in the index and still
 * being recrawled in Aug 2026, two years after the rebuild (Search Console
 * audit, 9 Aug 2026). 410 says "gone, stop asking", which retires them faster.
 *
 * Deliberately NOT a catch-all for anything WordPress-shaped: the legacy
 * CONTENT paths above are the site's most valuable inbound links (`/contacts/`
 * alone was 59 clicks / 1,045 impressions against a site total of ~250 clicks
 * a quarter). Those redirect and must keep redirecting. Only the dead
 * machinery is retired here.
 */
const DEAD_WP_PREFIXES = ['/wp-includes', '/wp-content', '/wp-admin', '/wp-json'] as const;

/** WP entry-point files with no path prefix of their own — same 410 treatment
 *  (they were 404ing, which is fine for Google but noisier for bots that
 *  probe them forever). */
const DEAD_WP_FILES = ['/xmlrpc.php', '/wp-login.php'] as const;

function isDeadWordPressAsset(path: string): boolean {
  return (
    DEAD_WP_PREFIXES.some((prefix) => startsWithSegment(path, prefix)) ||
    DEAD_WP_FILES.includes(path as (typeof DEAD_WP_FILES)[number])
  );
}

function startsWithSegment(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** `decodeURIComponent` that survives malformed input (e.g. a bare `%`). */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function withSearch(path: string, search: string): string {
  return search ? `${path}${search}` : path;
}

/**
 * Resolve one request against the migration rules.
 *
 * @param rawPathname  URL pathname, percent-encoding still intact.
 * @param search       Query string INCLUDING the leading `?` (or '').
 */
export function resolveLegacyRequest(rawPathname: string, search = ''): LegacyResolution {
  const pathname = safeDecode(rawPathname);

  if (UNTOUCHED_PREFIXES.some((prefix) => startsWithSegment(pathname, prefix))) return null;

  // 1. Collapse repeated slashes. `/catalog//1000` → `/catalog/1000`, which
  //    then 404s on its own — the point is that it does so at ONE canonical
  //    URL rather than at every slash variant.
  if (pathname.includes('//')) {
    const collapsed = pathname.replace(/\/{2,}/g, '/');
    return { type: 'redirect', location: withSearch(collapsed, search), status: 308 };
  }

  // 2. Split the trailing slash off before any lookup, so `/contacts/` and
  //    `/contacts` take exactly the same path through the rules below.
  const hasTrailingSlash = pathname.length > 1 && pathname.endsWith('/');
  const path = hasTrailingSlash ? pathname.slice(0, -1) : pathname;
  const key = path.toLowerCase();

  // 3. Dead WP feeds: `/feed`, `/comments/feed`, `/<post-slug>/feed`.
  if (isDeadFeed(key)) return { type: 'gone' };

  // 4. The legacy page map.
  const mapped = LEGACY_PATHS[key];
  if (mapped) return { type: 'redirect', location: mapped, status: 301 };

  // 4b. Dead WordPress machinery. AFTER the map on purpose, so that adding an
  //     explicit mapping for a `/wp-*` path (a migrated upload, say) always
  //     beats the blanket 410.
  if (isDeadWordPressAsset(key)) return { type: 'gone' };

  // 5. WP-era root-level case studies.
  const rootSlug = key.slice(1);
  if ((LEGACY_CASE_STUDY_SLUGS as readonly string[]).includes(rootSlug)) {
    return { type: 'redirect', location: `/success-stories/${rootSlug}`, status: 301 };
  }

  // 5b. /case-studies lived from Jul 2026 until the Aug 2026 rename to
  //     Success Stories — same pages, new home. Slugs are unchanged, so the
  //     whole tree maps 1:1. (/case-studies-preview is NOT caught here —
  //     startsWithSegment requires an exact match or a following slash.)
  if (startsWithSegment(path, '/case-studies')) {
    const rest = path.slice('/case-studies'.length);
    return {
      type: 'redirect',
      location: withSearch(`/success-stories${rest}`, search),
      status: 301,
    };
  }

  // 6. Patent PDFs. WordPress served them from /pdf/<file>; the rebuild moved
  //    them to /patent_pdfs/<file>. Renamed files fold both moves into one
  //    hop, so /pdf/MY-169945%20B.pdf lands directly on the new filename.
  if (path === '/pdf') {
    return { type: 'redirect', location: '/about/patents', status: 301 };
  }
  if (startsWithSegment(path, '/pdf')) {
    const file = path.slice('/pdf/'.length);
    // Extension-less patent IDs (/pdf/CA3085434) are indexed too, and used to
    // 301 to an equally extension-less /patent_pdfs/CA3085434 — a redirect
    // that landed on a 404 (Search Console audit, 9 Aug 2026). Anything with
    // no extension at all gets .pdf appended; a file that still doesn't exist
    // 404s as before, so this can only turn dead hops into live ones.
    const target = PATENT_PDF_RENAMES[file] ?? (file.includes('.') ? file : `${file}.pdf`);
    return {
      type: 'redirect',
      location: `/patent_pdfs/${encodeURI(target)}`,
      status: 301,
    };
  }
  if (startsWithSegment(path, '/patent_pdfs')) {
    const file = path.slice('/patent_pdfs/'.length);
    const renamed = PATENT_PDF_RENAMES[file];
    if (renamed) {
      return { type: 'redirect', location: `/patent_pdfs/${renamed}`, status: 301 };
    }
    return null;
  }

  // 7. The HTML catalog was refined at /catalogtest before replacing /catalog.
  if (startsWithSegment(path, '/catalogtest')) {
    const rest = path.slice('/catalogtest'.length);
    return { type: 'redirect', location: withSearch(`/catalog${rest}`, search), status: 301 };
  }

  // 7b. Product pages merged into another product (MERGED_INTO in
  //     features/catalog/content/index.ts). The page stops being generated,
  //     so without this the old URL 404s — and these were indexed.
  const mergedProduct = MERGED_PRODUCT_PATHS[key];
  if (mergedProduct) {
    return { type: 'redirect', location: mergedProduct, status: 301 };
  }

  const params = new URLSearchParams(search);

  // 8. Query-shaped legacy views: catalog categories were `?category=` until
  //    the Jul 2026 three-level restructure, and Success Stories opened as a
  //    `?stories=1` overlay on Track Record.
  if (key === '/catalog') {
    const category = params.get('category');
    if (category && CATALOG_CATEGORY_SLUGS.includes(category)) {
      return { type: 'redirect', location: `/catalog/${category}`, status: 301 };
    }
  }
  if (key === '/track-record' && params.get('stories') === '1') {
    // Deliberately temporary: Track Record may grow its own stories view again.
    return { type: 'redirect', location: '/success-stories', status: 307 };
  }

  // 9. Canonicalise the trailing slash for everything else (what Next's
  //    built-in handling did before `skipTrailingSlashRedirect`).
  if (hasTrailingSlash) {
    return { type: 'redirect', location: withSearch(path, search), status: 308 };
  }

  // 10. Junk query strings. Google had crawled `/?11667727895.html`,
  //     `/?entry/` and friends as separate URLs, all serving a 200 homepage.
  //     Files are exempt (extensions are asset requests, not pages).
  //
  //     Only VALUELESS params 404. The junk Google indexed is uniformly
  //     valueless (`?11667727895.html`, `?entry/`) while every real tracking
  //     param carries a value, so this kills the duplicates without an
  //     allowlist that has to be maintained forever.
  //
  //     An allowlist was tried first and is the wrong shape: it shipped
  //     missing `srsltid` — which GOOGLE ITSELF appends to result URLs — plus
  //     `igshid`, `dclid`, `twclid`, `yclid`, `mkt_tok`, `_hsenc` and `epik`,
  //     so an organic click, an Instagram share or a HubSpot campaign landed
  //     on a 404. Any list of the industry's tracking params is out of date the
  //     day it's written; "has a value" never is. It also defuses
  //     ROUTE_QUERY_PARAMS as a footgun: a future page reading `?tab=specs`
  //     works whether or not anyone remembers to register it.
  if (search && !isAssetPath(path) && !path.split('/').pop()?.includes('.')) {
    const allowed = ROUTE_QUERY_PARAMS[key] ?? [];
    for (const [name, value] of params.entries()) {
      if (GLOBAL_QUERY_PARAMS.has(name) || allowed.includes(name)) continue;
      if (value === '') return { type: 'notFound' };
    }
  }

  return null;
}

function isAssetPath(path: string): boolean {
  return ASSET_PREFIXES.some((prefix) => startsWithSegment(path, prefix));
}
