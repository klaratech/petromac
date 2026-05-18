'use client';

import { useState } from 'react';
import { AssetSlot } from '@/components/kiosk/AssetSlot';
import DrilldownMapCore from '@/components/geo/DrilldownMapCore';
import useOperationsData from '@/hooks/useOperationsData';
import SuccessStoriesFlipbook from '@/features/success-stories/components/SuccessStoriesFlipbook';
import type { JobRecord } from '@/types/JobRecord';

/**
 * LogsScreen — config-driven "Case Studies" pager.
 *
 * Used by the Cased Hole experiences (Helix / Rocker) and the Open Hole
 * `OverlayExperience` scaffolds. Slide types:
 *
 *   - `map`        — Track Record drill-down map (DrilldownMapCore). Pulls
 *                    operations data from useOperationsData; the in-map
 *                    Success Stories link opens the flipbook as a takeover.
 *   - `single`     — full-bleed image with a caption pill.
 *   - `pair`       — two side-by-side comparison images.
 *   - `annotated`  — image with side text cards (and optional SVG circles).
 *
 * Track Record used to be its own HUD button — it folded into Case Studies
 * in May 2026 so the experiences are down to two HUD buttons (Mechanism +
 * Case Studies). Missing images fall back to a "drop file here" placeholder.
 *
 * Note on naming: the file, type and constants keep the historical `Logs`
 * naming for minimal churn — the displayed label is "Case Studies".
 */

/** Annotation circle — positioned in % of the image's bounding box so it
 *  follows the image regardless of how the parent column resizes. */
export interface AnnotationCircle {
  /** Centre X, % from the image's left edge. */
  xPct: number;
  /** Centre Y, % from the image's top edge. */
  yPct: number;
  /** Optional radius override, in % of the image height. Defaults to ~3.5. */
  rPct?: number;
}

/** A single annotation block — title, optional bullets, and the circles on
 *  the image that this block points at. The block's `tone` colors both
 *  the title text and the strokes of its circles, so a slide with both a
 *  "poor" zone (red) and an "excellent" zone (blue) reads cleanly. */
export interface LogAnnotation {
  /** Optional eyebrow shown above the title, e.g. "Key takeaway". */
  eyebrow?: string;
  /** Headline / main statement, e.g. "Excellent Centralization in 9-5/8"
   *  and 7" casings with CX9". */
  title: string;
  /** Optional bullet list shown under the title. */
  bullets?: string[];
  /** Visual tone — colors the title and the corresponding circle strokes.
   *  'red'  → limitations / poor outcome
   *  'blue' → benefits / good outcome (brand navy)
   *  undefined → neutral (white / navy circles) */
  tone?: 'red' | 'blue';
  /** Circle markers on the main image that this annotation refers to.
   *  Pass `[]` when the spotlight is on `detail` instead and the main image
   *  is presented un-annotated. */
  circles: AnnotationCircle[];
  /** Optional secondary chart shown beneath the bullets in this card —
   *  e.g. a summary histogram or distribution plot. Has its own circle
   *  overlay in its OWN coordinate space (so a circle at xPct: 65 on the
   *  detail is 65% of the detail image's bounding box, not the main one). */
  detail?: {
    src: string;
    alt: string;
    /** Optional circles overlaid on the detail image, scaled to the detail's
     *  own bounding box. Tone-colored the same way main-image circles are. */
    circles?: AnnotationCircle[];
  };
}

export type LogsSlide =
  | {
      /** Track Record drill-down map — first slide in every case-studies
       *  pager. Driven by `config.trackRecord` (system filter + Success
       *  Stories enable flag). Operations data fetched inside LogsScreen
       *  only when a map slide is present. */
      type: 'map';
      /** Optional caption pill shown bottom-centre. Defaults to "Track
       *  Record" if omitted. */
      caption?: string;
    }
  | {
      type: 'single';
      src: string;
      caption: string;
    }
  | {
      type: 'pair';
      caption: string;
      left: { src: string; label: string };
      right: { src: string; label: string; highlight?: boolean };
    }
  | {
      /** Annotated log — image with side text cards calling out specific
       *  outcomes. Optionally carries SVG circle overlays in the image's
       *  own coordinate space. */
      type: 'annotated';
      src: string;
      caption: string;
      annotations: LogAnnotation[];
    };

export interface LogsConfig {
  /** Shown as the screen heading, e.g. "Helix", "Pathfinder". */
  title: string;
  slides: LogsSlide[];
  /** Required when any slide is of type `map`. Drives the DrilldownMapCore
   *  inside that slide and toggles the in-map Success Stories link. */
  trackRecord?: {
    /** System filter passed to DrilldownMapCore `initialSystem` — e.g.
     *  "Focus - CH" for Helix/Rocker, "Wireline Express - FT" for OH
     *  Formation Testing. */
    system: string;
    /** Show the "Success Stories" link inside the map. Clicking it opens
     *  SuccessStoriesFlipbook as an inline takeover of LogsScreen. */
    enableSuccessStories?: boolean;
  };
}

interface Props {
  config: LogsConfig;
  onBack: () => void;
}

// ── Cased Hole presets (ported from the original Helix/Rocker maps) ──────────
// Asset slots — drop files at these paths and the slides pick them up:
//   /public/images/kiosk-images/Helix_Log1.png    (slide 1 — annotations baked into image)
//   /public/images/kiosk-images/Helix_Log2.png    (slide 2 — annotations baked into image)
//   /public/images/kiosk-images/Helix_Log3-1.jpg  (slide 3, main strip)
//   /public/images/kiosk-images/Helix_Log3-2.png  (slide 3, ECCE histogram inset)
//   /public/images/helix-cbl-setup.png            (CBL slide)
//   /public/images/rocker-logs-{N}.png            (Rocker log comparisons)
//
// (The Helix lever-arm comparison images moved to the Mechanism slideshow
//  and now live under /public/images/kiosk-images/leverage-{conventional,
//  helix}.png — see HELIX_MECHANISM in MechanismScreen.)

export const HELIX_LOGS: LogsConfig = {
  title: 'Helix',
  // Helix + Rocker both roll up to "Focus - CH" in the operations pipeline.
  trackRecord: {
    system: 'Focus - CH',
    enableSuccessStories: true,
  },
  slides: [
    // Slide 0 — Track Record map. The drill-down map used to be its own
    // HUD button; folded in here so users page through map → logs in a
    // single flow. Country chart / yearly stats render on top of the map.
    { type: 'map' },
    // The leverage comparison that used to live here moved to the Helix
    // mechanism slideshow (slide 3 — see HELIX_MECHANISM in MechanismScreen).
    //
    // Slide 1 — PEMEX CIBIX-35 log strip. Four leftward drops in the red
    // HTEN curve, each only ~60 lbs, demonstrate how cleanly the CX9 Helix
    // runs through IBC + Sonic ledges. The annotation circles are baked
    // into Helix_Log1.png so the slide just renders the image + side card.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log1.png',
      caption: 'PEMEX CIBIX-35 — HELIX run',
      annotations: [
        {
          title: '4 drops in HTEN of ONLY 60 lbs from CX9 on IBC & Sonic',
          tone: 'blue',
          circles: [],
        },
      ],
    },
    // Slide 2 — ENI BlackTip P5 log strip. Two contrasting outcomes on the
    // same well: poor centralisation up in the 13-3/8" with conventional
    // centralisers, then excellent centralisation in the deeper 9-5/8" and
    // 7" sections after switching to CX9. Circles are baked into the
    // image; this config carries the two side cards (red + blue).
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log2.png',
      caption: 'ENI BlackTip P5 — HELIX run',
      annotations: [
        {
          tone: 'red',
          title: 'Poor centralization in 13-3/8" casing with conventional centralizers',
          bullets: [
            'Large difference between Min and Max TT’s',
            'Erratic & poor sonic data',
          ],
          circles: [],
        },
        {
          tone: 'blue',
          title: 'Excellent centralization in 9-5/8" and 7" casings with CX9',
          bullets: [
            'Difference between Min and Max TT’s < 10 µs',
          ],
          circles: [],
        },
      ],
    },
    // Slide 3 — Aramco KHRS-300. The strip shows excellent ECCE all the way
    // out to 85° deviation in 9-5/8" casing; the ECCE histogram inset in the
    // bottom of the annotation card summarises the run — a Mean of 0.0688"
    // against a 0.38" limit, circled in red.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log3-1.jpg',
      caption: 'Aramco KHRS-300 — HELIX run',
      annotations: [
        {
          tone: 'blue',
          title: 'CX9: Ultrasonic to 85° deviation in 9-5/8"',
          bullets: [
            'Excellent ECCE even where DLS is high',
            'Excellent ECCE from vertical to 85° deviation',
            'Average ECCE of 0.07" (limit is 0.38")',
          ],
          // No callouts on the main strip — the supporting evidence sits in
          // the histogram below.
          circles: [],
          detail: {
            src: '/images/kiosk-images/Helix_Log3-2.png',
            alt: 'ECCE distribution histogram — Aramco KHRS-300 HELIX run',
            circles: [
              // Red ring around the "Mean: 0.0688" stat in the bottom
              // statistics strip. xPct/yPct are tuned against the cropped
              // histogram image — adjust from a tablet once seen.
              { xPct: 72, yPct: 93, rPct: 4 },
            ],
          },
        },
      ],
    },
    {
      type: 'single',
      src: '/images/helix-cbl-setup.png',
      caption: 'Ultrasonic-CBL set-up with HELIX',
    },
  ],
};

export const ROCKER_LOGS: LogsConfig = {
  title: 'Rocker',
  // Helix + Rocker share the "Focus - CH" rollup in the operations data;
  // a Subsystem-level Helix/Rocker split lives on each record for future
  // filtering but the map filters by System.
  trackRecord: {
    system: 'Focus - CH',
    enableSuccessStories: true,
  },
  slides: [
    { type: 'map' },
    {
      type: 'single',
      src: '/images/rocker-logs-1.png',
      caption: 'Rocker log comparison',
    },
  ],
};

export default function LogsScreen({ config, onBack }: Props) {
  const slides = config.slides;
  const [index, setIndex] = useState(0);
  const [showSuccessStories, setShowSuccessStories] = useState(false);
  const slide = slides[index] as LogsSlide | undefined;

  // Only fetch operations data when a map slide is configured — keeps
  // standalone usages (e.g. an OH overlay with only image slides) from
  // pulling the ~600 KB JSON for no reason.
  const hasMap = slides.some((s) => s.type === 'map');
  const { data: jobData } = useOperationsData<JobRecord>({
    enabled: hasMap,
  });

  // Success Stories takes over the whole sub-view when triggered from
  // inside the map slide. Returns to the same slide index on Back.
  if (showSuccessStories) {
    return (
      <SuccessStoriesFlipbook
        onBack={() => setShowSuccessStories(false)}
        backLabel="Back"
      />
    );
  }

  const captionForSlide = (s: LogsSlide): string => {
    if (s.type === 'map') return s.caption ?? 'Track Record';
    return s.caption;
  };

  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Case Studies
          </p>
          <h2 className="text-3xl font-extrabold">{config.title}</h2>
        </div>
        <button
          onClick={onBack}
          className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm tracking-wide"
        >
          ← Back
        </button>
      </header>

      <div className="flex-1 relative bg-black">
        {!slide ? (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            No log slides configured yet.
          </div>
        ) : slide.type === 'map' ? (
          <MapPane
            jobData={jobData}
            system={config.trackRecord?.system}
            onSuccessStoriesClick={
              config.trackRecord?.enableSuccessStories
                ? () => setShowSuccessStories(true)
                : undefined
            }
          />
        ) : slide.type === 'single' ? (
          <SinglePane src={slide.src} alt={slide.caption} />
        ) : slide.type === 'pair' ? (
          <PairPane left={slide.left} right={slide.right} />
        ) : (
          <AnnotatedPane
            src={slide.src}
            alt={slide.caption}
            annotations={slide.annotations}
          />
        )}

        {/* Pager — large round arrow buttons fixed at the left + right
            middle edges of the slide area. Disabled (faded out) at the
            boundaries instead of removed, so the layout doesn't shift
            when paging. Page indicator pill sits next to the caption. */}
        {slides.length > 1 && (
          <>
            <SlideNavButton
              direction="prev"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            />
            <SlideNavButton
              direction="next"
              onClick={() =>
                setIndex((i) => Math.min(slides.length - 1, i + 1))
              }
              disabled={index === slides.length - 1}
            />
          </>
        )}

        {slide && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
            <div className="px-4 py-2 rounded-full bg-black/60 text-sm">
              {captionForSlide(slide)}
            </div>
            {slides.length > 1 && (
              <div className="px-3 py-1.5 rounded-full bg-black/60 text-white/70 text-xs tabular-nums">
                {index + 1} / {slides.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** MapPane — renders the DrilldownMapCore inside a case-studies slide.
 *  Loading state matches the experience-level placeholder we used to show
 *  before this folded into LogsScreen. */
function MapPane({
  jobData,
  system,
  onSuccessStoriesClick,
}: {
  jobData: JobRecord[] | null | undefined;
  system: string | undefined;
  onSuccessStoriesClick?: (() => void) | undefined;
}) {
  if (!jobData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/70">
        Loading track record…
      </div>
    );
  }
  return (
    <DrilldownMapCore
      data={jobData}
      {...(system ? { initialSystem: system } : {})}
      showSuccessStoriesLink={Boolean(onSuccessStoriesClick)}
      {...(onSuccessStoriesClick ? { onSuccessStoriesClick } : {})}
      // Fill the slide area; the slide's bottom caption + pager arrows
      // sit on top of this via z-30.
      className="relative w-full h-full overflow-hidden bg-white"
    />
  );
}

/** Large round arrow button pinned to the left or right middle edge of a
 *  slide area. Used by both the Case Studies (LogsScreen) and Mechanism
 *  (MechanismScreen) pagers. */
function SlideNavButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  const sideClass = direction === 'prev' ? 'left-4' : 'right-4';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous slide' : 'Next slide'}
      className={`absolute top-1/2 -translate-y-1/2 z-30 ${sideClass} w-14 h-14 rounded-full bg-black/55 hover:bg-black/75 border border-white/15 text-white text-3xl flex items-center justify-center shadow-lg transition disabled:opacity-25 disabled:cursor-not-allowed`}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

function SinglePane({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <AssetSlot
        key={src}
        src={src}
        alt={alt}
        className="object-contain"
        theme="dark"
      />
    </div>
  );
}

function PairPane({
  left,
  right,
}: {
  left: { src: string; label: string };
  right: { src: string; label: string; highlight?: boolean };
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 w-full h-full">
      <ComparisonImage src={left.src} label={left.label} />
      <ComparisonImage
        src={right.src}
        label={right.label}
        highlight={right.highlight ?? false}
      />
    </div>
  );
}

function ComparisonImage({
  src,
  label,
  highlight = false,
}: {
  src: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden border ${
        highlight
          ? 'border-white/40 ring-2 ring-white/30'
          : 'border-white/10'
      } bg-black/40`}
    >
      <AssetSlot
        key={src}
        src={src}
        alt={label}
        className="object-contain"
        theme="dark"
      />
      <div className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-full bg-black/60 text-xs uppercase tracking-[0.2em]">
        {label}
      </div>
    </div>
  );
}

/**
 * AnnotatedPane — log image on the left with SVG circles overlaid at
 * configured % positions, and a vertical stack of text cards on the right.
 * Each card calls out a different annotation block; the block's `tone`
 * colors both the card title and the strokes of its circles so the
 * visual association reads at a glance.
 *
 * The circles are drawn into the image's bounding box (SVG viewBox
 * `0 0 100 100` with `preserveAspectRatio="none"`) so positions stay locked
 * to the image as it letterboxes inside its column. Each circle is drawn
 * twice — a white halo underneath the tone-colored stroke — so it reads
 * against both the white log strip and the darker table header up top.
 */
function AnnotatedPane({
  src,
  alt,
  annotations,
}: {
  src: string;
  alt: string;
  annotations: LogAnnotation[];
}) {
  return (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 p-8">
      {/* Image column — AssetSlot fills the relative parent; circles ride
          on top in a same-bounding-box SVG. */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white">
        <AssetSlot
          key={src}
          src={src}
          alt={alt}
          className="object-contain"
          theme="light"
        />

        {/* Annotation overlay — pointer-events-none so taps still register
            on the lane underneath if anything were interactive. Flatten the
            annotations into a single circle list so each block can carry
            its own stroke colour. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {annotations.flatMap((a, ai) =>
            a.circles.map((c, ci) => {
              const r = c.rPct ?? 3.5;
              const stroke = toneStroke(a.tone);
              return (
                <g key={`a${ai}-c${ci}-${c.xPct}-${c.yPct}`}>
                  <circle
                    cx={c.xPct}
                    cy={c.yPct}
                    r={r}
                    fill="none"
                    stroke="white"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={c.xPct}
                    cy={c.yPct}
                    r={r}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={2.5}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Side-mounted text cards — stacked vertically and evenly spaced. */}
      <div className="flex flex-col justify-center gap-4">
        {annotations.map((a, i) => (
          <AnnotationCard key={`${a.title}-${i}`} annotation={a} />
        ))}
      </div>
    </div>
  );
}

function AnnotationCard({ annotation }: { annotation: LogAnnotation }) {
  const titleClass = annotation.tone === 'red'
    ? 'text-red-400'
    : annotation.tone === 'blue'
      ? 'text-[#7FA8E6]'
      : 'text-white';
  const stroke = toneStroke(annotation.tone);
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
      {annotation.eyebrow && (
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">
          {annotation.eyebrow}
        </p>
      )}
      <p className={`text-lg md:text-xl font-semibold leading-snug ${titleClass}`}>
        {annotation.title}
      </p>
      {annotation.bullets && annotation.bullets.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {annotation.bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm md:text-base text-white/85"
            >
              <span
                className="mt-2 inline-block w-1 h-1 rounded-full bg-white/60 shrink-0"
                aria-hidden="true"
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {annotation.detail && (
        <div className="relative mt-4 rounded-lg overflow-hidden bg-white aspect-[16/10]">
          <AssetSlot
            key={annotation.detail.src}
            src={annotation.detail.src}
            alt={annotation.detail.alt}
            className="object-contain"
            theme="light"
          />
          {annotation.detail.circles && annotation.detail.circles.length > 0 && (
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {annotation.detail.circles.map((c, i) => {
                const r = c.rPct ?? 4;
                return (
                  <g key={`detail-${i}-${c.xPct}-${c.yPct}`}>
                    <circle
                      cx={c.xPct}
                      cy={c.yPct}
                      r={r}
                      fill="none"
                      stroke="white"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={c.xPct}
                      cy={c.yPct}
                      r={r}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={2.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

/** Stroke color for an annotation's circles. Red for limitation zones,
 *  brand navy for benefit zones, neutral navy when unspecified. */
function toneStroke(tone?: 'red' | 'blue'): string {
  if (tone === 'red') return '#DC2626'; // tailwind red-600
  return '#1E4A9A';
}
