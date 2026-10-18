/**
 * The public product animations — ONE list, consumed by the homepage
 * `ChallengeSelector` (tabs + lightbox) and the `/watch` pages (one
 * addressable URL per video, Oct 2026).
 *
 * `slug` is load-bearing three times over: it is the `/watch/<slug>` URL, the
 * homepage tab id, AND the backend `MEDIA_ASSETS` key that "Request the file"
 * sends as `media_asset` (backend/app/main.py). Renaming one means renaming
 * all three — and the URL form is what people paste into slide decks and
 * PDFs, so treat the slugs as frozen once a link has gone out.
 *
 * Why `/watch/…` and not `/videos/…`: `/videos` is the static asset tree
 * (the MP4s themselves, see `ASSET_PREFIXES` in lib/redirects.ts).
 */
export interface SiteVideo {
  slug: string;
  /** Challenge name — the homepage tab label and panel heading. */
  challenge: string;
  /** Petromac product/system that addresses it (display form, no ™). */
  product: string;
  /** Page title for /watch/<slug> — un-branded, ≤49 chars (root template adds "| Petromac"). */
  title: string;
  /** One concise explanatory paragraph. */
  summary: string;
  /** Two or three short proof points. */
  proofPoints: string[];
  /** MP4 source (with its cache-busting `?v=`). */
  src: string;
  /** 16:9 poster frame — also the page's share image (1280×720). */
  poster: string;
  /** Display duration, "m:ss". */
  duration: string;
  /** Same, in seconds — for the VideoObject JSON-LD. */
  durationSeconds: number;
  /** Date this cut went live — VideoObject `uploadDate`. */
  published: string;
  /** Catalog family the product belongs to. */
  catalog: { href: string; label: string };
  /** `device` value in case-studies.json, for the filtered success-stories link. */
  storiesDevice: string;
}

// Order = homepage tab order: Differential Sticking, High Deviations (Wireline
// Express), Incomplete Operations (Pathfinder), Centralisation (Focus). Copy
// is carried over from the previous challenge cards — no new claims.
export const SITE_VIDEOS: readonly SiteVideo[] = [
  {
    slug: 'differential-sticking',
    challenge: 'Differential Sticking',
    product: 'Wireline Express',
    title: 'Wireline Express — Differential Sticking',
    summary:
      'Wireline Express carries the tool string on wheeled carriages, offsetting it from the wellbore wall where differential sticking takes hold.',
    proofPoints: [
      '~99% less contact area with the borehole wall',
      'Tools roll free instead of getting stuck',
    ],
    // Subtitled cuts carry the narration audio track (EXCEPT Wireline
    // Express — see the High Deviations entry). Posters are real frames
    // pulled with ffmpeg -ss <t> -frames:v 1.
    src: '/videos/transcoded/differential-sticking-subtitled.mp4?v=20260806',
    poster: '/images/posters/differential-sticking-poster.jpg',
    duration: '3:32',
    durationSeconds: 212,
    published: '2026-08-06',
    catalog: { href: '/catalog/tool-taxis', label: 'Tool Taxis' },
    storiesDevice: 'Wireline Express',
  },
  {
    slug: 'high-deviations',
    challenge: 'High Deviations',
    product: 'Wireline Express',
    title: 'Wireline Express — High Deviations',
    summary:
      'Wireline Express provides gravity-descent conveyance in high-deviation open hole, designed for tortuous wellbore profiles.',
    proofPoints: [
      'World record: 80° deviation descent — in open hole',
      'Field-proven across operators worldwide',
    ],
    // The full master cut, WITH narration audio. The subtitled 212s cut is
    // silent at every generation including its original (verified Aug 2026,
    // -inf dB) — no fixable source exists, so High Deviations plays the
    // 250s master, whose audio track is intact. Kiosk keeps the subtitled
    // cut, where burned subtitles do the narrating on a loud floor.
    src: '/videos/transcoded/WirelineExpress.mp4?v=20260806',
    poster: '/images/posters/wireline-express-poster.jpg',
    duration: '4:10',
    durationSeconds: 250,
    published: '2026-08-06',
    catalog: { href: '/catalog/tool-taxis', label: 'Tool Taxis' },
    storiesDevice: 'Wireline Express',
  },
  {
    slug: 'incomplete-operations',
    challenge: 'Incomplete Operations',
    product: 'Pathfinder',
    title: 'Pathfinder — Incomplete Operations',
    summary:
      'Pathfinder hole finder and guide devices navigate ledges, restrictions, and washouts so logging programmes reach total depth on the first attempt.',
    proofPoints: [
      'No costly contingency runs',
      'Plan ahead with Athena to anticipate every tight zone',
    ],
    src: '/videos/transcoded/pf-subtitled.mp4?v=20260806',
    poster: '/images/posters/pf-poster.jpg',
    duration: '1:41',
    durationSeconds: 101,
    published: '2026-08-06',
    catalog: { href: '/catalog/guides-holefinders', label: 'Guides & Holefinders' },
    storiesDevice: 'Pathfinder',
  },
  {
    slug: 'centralisation',
    challenge: 'Centralisation',
    product: 'Focus Centralisers',
    title: 'Focus Centralisers — Centralisation',
    // Restructured Aug 2026 (Rajesh): the benefit leads and the product
    // split moved down into the bullets. Previously the summary was the
    // open/cased breakdown and the bullets were the benefits — which buried
    // what the range actually does for you under a parts list.
    summary:
      'Innovative centralizer mechanisms for better data quality, no stick-slip, greater efficiency, and easy navigation through restrictions:',
    // Still two proof points like every other tab — a third made the homepage
    // panel taller and the tab strip jumped on switch (Rajesh, Aug 2026).
    proofPoints: [
      'CP-series for open hole',
      'Helix and Rocker for cased hole across the full range',
    ],
    src: '/videos/transcoded/helix-subtitled.mp4?v=20260806',
    poster: '/images/posters/helix-poster.jpg',
    duration: '2:00',
    durationSeconds: 120,
    published: '2026-08-06',
    catalog: { href: '/catalog/focus-centralisers', label: 'Focus Centralisers' },
    storiesDevice: 'Focus - CH',
  },
];

export const VIDEO_SLUGS: readonly string[] = SITE_VIDEOS.map((v) => v.slug);

export function getVideo(slug: string): SiteVideo | undefined {
  return SITE_VIDEOS.find((v) => v.slug === slug);
}

/** Route of a video's own page. */
export function watchPath(slug: string): string {
  return `/watch/${slug}`;
}

/** ISO 8601 duration for schema.org (`PT3M32S`). */
export function isoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `PT${m}M${s}S`;
}

/**
 * Prefill for the header's contact drawer: the honest alternative to a
 * download button. On send, the backend mails the visitor a signed 7-day
 * download link and info@ gets the lead (see lib/contactDrawer.ts).
 */
export function requestFilePrefill(video: SiteVideo) {
  return {
    title: 'Request the animation',
    intro: `Leave your email and we'll send you a download link for the ${video.product} animation (MP4) to share with your team. Add a line about your well or project if you like.`,
    mediaAsset: video.slug,
    message: `Hi, I'd like a copy of the ${video.product} animation (${video.challenge}) shown on petromac.co.nz, as a video file I can share with my team. Thanks!`,
  };
}
