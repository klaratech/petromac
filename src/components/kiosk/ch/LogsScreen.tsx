'use client';

import Image from 'next/image';
import { useState } from 'react';

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
//   /public/images/leverage-conventional.png  (slide 5, left)
//   /public/images/leverage-helix.png         (slide 5, right)
//   /public/images/helix-cbl-setup.png        (slide 8)
//   /public/images/rocker-logs-{N}.png        (Rocker log comparisons)

export const HELIX_LOGS: LogsConfig = {
  title: 'Helix',
  slides: [
    {
      type: 'pair',
      caption: 'Improved leverage to enter restrictions (slide 5)',
      left: { src: '/images/leverage-conventional.png', label: 'Conventional' },
      right: {
        src: '/images/leverage-helix.png',
        label: 'HELIX',
        highlight: true,
      },
    },
    {
      type: 'single',
      src: '/images/helix-cbl-setup.png',
      caption: 'Ultrasonic-CBL set-up with HELIX (slide 8)',
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
        ) : (
          <PairPane left={slide.left} right={slide.right} />
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
      <Image
        key={src}
        src={src}
        alt={alt}
        fill
        className="object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm px-8 text-center -z-10">
        Drop file at <code className="text-white/70 mx-1">{src}</code>
      </div>
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
      <Image
        key={src}
        src={src}
        alt={label}
        fill
        className="object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs px-4 text-center -z-10">
        Drop file at <code className="text-white/70 mx-1">{src}</code>
      </div>
      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 text-xs uppercase tracking-[0.2em]">
        {label}
      </div>
    </div>
  );
}
