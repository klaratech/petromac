'use client';

import { useState } from 'react';
import SectionPill, { type Section } from './SectionPill';
import SpecsModal from './SpecsModal';
import ToolPanel from './ToolPanel';

/**
 * RockerProductScreen — image-based "Rocker product" page that the visitor
 * lands on after tapping the Rocker corner badge on the CH lane's looping
 * video.
 *
 * Lifted in May 2026 out of the old standalone RockerExperience.tsx as
 * part of the CH lane reorganisation. The two-tool layout (Rocker +
 * Rocker Inline) is unchanged; what's new is the persistent pill on top
 * (Mechanism · Case Studies · Specifications) so the visitor can drill
 * straight into either sub-view without hopping back to the looping video.
 *
 * Asset slots:
 *   /public/images/kiosk-images/rocker.webp         (Rocker tool — left panel)
 *   /public/images/kiosk-images/rocker-inline.webp  (Rocker Inline — right panel)
 *
 * Close ✕ jumps straight back to the looping video (no hierarchical step
 * through this screen on exit, matching HelixProductScreen).
 */
interface Props {
  onClose: () => void;
  onSwitchSection: (_section: Section) => void;
  specs?: Record<string, string>;
  specsGraph?: string;
}

export default function RockerProductScreen({
  onClose,
  onSwitchSection,
  specs,
  specsGraph,
}: Props) {
  const [specsOpen, setSpecsOpen] = useState(false);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Background — same dark gradient + radial highlight as the Helix
          product page so the two CH screens share visual language. */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_55%)] pointer-events-none" />

      {/* Top-left eyebrow — identifies the product family. */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">Cased Hole</p>
        <h2 className="text-3xl font-extrabold text-white drop-shadow">Rocker</h2>
      </div>

      {/* Two-tool layout — Rocker on the left, Rocker Inline on the right. */}
      <div className="absolute inset-0 px-10 pt-28 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 z-10">
        <ToolPanel
          src="/images/kiosk-images/rocker.webp"
          alt="Rocker"
          label="Rocker"
          sizes="(min-width: 768px) 45vw, 90vw"
        />
        <ToolPanel
          src="/images/kiosk-images/rocker-inline.webp"
          alt="Rocker Inline"
          label="Rocker Inline"
          sizes="(min-width: 768px) 45vw, 90vw"
        />
      </div>

      {/* Top-center persistent pill (Mechanism · Case Studies · Specifications).
          No section highlighted — this screen is the product overview, not
          either of the sub-views. */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <SectionPill
          onSwitch={onSwitchSection}
          onOpenSpecs={specs ? () => setSpecsOpen(true) : undefined}
        />
      </div>

      {/* Top-right close — exits straight to the looping video. */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-50 text-white text-3xl font-bold w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
      >
        ✕
      </button>

      {specsOpen && specs && (
        <SpecsModal specs={specs} graph={specsGraph} onClose={() => setSpecsOpen(false)} />
      )}
    </div>
  );
}
