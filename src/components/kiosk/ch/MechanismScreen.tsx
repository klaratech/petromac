'use client';

/**
 * MechanismScreen — config-driven "Mechanism" sub-view.
 *
 * Used by the Cased Hole experiences (Helix / Rocker) and the Open Hole
 * `OverlayExperience` scaffolds. Renders a side-by-side comparison of
 * conventional vs. Petromac mechanism clips.
 *
 * Each pane plays a looping video; if the file isn't present yet the pane
 * shows a "drop file here" placeholder so the screen stays usable while
 * graphics assets are in progress.
 */

export interface MechanismPane {
  label: string;
  /** Video path under /public. */
  src: string;
  /** Outline the pane (use for the Petromac side of a comparison). */
  highlight?: boolean;
}

export interface MechanismConfig {
  /** Shown as the screen heading, e.g. "Helix", "Pathfinder". */
  title: string;
  /** Comparison panes — typically two (conventional vs. Petromac). */
  panes: MechanismPane[];
  /** Optional footer note, e.g. a slide reference. */
  sourceNote?: string;
}

interface Props {
  config: MechanismConfig;
  onBack: () => void;
}

// ── Cased Hole presets (ported from the original Helix/Rocker maps) ──────────
// Asset slots — drop files at these paths and the panes pick them up:
//   /public/videos/transcoded/conventional-largecasings.mp4   (slide 3)
//   /public/videos/transcoded/helix-mechanism.mp4             (slide 4)
//   /public/videos/transcoded/conventional-smallcasings.mp4   (slide 6)
//   /public/videos/transcoded/rocker-mechanism.mp4            (slide 7)

export const HELIX_MECHANISM: MechanismConfig = {
  title: 'Helix',
  panes: [
    {
      label: 'Conventional Mechanism',
      src: '/videos/transcoded/conventional-largecasings.mp4',
    },
    {
      label: 'HELIX Mechanism',
      src: '/videos/transcoded/helix-mechanism.mp4',
      highlight: true,
    },
  ],
  sourceNote: 'Source: ICOTA 2026 deck — slides 3 & 4.',
};

export const ROCKER_MECHANISM: MechanismConfig = {
  title: 'Rocker',
  panes: [
    {
      label: 'Conventional Mechanism',
      src: '/videos/transcoded/conventional-smallcasings.mp4',
    },
    {
      label: 'ROCKER Mechanism',
      src: '/videos/transcoded/rocker-mechanism.mp4',
      highlight: true,
    },
  ],
  sourceNote: 'Source: ICOTA 2026 deck — slides 6 & 7.',
};

export default function MechanismScreen({ config, onBack }: Props) {
  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Mechanism
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

      <div
        className={`flex-1 grid grid-cols-1 gap-6 p-8 ${
          config.panes.length > 1 ? 'md:grid-cols-2' : ''
        }`}
      >
        {config.panes.map((pane) => (
          <MechanismPaneView
            key={`${pane.label}-${pane.src}`}
            label={pane.label}
            src={pane.src}
            highlight={pane.highlight ?? false}
          />
        ))}
      </div>

      {config.sourceNote && (
        <footer className="px-8 py-4 text-center text-white/50 text-sm">
          {config.sourceNote}
        </footer>
      )}
    </div>
  );
}

function MechanismPaneView({
  label,
  src,
  highlight = false,
}: {
  label: string;
  src: string;
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
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-contain"
        onError={(e) => {
          // Hide broken video element so the placeholder div behind it shows.
          (e.currentTarget as HTMLVideoElement).style.display = 'none';
        }}
      />
      <div className="absolute inset-0 -z-10 flex items-center justify-center text-white/40 text-sm px-6 text-center">
        Drop file at <code className="text-white/70 mx-1">{src}</code>
      </div>
      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 text-xs uppercase tracking-[0.2em]">
        {label}
      </div>
    </div>
  );
}
