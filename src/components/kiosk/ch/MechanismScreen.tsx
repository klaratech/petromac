'use client';

/**
 * MechanismScreen — sub-view for the Cased Hole experience.
 *
 * Shown when the user taps the "Mechanism" HUD button on either the Helix
 * (Focus Centralizers) or Rocker view. Once Rajesh delivers the videos
 * extracted from ICOTA 2026 MaIn.pptx, this component plays them with a
 * conventional-vs-Petromac comparison layout matching slides 3–7.
 *
 * Asset slots (drop files at these paths and the screen will pick them up):
 *   /public/videos/helix-mechanism.mp4           HELIX mechanism animation (slide 4)
 *   /public/videos/conventional-largecasings.mp4 Conventional mechanism, large casing (slide 3)
 *   /public/videos/rocker-mechanism.mp4          ROCKER mechanism animation (slide 7)
 *   /public/videos/conventional-smallcasings.mp4 Conventional mechanism, small tubing/casing (slide 6)
 */

interface Props {
  system: 'Helix' | 'Rocker';
  onBack: () => void;
}

const VIDEOS: Record<
  Props['system'],
  { conventional: string; petromac: string; conventionalLabel: string; petromacLabel: string }
> = {
  Helix: {
    conventional: '/videos/conventional-largecasings.mp4',
    petromac: '/videos/helix-mechanism.mp4',
    conventionalLabel: 'Conventional Mechanism',
    petromacLabel: 'HELIX Mechanism',
  },
  Rocker: {
    conventional: '/videos/conventional-smallcasings.mp4',
    petromac: '/videos/rocker-mechanism.mp4',
    conventionalLabel: 'Conventional Mechanism',
    petromacLabel: 'ROCKER Mechanism',
  },
};

export default function MechanismScreen({ system, onBack }: Props) {
  const v = VIDEOS[system];

  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Mechanism
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

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
        <MechanismPane label={v.conventionalLabel} src={v.conventional} />
        <MechanismPane
          label={v.petromacLabel}
          src={v.petromac}
          highlight
        />
      </div>

      <footer className="px-8 py-4 text-center text-white/50 text-sm">
        Source: ICOTA 2026 deck — slides {system === 'Helix' ? '3 & 4' : '6 & 7'}.
      </footer>
    </div>
  );
}

function MechanismPane({
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
