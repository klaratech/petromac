'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAutoHideHud } from '@/hooks/useAutoHideHud';
import { deviceSpecs } from '@modules/catalog/data/deviceSpecs';
import MechanismScreen, { ROCKER_MECHANISM } from './MechanismScreen';
import LogsScreen, { ROCKER_LOGS } from './LogsScreen';
import { AssetSlot } from '@/components/kiosk/AssetSlot';

type View = 'main' | 'mechanism' | 'logs';

interface Props {
  onBack: () => void;   // back to Helix / Focus Centralizers main
  onClose: () => void;  // close the entire CH experience
}

const HUD_AUTOHIDE_MS = 3200; // was 4000; -20% May 2026

/**
 * RockerExperience — sister view to HelixExperience for the
 * smaller-casing Rocker tool. Same 2-button HUD (Mechanism · Case Studies)
 * + Helix corner badge. There's no intro video for Rocker — the main view
 * is a clean side-by-side of the two tool variants (Rocker / Rocker
 * Inline) on a dark backdrop. Track Record + Success Stories live INSIDE
 * the Case Studies pager (first slide is the map).
 *
 * Asset slots:
 *   /public/images/kiosk-images/rocker.png         (Rocker tool render — left panel)
 *   /public/images/kiosk-images/rocker-inline.png  (Rocker Inline tool render — right panel)
 */
export default function RockerExperience({ onBack, onClose }: Props) {
  const [view, setView] = useState<View>('main');
  const { hudVisible, handleTap } = useAutoHideHud(
    view === 'main',
    HUD_AUTOHIDE_MS,
  );

  if (view === 'mechanism') {
    const rockerSpec = deviceSpecs['/models/rocker.glb'];
    const configWithSpecs = {
      ...ROCKER_MECHANISM,
      ...(rockerSpec?.specs ? { specs: rockerSpec.specs } : {}),
      ...(rockerSpec?.graph ? { specsGraph: rockerSpec.graph } : {}),
    };
    return (
      <FullScreenLayer>
        <MechanismScreen config={configWithSpecs} onBack={() => setView('main')} />
      </FullScreenLayer>
    );
  }

  if (view === 'logs') {
    return (
      <FullScreenLayer>
        <LogsScreen config={ROCKER_LOGS} onBack={() => setView('main')} />
      </FullScreenLayer>
    );
  }

  // Main view — wrap in FullScreenLayer so this works whether opened from
  // HelixExperience (which already wraps us) or directly from
  // the CH lane attractor (LaneClient renders us inline). Without this, the
  // lane's right-side overlay strip (z-20) showed through.
  return (
    <FullScreenLayer>
    <div
      className="relative w-full h-full bg-black"
      onClick={handleTap}
      onTouchStart={handleTap}
      onMouseMove={handleTap}
    >
      {/* Background — dark gradient + soft radial highlight behind the tools */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_55%)] pointer-events-none" />

      {/* Top-left eyebrow — identifies the screen since there's no narration. */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          Cased Hole
        </p>
        <h2 className="text-3xl font-extrabold text-white drop-shadow">
          Rocker
        </h2>
      </div>

      {/* Two-tool layout — Rocker on the left, Rocker Inline on the right.
          Top + bottom padding leaves the HUD strip and corner badge clear. */}
      <div className="absolute inset-0 px-10 pt-28 pb-24 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 z-10">
        <ToolPanel
          src="/images/kiosk-images/rocker.png"
          alt="Rocker"
          label="Rocker"
        />
        <ToolPanel
          src="/images/kiosk-images/rocker-inline.png"
          alt="Rocker Inline"
          label="Rocker Inline"
        />
      </div>

      {/* Top-right close — fades with the HUD via CSS opacity. */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className={`absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white text-3xl font-bold transition-opacity duration-250 ${
          hudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        ✕
      </button>

      {/* HUD button strip — bumped bg-black/65 (was bg-black/35 +
          backdrop-blur). Same readability without the per-frame composite
          cost of backdrop-filter. */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 px-2 py-2 rounded-xl bg-black/65 border border-white/10 shadow-xl transition-opacity duration-250 ${
          hudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <HudButton
          label="Mechanism"
          onClick={(e) => {
            e.stopPropagation();
            setView('mechanism');
          }}
        />
        <HudButton
          label="Case Studies"
          onClick={(e) => {
            e.stopPropagation();
            setView('logs');
          }}
        />
      </div>

      {/* Helix corner badge — bottom-right, fades with the HUD. Mirrors
          the Rocker badge on the Focus Centralizers (Helix) experience. */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBack();
        }}
        aria-label="Back to Helix"
        className={`absolute bottom-8 right-8 z-40 group flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/15 hover:bg-white/30 border border-white/25 text-white text-[10px] font-semibold tracking-[0.18em] uppercase shadow-md transition-opacity duration-250 ${
          hudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Corner-badge silhouette pending — tracked in TODO.md. */}
        <span className="w-5 h-5 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white/80">
          <Image
            src="/images/focus.png"
            alt=""
            width={12}
            height={12}
            className="opacity-80"
          />
        </span>
        <span>Helix</span>
      </button>
    </div>
    </FullScreenLayer>
  );
}

/** Shared full-screen wrapper so all RockerExperience views render at the
 *  same fixed z-50 layer — covers the lane attractor + overlay strip when
 *  Rocker is opened directly from the CH lane. Snap-mount, no fade. */
function FullScreenLayer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {children}
    </div>
  );
}

function HudButton({
  label,
  onClick,
}: {
  label: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white/85 hover:text-white text-xs font-medium tracking-wide transition-colors"
    >
      {label}
    </button>
  );
}

/**
 * ToolPanel — one of the two tool renders on the Rocker main view.
 * Centred image with a subtle frame and a small uppercase label underneath.
 * Falls back to a "drop file" placeholder if the asset is missing.
 */
function ToolPanel({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-full flex-1 min-h-0">
        <AssetSlot
          src={src}
          alt={alt}
          priority
          sizes="(min-width: 768px) 45vw, 90vw"
          className="object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.35)]"
        />
      </div>
      <div className="mt-4 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white/85 text-xs uppercase tracking-[0.3em]">
        {label}
      </div>
    </div>
  );
}
