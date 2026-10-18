/**
 * The public product animations — ONE list, consumed by the homepage
 * `ChallengeSelector` (tabs + lightbox). Each video is addressable as
 * `/#<slug>` (Oct 2026): the homepage opens scrolled to the selector with
 * that tab active, so a slide deck or PDF can link to exactly the clip
 * that was presented without a separate page per video (Jee's call).
 *
 * `slug` is load-bearing three times over: it is the `/#<slug>` link, the
 * homepage tab id, AND the backend `MEDIA_ASSETS` key that "Request the file"
 * sends as `media_asset` (backend/app/main.py). Renaming one means renaming
 * all three — and the link form is what people paste into slide decks and
 * PDFs, so treat the slugs as frozen once a link has gone out.
 */
export interface SiteVideo {
  slug: string;
  /** Challenge name — the homepage tab label and panel heading. */
  challenge: string;
  /** Petromac product/system that addresses it (display form, no ™). */
  product: string;
  /** One concise explanatory paragraph. */
  summary: string;
  /** Two or three short proof points. */
  proofPoints: string[];
  /** MP4 source (with its cache-busting `?v=`). */
  src: string;
  /** 16:9 poster frame (1280×720). */
  poster: string;
  /** Display duration, "m:ss". */
  duration: string;
}

// Order = homepage tab order: Differential Sticking, High Deviations (Wireline
// Express), Incomplete Operations (Pathfinder), Centralisation (Focus). Copy
// is carried over from the previous challenge cards — no new claims.
export const SITE_VIDEOS: readonly SiteVideo[] = [
  {
    slug: 'differential-sticking',
    challenge: 'Differential Sticking',
    product: 'Wireline Express',
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
  },
  {
    slug: 'high-deviations',
    challenge: 'High Deviations',
    product: 'Wireline Express',
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
  },
  {
    slug: 'incomplete-operations',
    challenge: 'Incomplete Operations',
    product: 'Pathfinder',
    summary:
      'Pathfinder hole finder and guide devices navigate ledges, restrictions, and washouts so logging programmes reach total depth on the first attempt.',
    proofPoints: [
      'No costly contingency runs',
      'Plan ahead with Athena to anticipate every tight zone',
    ],
    src: '/videos/transcoded/pf-subtitled.mp4?v=20260806',
    poster: '/images/posters/pf-poster.jpg',
    duration: '1:41',
  },
  {
    slug: 'centralisation',
    challenge: 'Centralisation',
    product: 'Focus Centralisers',
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
  },
];

export const VIDEO_SLUGS: readonly string[] = SITE_VIDEOS.map((v) => v.slug);

export function getVideo(slug: string): SiteVideo | undefined {
  return SITE_VIDEOS.find((v) => v.slug === slug);
}

/** Link that opens the homepage on this video's tab, scrolled into view. */
export function videoHref(slug: string): string {
  return `/#${slug}`;
}

/**
 * Prefill for the header's contact drawer: the honest alternative to a
 * download button. On send, the backend mails the visitor a signed 7-day
 * download link and info@ gets the lead (see lib/contactDrawer.ts).
 */
export function requestFilePrefill(video: SiteVideo) {
  return {
    intro: `Leave your email and we'll send you a download link for the ${video.product} animation (MP4) to share with your team. Add a line about your well or project if you like.`,
    mediaAsset: video.slug,
    message: `Hi, I'd like a copy of the ${video.product} animation (${video.challenge}) shown on petromac.co.nz, as a video file I can share with my team. Thanks!`,
  };
}
