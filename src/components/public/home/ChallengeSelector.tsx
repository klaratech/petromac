'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LazyVideo from './LazyVideo';

// NOTE: this used to import framer-motion for the card expand + detail-panel
// animations. framer-motion is ~5 MB of dep and sat in the public common
// chunk just because this one file imported it. Now the detail-panel
// height animation uses the grid-template-rows: 0fr ↔ 1fr trick (modern
// browsers transition that smoothly).

interface Challenge {
  id: string;
  title: string;
  image: string;
  /** When set, the card plays this video (autoplay, muted, loop) in the
   *  image area instead of the static image. `image` is still used as the
   *  poster so something renders while the video loads. */
  video?: string;
  bullets: string[];
  /** The product behind this challenge — rendered as a
   *  "Solution: <name> →" chip linking into the catalog. */
  solution: { name: string; href: string };
}

// 2×2 grid: Differential Sticking + High Deviations (Wireline Express) on
// top, Incomplete Operations (Pathfinder) + Centralisation (Focus) below.
// Data Quality was dropped to keep it to four (Jul 2026).
const challenges: Challenge[] = [
  {
    id: 'differential-sticking',
    title: 'Differential Sticking',
    image: '/images/sticking.jpg',
    // Transcoded from public/videos/originals/DifferentialSticking.mp4 →
    // 1280x720 H.264 CRF 30, no audio, faststart. Masters live in
    // public/videos/originals/ (gitignored); re-transcode when they update.
    video: '/videos/transcoded/differential-sticking.mp4',
    bullets: [
      'Wireline Express keeps tool strings moving through sticking-prone intervals',
      'Engineered for differential-sticking conditions',
      'Reduces non-productive time on at-risk operations',
    ],
    // Wireline Express is the Tool Taxis product line in the catalog.
    solution: { name: 'Wireline Express', href: '/catalog?category=tool-taxis' },
  },
  {
    id: 'high-deviations',
    title: 'High Deviations',
    image: '/images/conveyance.jpg',
    bullets: [
      'Wireline Express — gravity descent conveyance in high-deviation open hole',
      'World record descent at 79° deviation',
      'Designed for tortuous wellbore profiles',
    ],
    solution: { name: 'Wireline Express', href: '/catalog?category=tool-taxis' },
  },
  {
    id: 'incomplete-operations',
    title: 'Incomplete Operations',
    image: '/images/sampling.jpg',
    video: '/videos/transcoded/pf.mp4',
    bullets: [
      'Reach total depth on the first attempt — no costly contingency runs',
      'Pathfinder hole finder and guide devices navigate ledges, restrictions, and washouts',
      'Plan ahead with Athena to anticipate every tight zone',
    ],
    solution: { name: 'Pathfinder', href: '/catalog/guides-holefinders/pathfinder' },
  },
  {
    id: 'centralisation',
    title: 'Centralisation',
    image: '/images/ledges.jpg',
    video: '/videos/transcoded/helix.mp4',
    bullets: [
      'Open hole and cased hole centralisers — HELIX, Rocker, CP-series across the full casing range',
      'Improved leverage and lower drag than conventional centralisers',
      'Cleaner CBL, sonic, and density logs through optimal standoff',
    ],
    solution: { name: 'Focus Centralisers', href: '/catalog?category=focus-centralisers' },
  },
];

export default function ChallengeSelector() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <section id="challenges" className="py-20 px-6 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand text-center mb-12">
          What challenge are you facing?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((c) => {
            const isExpanded = expanded === c.id;
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                className={`rounded-xl overflow-hidden cursor-pointer border-2 transition-colors focus:outline-2 focus:outline-brand ${
                  isExpanded
                    ? 'border-brand shadow-card'
                    : 'border-slate-200 hover:border-brand/40 shadow-subtle hover:shadow-card'
                }`}
                onClick={() => toggle(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(c.id);
                  }
                }}
              >
                <div className="relative h-48 overflow-hidden bg-slate-800">
                  {c.video ? (
                    <LazyVideo
                      src={c.video}
                      poster={c.image}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={c.image}
                      alt={c.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white font-heading">
                    {c.title}
                  </h3>
                </div>

                {/* Always-visible product attribution — the only product
                    click-path on the homepage besides the hardware ribbon. */}
                <div className="px-5 py-3 bg-white border-b border-slate-100">
                  <Link
                    href={c.solution.href}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand/5 border border-brand/20 px-3 py-1 text-sm font-semibold text-brand hover:bg-brand/10 hover:border-brand/40 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-normal text-slate-500">Solution:</span>
                    {c.solution.name}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>

                {/* Expandable detail panel — CSS grid-template-rows: 0fr ↔ 1fr
                    trick. Modern browsers transition this smoothly so we can
                    animate height-auto without JS. The inner div needs
                    overflow-hidden so its content stays clipped at 0fr. */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                  aria-hidden={!isExpanded}
                >
                  <div className="overflow-hidden">
                    <div className="p-5 bg-slate-50">
                      <ul className="space-y-2 mb-4">
                        {c.bullets.map((b, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-600">
                            <span className="text-brand font-bold mt-0.5">✓</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/success-stories/flipbook"
                        className="inline-flex items-center text-brand font-semibold text-sm hover:text-brand/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        // When the panel is collapsed, take the link out of the
                        // tab order so keyboard users don't focus an invisible
                        // anchor.
                        tabIndex={isExpanded ? 0 : -1}
                      >
                        Learn more
                        <svg
                          className="ml-1 w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
