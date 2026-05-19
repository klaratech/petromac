'use client';

import { useState } from 'react';
import SectionPill, { type Section } from './SectionPill';
import SpecsModal from './SpecsModal';
import ToolPanel from './ToolPanel';

/**
 * HelixProductScreen — image-based "Helix product" page that the visitor
 * lands on after tapping the Helix corner badge on the CH lane's looping
 * video.
 *
 * Three side-by-side tool renders for the casing-size variants
 * (CX7 / CX9 / CX13) on a dark canvas, with the persistent pill
 * (Mechanism · Case Studies · Specifications) on top. The pill carries no
 * active section here — the visitor is sitting "above" the M/CS sub-views
 * and either pill option is a peer drill-down. Specifications opens
 * SpecsModal in-place. Close ✕ jumps straight back to the looping video
 * (no hierarchical step through this screen on exit).
 *
 * Asset slots — drop PNGs with transparent backgrounds at:
 *   /public/images/kiosk-images/helix-cx7.png
 *   /public/images/kiosk-images/helix-cx9.png
 *   /public/images/kiosk-images/helix-cx13.png
 * Missing assets fall back to AssetSlot's "drop file" placeholder so the
 * screen stays usable while content is in progress.
 */
interface Props {
  onClose: () => void;
  onSwitchSection: (_section: Section) => void;
  specs?: Record<string, string>;
  specsGraph?: string;
}

const VARIANTS: ReadonlyArray<{ src: string; label: string }> = [
  { src: '/images/kiosk-images/helix-cx7.png', label: 'CX7' },
  { src: '/images/kiosk-images/helix-cx9.png', label: 'CX9' },
  { src: '/images/kiosk-images/helix-cx13.png', label: 'CX13' },
];

export default function HelixProductScreen({
  onClose,
  onSwitchSection,
  specs,
  specsGraph,
}: Props) {
  const [specsOpen, setSpecsOpen] = useState(false);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Background — dark gradient + soft radial highlight, same treatment
          as RockerProductScreen so the two CH product pages share visual
          language. */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_55%)] pointer-events-none" />

      {/* Top-left eyebrow — identifies the product family at a glance since
          the pill itself doesn't carry a device name. */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          Cased Hole
        </p>
        <h2 className="text-3xl font-extrabold text-white drop-shadow">Helix</h2>
      </div>

      {/* Three side-by-side variant panels. Top + bottom padding clears the
          pill at top and any breathing room at bottom; gap is wider than
          Rocker's 2-column layout because CX7/CX9/CX13 are visually close
          cousins and need room to read distinctly. */}
      <div className="absolute inset-0 px-10 pt-28 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 z-10">
        {VARIANTS.map((v) => (
          <ToolPanel
            key={v.label}
            src={v.src}
            alt={`Helix ${v.label}`}
            label={v.label}
            sizes="(min-width: 768px) 30vw, 90vw"
          />
        ))}
      </div>

      {/* Top-center persistent pill. `active` left undefined: this screen
          isn't either of the sub-views so neither pill is highlighted. */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <SectionPill
          onSwitch={onSwitchSection}
          onOpenSpecs={specs ? () => setSpecsOpen(true) : undefined}
        />
      </div>

      {/* Top-right close — always-visible (no auto-hide here since the pill
          is also always visible). Exits all the way to the looping video. */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-50 text-white text-3xl font-bold w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
      >
        ✕
      </button>

      {specsOpen && specs && (
        <SpecsModal
          specs={specs}
          graph={specsGraph}
          onClose={() => setSpecsOpen(false)}
        />
      )}
    </div>
  );
}
