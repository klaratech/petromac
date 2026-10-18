'use client';

import { useRef, useState } from 'react';
import VideoLightbox from './VideoLightbox';
import Image from 'next/image';
import Link from 'next/link';
import { openContactDrawer } from '@/lib/contactDrawer';
import { SITE_VIDEOS, requestFilePrefill, watchPath } from '@/features/videos';
import CopyLinkButton from '@/components/public/videos/CopyLinkButton';

// The four solutions ARE the four public videos — one list, shared with the
// /watch pages so a tab here and its permalink can never drift apart.
const SOLUTIONS = SITE_VIDEOS;

/**
 * "What challenge are you facing?" — WAI-ARIA tabs. The four challenges are
 * selectors; one solution panel below shows the active solution: 16:9 video
 * preview (poster only — the player mounts in the lightbox on demand) plus
 * product, summary, proof points, and one catalog CTA.
 */
export default function ChallengeSelector() {
  const [activeId, setActiveId] = useState(SOLUTIONS[0].slug);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const active = SOLUTIONS.find((s) => s.slug === activeId) ?? SOLUTIONS[0];

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
    setActiveId(SOLUTIONS[next].slug);
    tabRefs.current[next]?.focus();
  };

  // "Request the file": the honest alternative to a download button. Opens
  // the header's contact drawer with the ask pre-written (editable, so the
  // visitor can add context) and `mediaAsset` set: on send, the backend
  // mails them a signed 7-day download link and info@ gets the message with
  // the lead. Petromac learns who wants to share the animation and where.
  const requestFile = () => {
    setLightboxOpen(false);
    openContactDrawer(requestFilePrefill(active));
  };

  return (
    <section
      id="challenges"
      // Was bg-white, which landed as a hard flash straight after the dark hero
      // video. A short gradient from slate-100 eases the transition and gives
      // the cards below something to sit on instead of blowing out.
      className="py-20 px-6 bg-gradient-to-b from-slate-100 via-slate-50 to-white scroll-mt-16 scroll-reveal"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand text-center mb-10">
          What challenge are you facing?
        </h2>

        {/* Challenge tabs — 2×2 on mobile, one row from md up. Constant border
            width so the active state never shifts layout.
            Each tab is a flex box with an explicit min-height: "Centralisation"
            is one word while the other three wrap to two lines, so without this
            its text block was a different height from its neighbours' — and on
            the mobile 2×2 the two rows sized independently, which made it look
            like a different shape rather than one of four equals. */}
        <div
          role="tablist"
          aria-label="Wireline logging challenges"
          className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6"
        >
          {SOLUTIONS.map((s, i) => {
            const selected = s.slug === activeId;
            return (
              <button
                key={s.slug}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`challenge-tab-${s.slug}`}
                aria-selected={selected}
                aria-controls={`challenge-panel-${s.slug}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(s.slug)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={`flex min-h-[3.25rem] md:min-h-[3.75rem] items-center justify-center rounded-lg border-2 px-3 py-2 text-sm md:text-[15px] font-semibold leading-snug text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  selected
                    ? 'bg-brand border-brand text-white shadow-card'
                    : 'bg-white border-slate-300 text-slate-700 shadow-sm hover:border-brand/50 hover:text-brand hover:bg-brand/[0.04] hover:shadow'
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
          id={`challenge-panel-${active.slug}`}
          aria-labelledby={`challenge-tab-${active.slug}`}
          tabIndex={0}
          className="rounded-xl border-2 border-slate-300 bg-white shadow-sm overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <div className="grid lg:grid-cols-[3fr_2fr]">
            {/* Video preview — poster only; the player mounts in the
                lightbox when opened. Whole area is one button. */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Watch the ${active.product} video (${active.duration})`}
              className="group relative block w-full aspect-video bg-slate-900 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
            >
              <Image
                key={active.slug}
                src={active.poster}
                alt={`${active.product} — ${active.challenge} video preview`}
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
                  href="/success-stories"
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
                <p className="mt-4 text-xs text-slate-500">
                  Want to share this animation?{' '}
                  <button
                    type="button"
                    onClick={requestFile}
                    className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm"
                  >
                    Request the file
                  </button>{' '}
                  <span aria-hidden="true">·</span>{' '}
                  {/* Each video has its own page (/watch/<slug>, Oct 2026) so a
                      link to exactly this animation can go into a slide deck or
                      a PDF; this copies that URL. */}
                  <CopyLinkButton
                    path={watchPath(active.slug)}
                    className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm"
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VideoLightbox
        open={lightboxOpen}
        src={active.src}
        poster={active.poster}
        label={`${active.product} video`}
        onClose={() => setLightboxOpen(false)}
        onRequestFile={requestFile}
      />
    </section>
  );
}
