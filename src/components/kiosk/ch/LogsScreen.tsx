'use client';

import { useState } from 'react';
import { AssetSlot } from '@/components/kiosk/AssetSlot';

/**
 * LogsScreen — config-driven "Case Studies" sub-view.
 *
 * Used by the Cased Hole experiences (Helix / Rocker) and the Open Hole
 * `OverlayExperience` scaffolds. Each slide is either a single full-bleed
 * image or a left/right comparison pair; a pager steps through them.
 *
 * Missing images fall back to a "drop file here" placeholder so the screen
 * stays usable while graphics assets are in progress.
 *
 * Note on naming: the file, type and constants keep the historical `Logs`
 * naming for minimal churn — the displayed label was renamed to "Case
 * Studies" in May 2026.
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
      /** Annotated log — image on the left with transparent circles overlaid
       *  at specific spots; a stack of text cards sits on the right and each
       *  card calls out a different set of circles. Used for ICOTA-style log
       *  call-outs where a single strip shows multiple distinct outcomes
       *  (e.g. poor centralisation up top, excellent down below). */
      type: 'annotated';
      src: string;
      caption: string;
      annotations: LogAnnotation[];
    };

export interface LogsConfig {
  /** Shown as the screen heading, e.g. "Helix", "Pathfinder". */
  title: string;
  slides: LogsSlide[];
}

interface Props {
  config: LogsConfig;
  onBack: () => void;
}

// ── Cased Hole presets (ported from the original Helix/Rocker maps) ──────────
// Asset slots — drop files at these paths and the slides pick them up:
//   /public/images/kiosk-images/Helix_Log1.jpg    (annotated slide 1)
//   /public/images/kiosk-images/Helix_Log2.png    (annotated slide 2)
//   /public/images/kiosk-images/Helix_Log3-1.jpg  (annotated slide 3, main strip)
//   /public/images/kiosk-images/Helix_Log3-2.png  (annotated slide 3, ECCE histogram inset)
//   /public/images/helix-cbl-setup.png            (CBL slide)
//   /public/images/rocker-logs-{N}.png            (Rocker log comparisons)
//
// (The Helix lever-arm comparison images moved to the Mechanism slideshow
//  and now live under /public/images/kiosk-images/leverage-{conventional,
//  helix}.png — see HELIX_MECHANISM in MechanismScreen.)

export const HELIX_LOGS: LogsConfig = {
  title: 'Helix',
  slides: [
    // The leverage comparison that used to live here moved to the Helix
    // mechanism slideshow (slide 3 — see HELIX_MECHANISM in MechanismScreen).
    //
    // Slide 1 — PEMEX CIBIX-35 log strip. Four leftward drops in the red
    // HTEN curve, each only ~60 lbs, demonstrate how cleanly the CX9 Helix
    // runs through IBC + Sonic ledges. Circle positions are approximate
    // (% of the image bounding box) — easy to dial in from a tablet once
    // we're standing in front of the kiosk.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log1.jpg',
      caption: 'PEMEX CIBIX-35 — HELIX run',
      annotations: [
        {
          eyebrow: 'Key takeaway',
          title: '4 drops in HTEN of ONLY 60 lbs from CX9 on IBC & Sonic',
          tone: 'blue',
          circles: [
            { xPct: 80, yPct: 49 },
            { xPct: 72, yPct: 67 },
            { xPct: 71, yPct: 79 },
            { xPct: 69, yPct: 90 },
          ],
        },
      ],
    },
    // Slide 2 — ENI BlackTip P5 log strip. Two contrasting outcomes on the
    // same well: poor centralisation in the upper 13-3/8" with conventional
    // centralisers, then excellent centralisation in the deeper 9-5/8" and
    // 7" sections after switching to CX9. Two annotation blocks — red zone
    // up top, blue zone in the middle + bottom.
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
          circles: [
            // Sonic track, upper 13-3/8" zone — wider radius so it reads
            // as "this whole noisy region", not a pinpoint.
            { xPct: 65, yPct: 22, rPct: 7 },
          ],
        },
        {
          tone: 'blue',
          title: 'Excellent centralization in 9-5/8" and 7" casings with CX9',
          bullets: [
            'Difference between Min and Max TT’s < 10 µs',
          ],
          circles: [
            // Sonic track, 9-5/8" zone.
            { xPct: 65, yPct: 44, rPct: 5 },
            // Sonic track, 7" zone.
            { xPct: 65, yPct: 62, rPct: 5 },
          ],
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
  slides: [
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
  const slide = slides[index] as LogsSlide | undefined;

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

        {slide && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-sm">
            {slide.caption}
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <footer className="flex items-center justify-center gap-3 py-4 border-t border-white/10">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="text-white/60 text-sm tabular-nums">
            {index + 1} / {slides.length}
          </span>
          <button
            onClick={() =>
              setIndex((i) => Math.min(slides.length - 1, i + 1))
            }
            disabled={index === slides.length - 1}
            className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
          >
            Next →
          </button>
        </footer>
      )}
    </div>
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
