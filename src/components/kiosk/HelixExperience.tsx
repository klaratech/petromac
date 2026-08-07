'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Image from 'next/image';
import { useAutoHideHud } from '@/hooks/useAutoHideHud';
import { getKioskPrimeMode } from '@/hooks/useKioskDisplay';
import { deviceSpecs, systemMedia } from '@/features/catalog/deviceSpecs';
import { HELIX_MECHANISM, HELIX_LOGS, ROCKER_MECHANISM, ROCKER_LOGS } from './ch/ch-configs';

type View = 'video' | 'product' | 'mechanism' | 'logs';
type Product = 'helix' | 'rocker';

interface Props {
  onClose: () => void;
}

const HUD_AUTOHIDE_MS = 3200; // was 4000; -20% May 2026

const LoadingSubView = () => (
  <div className="w-full h-full bg-black flex items-center justify-center text-white/50 text-sm">
    Loading...
  </div>
);

const MechanismScreen = dynamic(() => import('./ch/MechanismScreen'), {
  ssr: false,
  loading: LoadingSubView,
});

const LogsScreen = dynamic(() => import('./ch/LogsScreen'), {
  ssr: false,
  loading: LoadingSubView,
});

const HelixProductScreen = dynamic(() => import('./ch/HelixProductScreen'), {
  ssr: false,
  loading: LoadingSubView,
});

const RockerProductScreen = dynamic(() => import('./ch/RockerProductScreen'), {
  ssr: false,
  loading: LoadingSubView,
});

/**
 * HelixExperience — Cased Hole lane orchestrator.
 *
 * Reorganised May 2026. The CH lane is now a three-tier flow:
 *
 *   1. video      — looping Helix attractor with two corner badges
 *                   (Helix + Rocker) and a top-right ✕. No top HUD pill;
 *                   the badges are the only call to action. ✕ exits the
 *                   experience back to the splash via the parent `onClose`.
 *   2. product    — image-based product page for whichever badge was
 *                   tapped (HelixProductScreen with CX7/CX9/CX13 panels,
 *                   or RockerProductScreen with Rocker + Rocker Inline).
 *                   Persistent pill on top: Mechanism · Case Studies ·
 *                   Specifications. Pill's `active` is undefined here
 *                   since the screen sits "above" the two sub-views.
 *   3. mechanism / logs — MechanismScreen / LogsScreen with their own
 *                   persistent pill (Specs included when the product has
 *                   a spec sheet). ✕ jumps straight back to the looping
 *                   video — no hierarchical step through the product
 *                   screen on exit. Configs and spec sheets are picked
 *                   from `deviceSpecs` based on the currently-active
 *                   `product`.
 *
 * The standalone RockerExperience.tsx that used to drive the Rocker
 * sub-flow is gone — its main view became RockerProductScreen and the
 * sub-view configs are folded back in here.
 */
export default function HelixExperience({ onClose }: Props) {
  const [view, setView] = useState<View>('video');
  // Which product owns the current sub-view (mechanism/logs/product).
  // Default doesn't matter — set explicitly when the visitor taps a
  // corner badge, before any sub-view ever renders.
  const [product, setProduct] = useState<Product>('helix');

  const { hudVisible, handleTap } = useAutoHideHud(view === 'video', HUD_AUTOHIDE_MS);

  const media = systemMedia['Focus Centralizers'];
  const primeMode = getKioskPrimeMode();
  // transcoded/ is 1080p since Aug 2026, so there is no HD tier to resolve
  // — the path in deviceSpecs is already the one to play.
  const videoSrc = media?.video ?? '';

  // Resolve specs once per product so sub-views and the product screen
  // share the same source of truth.
  const activeSpec = product === 'helix' ? deviceSpecs['/models/helix.glb'] : deviceSpecs.rocker;
  const specs = activeSpec?.specs;
  const specsGraph = activeSpec?.graph;

  const handleOpenProduct = (next: Product) => {
    setProduct(next);
    setView('product');
  };

  const exitToVideo = () => setView('video');

  // ── Sub-view: product image page (Helix or Rocker) ─────────────────────────
  if (view === 'product') {
    const ProductScreen = product === 'helix' ? HelixProductScreen : RockerProductScreen;
    return (
      <FullScreenLayer>
        <ProductScreen
          onClose={exitToVideo}
          onSwitchSection={setView}
          {...(specs ? { specs } : {})}
          {...(specsGraph ? { specsGraph } : {})}
        />
      </FullScreenLayer>
    );
  }

  // ── Sub-view: Mechanism slides for the active product ─────────────────────
  if (view === 'mechanism') {
    const baseMech = product === 'helix' ? HELIX_MECHANISM : ROCKER_MECHANISM;
    const configWithSpecs = {
      ...baseMech,
      ...(specs ? { specs } : {}),
      ...(specsGraph ? { specsGraph } : {}),
    };
    return (
      <FullScreenLayer>
        <MechanismScreen config={configWithSpecs} onBack={exitToVideo} onSwitchSection={setView} />
      </FullScreenLayer>
    );
  }

  // ── Sub-view: Case Studies pager for the active product ───────────────────
  if (view === 'logs') {
    const baseLogs = product === 'helix' ? HELIX_LOGS : ROCKER_LOGS;
    const logsWithSpecs = {
      ...baseLogs,
      ...(specs ? { specs } : {}),
      ...(specsGraph ? { specsGraph } : {}),
    };
    return (
      <FullScreenLayer>
        <LogsScreen config={logsWithSpecs} onBack={exitToVideo} onSwitchSection={setView} />
      </FullScreenLayer>
    );
  }

  // ── Main: looping Helix video + two corner badges (Helix, Rocker) ─────────
  return (
    <FullScreenLayer>
      <div
        className="relative w-full h-full bg-black"
        onClick={handleTap}
        onTouchStart={handleTap}
        onMouseMove={handleTap}
      >
        {media?.video ? (
          // Audio on — user tapped CH on the splash to reach this view, so
          // user activation is established and autoplay-with-sound works.
          // Native controls expose play/pause/scrub/volume/fullscreen so
          // attendees can pause/replay the loop during a walk-through.
          <video
            src={videoSrc}
            autoPlay={!primeMode}
            muted={primeMode}
            loop
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            preload="metadata"
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/60">
            No Helix video available.
          </div>
        )}

        {/* Subtle dark overlay so chrome stays readable over bright frames */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Top-right close — fades with the rest of the chrome. */}
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

        {/* Bottom-right corner badges — the two product entry points. Pair
            sits at bottom-24 to clear the native HTML5 video control bar.
            The old top-center HUD pill (Mechanism · Case Studies) was
            dropped May 2026 — visitors now pick a product first, then
            drill into M/CS from inside that product's page. */}
        <div
          className={`absolute bottom-24 right-8 z-40 flex items-center gap-3 transition-opacity duration-250 ${
            hudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <CornerBadge
            label="Helix"
            ariaLabel="Open Helix product page"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProduct('helix');
            }}
          />
          <CornerBadge
            label="Rocker"
            ariaLabel="Open Rocker product page"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProduct('rocker');
            }}
          />
        </div>
      </div>
    </FullScreenLayer>
  );
}

/** Shared full-screen wrapper so all views render at the same z-layer.
 *  No fade-in motion — the lane attractor underneath is already paused
 *  by LaneClient when an experience opens, so the snap to z-50 over black
 *  is the dramatic reveal on its own. */
function FullScreenLayer({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 bg-black">{children}</div>;
}

/** Bottom-right corner badge — same affordance Rocker / Helix used to
 *  carry individually, now reused for both product entry points on the
 *  video view. Wordmark silhouette + label text in a rounded pill. */
function CornerBadge({
  label,
  ariaLabel,
  onClick,
}: {
  label: string;
  ariaLabel: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="group flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/15 hover:bg-white/30 border border-white/25 text-white text-[10px] font-semibold tracking-[0.18em] uppercase shadow-md"
    >
      {/* Corner-badge silhouette pending — tracked in TODO.md. Both badges
          carry the same focus.png wordmark for now. */}
      <span className="w-5 h-5 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white/80 overflow-hidden">
        <Image
          src="/images/focus.png"
          alt=""
          width={31}
          height={12}
          unoptimized
          className="h-2 w-auto opacity-80"
        />
      </span>
      <span>{label}</span>
    </button>
  );
}
