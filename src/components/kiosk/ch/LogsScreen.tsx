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
       *  at specific spots; a text label sits in a card to the right that
       *  describes what the circles are pointing at. Used for ICOTA-style
       *  log call-outs where multiple drops / spikes / events share a single
       *  takeaway. */
      type: 'annotated';
      src: string;
      caption: string;
      annotation: {
        /** Single text block describing what the circles are pointing to,
         *  e.g. "4 drops in HTEN of ONLY 60lbs from CX9 on IBC & Sonic". */
        text: string;
        /** Optional shorter eyebrow above the text, e.g. "Key takeaway". */
        eyebrow?: string;
        /** Circle markers placed on top of the image. */
        circles: AnnotationCircle[];
      };
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
//   /public/images/kiosk-images/Helix_Log1.jpg  (annotated slide 1)
//   /public/images/helix-cbl-setup.png          (CBL slide)
//   /public/images/rocker-logs-{N}.png          (Rocker log comparisons)
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
    // runs through IBC + Sonic ledges. The circle positions are
    // approximate (% of the image bounding box) — easy to dial in from a
    // tablet once we're standing in front of the kiosk.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log1.jpg',
      caption: 'PEMEX CIBIX-35 — HELIX run',
      annotation: {
        eyebrow: 'Key takeaway',
        text: '4 drops in HTEN of ONLY 60 lbs from CX9 on IBC & Sonic',
        circles: [
          { xPct: 80, yPct: 49 },
          { xPct: 72, yPct: 67 },
          { xPct: 71, yPct: 79 },
          { xPct: 69, yPct: 90 },
        ],
      },
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
            annotation={slide.annotation}
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
 * configured % positions, and a side-mounted text card on the right that
 * describes what the circles are pointing at. Replaces the
 * "single-callout-with-N-arrows" pattern from the slide deck source.
 *
 * The circles are drawn into the image's bounding box (an SVG with
 * `preserveAspectRatio="none"` 0..100 coordinate space) so the positions
 * stay locked to the image as it letterboxes inside its column. Stroke
 * is the brand navy with a thin white halo so it reads on both the
 * white log strip and the darker table header at the top.
 */
function AnnotatedPane({
  src,
  alt,
  annotation,
}: {
  src: string;
  alt: string;
  annotation: {
    text: string;
    eyebrow?: string | undefined;
    circles: AnnotationCircle[];
  };
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
            on the lane underneath if anything were interactive. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {annotation.circles.map((c, i) => {
            const r = c.rPct ?? 3.5;
            return (
              <g key={`${c.xPct}-${c.yPct}-${i}`}>
                {/* White halo underneath the navy stroke — keeps the
                    circle visible on top of the red HTEN curve. */}
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
                  stroke="#1E4A9A"
                  strokeWidth={2.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side-mounted text card */}
      <div className="flex items-center">
        <div className="w-full rounded-2xl border border-white/15 bg-white/5 p-6">
          {annotation.eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3">
              {annotation.eyebrow}
            </p>
          )}
          <p className="text-xl md:text-2xl font-semibold leading-snug text-white">
            {annotation.text}
          </p>
        </div>
      </div>
    </div>
  );
}
