'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAutoHideHud } from '@/hooks/useAutoHideHud';
import { deviceSpecs, systemMedia } from '@modules/catalog/data/deviceSpecs';
import { useKioskVideo } from '@/hooks/useKioskVideo';
import MechanismScreen from './ch/MechanismScreen';
import LogsScreen from './ch/LogsScreen';
import RockerExperience from './ch/RockerExperience';
import { HELIX_MECHANISM, HELIX_LOGS } from './ch/ch-configs';

type View = 'main' | 'mechanism' | 'logs' | 'rocker';

interface Props {
  onClose: () => void;
}

const HUD_AUTOHIDE_MS = 3200; // was 4000; -20% May 2026

/**
 * HelixExperience — cased-hole Helix view.
 *
 * Lives under the "Focus Centralizers" product family in systemMedia
 * (Helix + Rocker both belong to that family), but this component is
 * specifically the Helix entry point. Splash → Cased Hole lands here.
 *
 * - Helix intro video loops fullscreen in the background.
 * - HUD strip of 2 buttons (Mechanism, Case Studies) appears on entry,
 *   fades out after HUD_AUTOHIDE_MS of no interaction. Tap anywhere to
 *   bring it back. Track Record + Success Stories live INSIDE Case
 *   Studies now — the map is the first slide of the case-studies pager,
 *   Success Stories opens inline from the in-map link.
 * - Bottom-right corner badge for ROCKER → opens the sister Rocker view
 *   with the same 2-button HUD over a still product layout.
 */
export default function HelixExperience({ onClose }: Props) {
  const [view, setView] = useState<View>('main');
  const { hudVisible, handleTap } = useAutoHideHud(
    view === 'main',
    HUD_AUTOHIDE_MS,
  );

  const media = systemMedia['Focus Centralizers'];
  // Route the Helix video through useKioskVideo so the CH lane gets the
  // same HD upgrade path (videos/kiosk-hd/<file>.mp4) as the lane attractor.
  const videoSrc = useKioskVideo(media?.video ?? '');

  if (view === 'mechanism') {
    // Inject the live Helix spec sheet + load-capacity graph so the
    // Specifications button in the Mechanism header opens with real data.
    const helixSpec = deviceSpecs['/models/helix.glb'];
    const configWithSpecs = {
      ...HELIX_MECHANISM,
      ...(helixSpec?.specs ? { specs: helixSpec.specs } : {}),
      ...(helixSpec?.graph ? { specsGraph: helixSpec.graph } : {}),
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
        <LogsScreen config={HELIX_LOGS} onBack={() => setView('main')} />
      </FullScreenLayer>
    );
  }

  if (view === 'rocker') {
    return (
      <FullScreenLayer>
        <RockerExperience
          onBack={() => setView('main')}
          onClose={onClose}
        />
      </FullScreenLayer>
    );
  }

  // Main: Helix video on loop + HUD overlay + Rocker corner
  return (
    <FullScreenLayer>
      <div
        className="relative w-full h-full bg-black"
        onClick={handleTap}
        onTouchStart={handleTap}
        onMouseMove={handleTap}
      >
        {media?.video ? (
          // Audio on — user tapped the CH Helix overlay to reach this view,
          // so user activation is established and autoplay-with-sound is allowed.
          // No native `controls` — kiosk uses its own HUD.
          <video
            src={videoSrc}
            autoPlay
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/60">
            No Helix video available.
          </div>
        )}

        {/* Subtle dark overlay so HUD copy stays readable over bright frames */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Top-right close — fades with the HUD via CSS opacity. */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className={`absolute top-4 right-4 z-50 text-white text-3xl font-bold w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-opacity duration-250 ${
            hudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          ✕
        </button>

        {/* HUD button strip — bumped bg-black/65 (was bg-black/35 +
            backdrop-blur) to keep contrast without the per-frame composite
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

        {/* Rocker corner badge — fades with the HUD. */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setView('rocker');
          }}
          aria-label="Open Rocker"
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
          <span>Rocker</span>
        </button>
      </div>
    </FullScreenLayer>
  );
}

/** Shared full-screen wrapper so all views render at the same z-layer.
 *  No fade-in motion — the lane attractor underneath is already paused
 *  by LaneClient when an experience opens, so the snap to z-50 over black
 *  is the dramatic reveal on its own. */
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
