'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import VideoLightbox from './VideoLightbox';

interface Solution {
  id: string;
  /** Challenge name — shown on the tab and as the panel heading. */
  challenge: string;
  /** Petromac product/system that addresses it. */
  product: string;
  /** One concise explanatory paragraph. */
  summary: string;
  /** Two or three short proof points. */
  proofPoints: string[];
  video: { src: string; poster: string; duration: string };
}

// Tab order: Differential Sticking, High Deviations (Wireline Express),
// Incomplete Operations (Pathfinder), Centralisation (Focus). Copy is
// carried over from the previous challenge cards — no new claims.
const SOLUTIONS: Solution[] = [
  {
    id: 'differential-sticking',
    challenge: 'Differential Sticking',
    product: 'Wireline Express',
    summary:
      'Wireline Express carries the tool string on wheeled carriages, offsetting it from the wellbore wall where differential sticking takes hold.',
    proofPoints: [
      '~99% less contact area with the borehole wall',
      'Tools roll free instead of getting stuck',
    ],
    video: {
      // Subtitled cuts carry the narration audio track — the plain
      // transcodes were stripped with -an and play silent. Posters are
      // real frames pulled with ffmpeg -ss <t> -frames:v 1.
      src: '/videos/transcoded/differential-sticking-subtitled.mp4',
      poster: '/images/posters/differential-sticking-poster.jpg',
      duration: '3:32',
    },
  },
  {
    id: 'high-deviations',
    challenge: 'High Deviations',
    product: 'Wireline Express',
    summary:
      'Wireline Express provides gravity-descent conveyance in high-deviation open hole, designed for tortuous wellbore profiles.',
    proofPoints: [
      'World record: 80° deviation descent — in open hole',
      'Field-proven across operators worldwide',
    ],
    video: {
      src: '/videos/transcoded/WirelineExpress-subtitled.mp4',
      poster: '/images/posters/wireline-express-poster.jpg',
      duration: '3:33',
    },
  },
  {
    id: 'incomplete-operations',
    challenge: 'Incomplete Operations',
    product: 'Pathfinder',
    summary:
      'Pathfinder hole finder and guide devices navigate ledges, restrictions, and washouts so logging programmes reach total depth on the first attempt.',
    proofPoints: [
      'No costly contingency runs',
      'Plan ahead with Athena to anticipate every tight zone',
    ],
    video: {
      src: '/videos/transcoded/pf-subtitled.mp4',
      poster: '/images/posters/pf-poster.jpg',
      duration: '1:41',
    },
  },
  {
    id: 'centralisation',
    challenge: 'Centralisation',
    product: 'Focus Centralisers',
    summary:
      'CP-series centralisers for open hole; HELIX, Rocker, and CA7 for cased hole — across the full range.',
    proofPoints: [
      'Lower drag than conventional centralisers',
      'Easily navigates multiple casing sizes and narrow restrictions',
      'Improved data quality through perfect centralisation',
    ],
    video: {
      src: '/videos/transcoded/helix-subtitled.mp4',
      poster: '/images/posters/helix-poster.jpg',
      duration: '2:00',
    },
  },
];

/**
 * "What challenge are you facing?" — WAI-ARIA tabs. The four challenges are
 * selectors; one solution panel below shows the active solution: 16:9 video
 * preview (poster only — the player mounts in the lightbox on demand) plus
 * product, summary, proof points, and one catalog CTA.
 */
export default function ChallengeSelector() {
  const [activeId, setActiveId] = useState(SOLUTIONS[0].id);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const active = SOLUTIONS.find((s) => s.id === activeId) ?? SOLUTIONS[0];

  // Roving-tabindex arrow navigation per the WAI-ARIA tabs pattern.
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = SOLUTIONS.length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    setActiveId(SOLUTIONS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="challenges" className="py-20 px-6 bg-white scroll-mt-16 scroll-reveal">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand text-center mb-10">
          What challenge are you facing?
        </h2>

        {/* Challenge tabs — 2×2 on mobile, one row from md up. Constant
            border width so the active state never shifts layout. */}
        <div
          role="tablist"
          aria-label="Wireline logging challenges"
          className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6"
        >
          {SOLUTIONS.map((s, i) => {
            const selected = s.id === activeId;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`challenge-tab-${s.id}`}
                aria-selected={selected}
                aria-controls={`challenge-panel-${s.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(s.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={`rounded-lg border-2 px-3 py-3 md:py-3.5 text-sm md:text-[15px] font-semibold text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  selected
                    ? 'bg-brand border-brand text-white shadow-card'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-brand/40 hover:text-brand hover:bg-brand/[0.04] hover:shadow-sm'
                }`}
              >
                {s.challenge}
              </button>
            );
          })}
        </div>

        {/* Solution panel */}
        <div
          role="tabpanel"
          id={`challenge-panel-${active.id}`}
          aria-labelledby={`challenge-tab-${active.id}`}
          tabIndex={0}
          className="rounded-xl border-2 border-slate-200 bg-slate-50 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <div className="grid lg:grid-cols-[3fr_2fr]">
            {/* Video preview — poster only; the player mounts in the
                lightbox when opened. Whole area is one button. */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Watch the ${active.product} video (${active.video.duration})`}
              className="group relative block w-full aspect-video bg-slate-900 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
            >
              <Image
                key={active.id}
                src={active.video.poster}
                alt=""
                fill
                className="object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/50 transition-colors" />
              {/* Central play control */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-white/90 text-brand shadow-xl group-hover:bg-white group-hover:scale-105 motion-safe:transition-transform">
                  <svg
                    className="h-7 w-7 md:h-8 md:w-8 translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5.5v13l11-6.5-11-6.5z" />
                  </svg>
                </span>
              </span>
              {/* Expand affordance */}
              <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-md bg-black/70 text-white group-hover:bg-black/85 transition-colors">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </span>
            </button>

            {/* Description */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <h3 className="font-heading text-2xl font-bold text-slate-900">{active.challenge}</h3>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-brand">
                {active.product}
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">{active.summary}</p>
              <ul className="mt-4 space-y-2">
                {active.proofPoints.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-brand font-bold mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              {/* Single CTA per panel — the catalog stays reachable via the
                  Hardware band below. TODO: pass a per-solution filter once
                  the success stories page supports filter deep links. */}
              <div className="mt-6">
                <Link
                  href="/success-stories/flipbook"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white bg-brand hover:bg-brand/90 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-px hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                >
                  See success stories
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VideoLightbox
        open={lightboxOpen}
        src={active.video.src}
        poster={active.video.poster}
        label={`${active.product} video`}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
  );
}
