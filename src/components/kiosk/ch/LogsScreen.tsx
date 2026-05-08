'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * LogsScreen — sub-view for the "Logs" HUD button on Helix / Rocker.
 *
 * Each slide is either a single full-bleed image, or a left/right pair
 * (e.g. the leverage comparison from slide 5 split into conventional vs.
 * HELIX). Pager at the bottom lets the user step through slides.
 *
 * Asset slots (drop files at these paths and the screen will pick them up):
 *   /public/images/helix-cbl-setup.png        Ultrasonic-CBL set-up (slide 8)
 *   /public/images/leverage-conventional.png  Conventional leverage (slide 5, left half)
 *   /public/images/leverage-helix.png         HELIX leverage         (slide 5, right half)
 *   /public/images/helix-logs-{N}.png         Extra log-comparison slides for HELIX
 *   /public/images/rocker-logs-{N}.png        Log-comparison slides for ROCKER
 */

interface Props {
  system: 'Helix' | 'Rocker';
  onBack: () => void;
}

type Slide =
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

const SLIDES: Record<Props['system'], Slide[]> = {
  Helix: [
    {
      type: 'pair',
      caption: 'Improved leverage to enter restrictions (slide 5)',
      left: {
        src: '/images/leverage-conventional.png',
        label: 'Conventional',
      },
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
  Rocker: [
    {
      type: 'single',
      src: '/images/rocker-logs-1.png',
      caption: 'Rocker log comparison',
    },
  ],
};

export default function LogsScreen({ system, onBack }: Props) {
  const slides = SLIDES[system];
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Logs
          </p>
          <h2 className="text-3xl font-extrabold">{system}</h2>
        </div>
        <button
          onClick={onBack}
          className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm tracking-wide"
        >
          ← Back
        </button>
      </header>

      <div className="flex-1 relative bg-black">
        {slide.type === 'single' ? (
          <SinglePane src={slide.src} alt={slide.caption} />
        ) : (
          <PairPane left={slide.left} right={slide.right} />
        )}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-sm">
          {slide.caption}
        </div>
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
