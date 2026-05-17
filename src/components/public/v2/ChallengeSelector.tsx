"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// NOTE: this used to import framer-motion for the card expand + detail-panel
// animations. framer-motion is ~5 MB of dep and sat in the public common
// chunk just because this one file imported it. Now the detail-panel
// height animation uses the grid-template-rows: 0fr ↔ 1fr trick (modern
// browsers transition that smoothly), and the card snaps to col-span-2
// without a layout-FLIP. The kiosk still uses framer-motion for genuine
// motion work, but it's no longer in the public bundle.

interface Challenge {
  id: string;
  title: string;
  image: string;
  /** When set, the card plays this video (autoplay, muted, loop) in the
   *  image area instead of the static image. `image` is still used as the
   *  poster so something renders while the video loads. */
  video?: string;
  bullets: string[];
}

const challenges: Challenge[] = [
  {
    id: "stuck-tools",
    title: "Stuck Tools",
    image: "/images/sticking.jpg",
    // Transcoded from public/videos/originals/DifferentialSticking.mp4 →
    // 1280x720 H.264 CRF 30, no audio, faststart. Masters live in
    // public/videos/originals/ (gitignored); re-transcode when they update.
    video: "/videos/transcoded/differential-sticking.mp4",
    bullets: [
      "Conveyance past ledges and tight spots in high-deviation wells",
      "Pathfinder hole finder helps logging tools navigate restrictions",
      "Field-proven across operators worldwide",
    ],
  },
  {
    id: "incomplete-operations",
    title: "Incomplete Operations",
    image: "/images/sampling.jpg",
    video: "/videos/transcoded/pf.mp4",
    bullets: [
      "Reach total depth on the first attempt — no costly contingency runs",
      "Confidence to log full intervals even with risky access",
      "Plan ahead with Athena to anticipate every tight zone",
    ],
  },
  {
    id: "sticking-risk",
    title: "Sticking Risk",
    image: "/images/sticking.jpg",
    bullets: [
      "Thor controlled-impulse jar frees tools without resorting to fishing",
      "Engineered for differential-sticking conditions in cased holes",
      "Reduces non-productive time on at-risk operations",
    ],
  },
  {
    id: "data-quality",
    title: "Data Quality",
    image: "/images/orientation.jpg",
    bullets: [
      "Centralised tool strings produce sharper CBL, sonic, and density logs",
      "Focus and HELIX keep sondes on-axis across the casing range",
      "Less repeat logging, more first-time-right data",
    ],
  },
  {
    id: "cased-hole-centralization",
    title: "Cased Hole Centralization",
    image: "/images/ledges.jpg",
    video: "/videos/transcoded/helix.mp4",
    bullets: [
      "HELIX maintains centralisation across the full casing range",
      "Improved leverage and lower drag than conventional centralisers",
      "Cleaner CBL, sonic, and density logs through optimal standoff",
    ],
  },
  {
    id: "high-deviations",
    title: "High Deviations",
    image: "/images/conveyance.jpg",
    bullets: [
      "Pathfinder proven in 80°+ deviated wells worldwide",
      "Reliable conveyance through ledges, breakouts, and washouts",
      "Designed for tortuous wellbore profiles",
    ],
  },
];

export default function ChallengeSelector() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <section id="challenge-selector" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-brand font-semibold text-center mb-3">
          Challenges
        </p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
          What challenge are you facing?
        </h2>
        <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
          Select a challenge to see how Petromac solves it in the field.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    ? "border-brand shadow-card lg:col-span-2"
                    : "border-slate-200 hover:border-brand/40 shadow-subtle hover:shadow-card"
                }`}
                onClick={() => toggle(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(c.id);
                  }
                }}
              >
                <div className="relative h-48 overflow-hidden bg-slate-800">
                  {c.video ? (
                    <video
                      src={c.video}
                      poster={c.image}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={c.image}
                      alt={c.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white font-heading">
                    {c.title}
                  </h3>
                </div>

                {/* Expandable detail panel — CSS grid-template-rows: 0fr ↔ 1fr
                    trick. Modern browsers transition this smoothly so we can
                    animate height-auto without JS. The inner div needs
                    overflow-hidden so its content stays clipped at 0fr. */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
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
                        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
