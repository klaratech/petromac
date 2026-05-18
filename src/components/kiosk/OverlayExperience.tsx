'use client';

import { useState } from 'react';
import { useAutoHideHud } from '@/hooks/useAutoHideHud';
import { useKioskVideo } from '@/hooks/useKioskVideo';
import MechanismScreen, {
  type MechanismConfig,
} from '@/components/kiosk/ch/MechanismScreen';
import LogsScreen, { type LogsConfig } from '@/components/kiosk/ch/LogsScreen';

/**
 * Config for a generic kiosk product experience.
 *
 * Open-hole sibling of `HelixExperience` — same shape: looping
 * video background + 2-button HUD (Mechanism · Case Studies) + close.
 * Driven by a config object so new overlay buttons can be added without
 * copy-pasting a component. Track Record + Success Stories live INSIDE
 * the Case Studies pager (first slide is the map).
 *
 * To "build out" an experience (per the Helix pattern), fill in the optional
 * fields below. Anything left undefined renders a clearly-marked placeholder
 * panel so the kiosk stays usable while content is in progress.
 */
export interface OverlayExperienceConfig {
  /** Eyebrow label, e.g. "Open Hole". */
  laneLabel: string;
  /** Big title shown top-left, e.g. "Formation Testing". */
  title: string;
  /** Optional sub-label under the title, e.g. a model name. */
  subtitle?: string;
  /** Featured video that loops fullscreen behind the HUD. */
  video: string;
  /**
   * When set, the Case Studies pager prepends a map slide filtered to this
   * system (must match the `system` field in operations data). Folded
   * into `logs.trackRecord.system` at the call site if `logs` is provided.
   */
  trackRecordSystem?: string;
  /**
   * When true, the in-map "Success Stories" link is shown and opens the
   * flipbook as an inline takeover of the LogsScreen pager.
   */
  enableSuccessStories?: boolean;
  /**
   * When set, the "Mechanism" button opens the real comparison screen.
   * Leave undefined to show the placeholder.
   */
  mechanism?: MechanismConfig;
  /**
   * When set, the "Case Studies" button opens the slide screen. If
   * `trackRecordSystem` is also set the map slide is auto-prepended.
   * Leave undefined to show the placeholder.
   */
  logs?: LogsConfig;
}

type View = 'main' | 'mechanism' | 'logs';

interface Props {
  config: OverlayExperienceConfig;
  onClose: () => void;
}

const HUD_AUTOHIDE_MS = 3200; // was 4000; -20% May 2026

export default function OverlayExperience({ config, onClose }: Props) {
  const [view, setView] = useState<View>('main');
  const { hudVisible, handleTap } = useAutoHideHud(
    view === 'main',
    HUD_AUTOHIDE_MS,
  );

  // Prefers the /videos/kiosk-hd/ master when present, else transcoded.
  const videoSrc = useKioskVideo(config.video);

  if (view === 'mechanism') {
    return (
      <FullScreenLayer>
        {config.mechanism ? (
          <MechanismScreen
            config={config.mechanism}
            onBack={() => setView('main')}
          />
        ) : (
          <ComingSoon
            eyebrow={`${config.laneLabel} · ${config.title}`}
            heading="Mechanism"
            onBack={() => setView('main')}
          />
        )}
      </FullScreenLayer>
    );
  }

  if (view === 'logs') {
    // Fold the OverlayExperience's trackRecordSystem + enableSuccessStories
    // into the LogsConfig so the case-studies pager prepends a map slide
    // automatically. If the caller's LogsConfig already declares
    // trackRecord, that wins and we leave the slides untouched.
    const logsWithTrackRecord: LogsConfig | null = (() => {
      if (!config.logs) return null;
      if (config.logs.trackRecord || !config.trackRecordSystem) {
        return config.logs;
      }
      return {
        ...config.logs,
        trackRecord: {
          system: config.trackRecordSystem,
          enableSuccessStories: config.enableSuccessStories ?? false,
        },
        slides: [{ type: 'map' as const }, ...config.logs.slides],
      };
    })();
    return (
      <FullScreenLayer>
        {logsWithTrackRecord ? (
          <LogsScreen
            config={logsWithTrackRecord}
            onBack={() => setView('main')}
          />
        ) : (
          <ComingSoon
            eyebrow={`${config.laneLabel} · ${config.title}`}
            heading="Case Studies"
            onBack={() => setView('main')}
          />
        )}
      </FullScreenLayer>
    );
  }

  // ── Main: featured video on loop + HUD overlay ───────────────────────────
  return (
    <FullScreenLayer>
      <div
        className="relative w-full h-full bg-black"
        onClick={handleTap}
        onTouchStart={handleTap}
        // Mouse-move reveals the HUD too — matches FocusCentralizers /
        // RockerExperience chrome. Without this, the HUD only revives on
        // tap/click; on desktop you'd have to click to surface it.
        onMouseMove={handleTap}
      >
        {/* Audio on — the user explicitly tapped an overlay button to reach
            this view, so the page has user activation and autoplay-with-sound
            is allowed. No native `controls` — the kiosk shouldn't surface
            browser-level video chrome. */}
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Subtle dark overlay so HUD copy stays readable over bright frames */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Top-right close — fades in/out with the HUD (CH parity).
            Always mounted; CSS opacity transition + pointer-events-none
            when hidden, so the looping video can shine on idle. */}
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

        {/* Top-left product label — same fade-with-HUD treatment. */}
        <div
          className={`absolute top-6 left-6 z-40 pointer-events-none transition-opacity duration-250 ${
            hudVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            {config.laneLabel}
          </p>
          <h2 className="text-3xl font-extrabold text-white drop-shadow">
            {config.title}
          </h2>
          {config.subtitle && (
            <p className="text-base text-white/70 mt-1">{config.subtitle}</p>
          )}
        </div>

        {/* HUD button strip — bumped bg-black/65 to compensate for the
            dropped backdrop-blur; readable over bright frames without the
            per-frame composite cost. */}
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
      </div>
    </FullScreenLayer>
  );
}

/** Shared full-screen wrapper so all views render at the same z-layer.
 *  Plain `fixed inset-0` div — no fade-in motion. Snap is fine here: the
 *  underlying lane attractor is paused before this mounts and the dramatic
 *  z-50 cover frames the experience on its own. */
function FullScreenLayer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {children}
    </div>
  );
}

/** Placeholder panel for sub-views that haven't been built out yet. */
function ComingSoon({
  eyebrow,
  heading,
  onBack,
}: {
  eyebrow: string;
  heading: string;
  onBack: () => void;
}) {
  return (
    <div className="w-full h-full bg-black/95 flex items-center justify-center">
      <div className="text-center text-white max-w-xl px-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-4">
          {eyebrow}
        </p>
        <h2 className="text-5xl font-extrabold mb-6">{heading}</h2>
        <p className="text-lg text-white/70 mb-10">
          Coming soon — this screen is a placeholder.
        </p>
        <button
          onClick={onBack}
          className="px-8 py-3 rounded-full bg-white text-black font-semibold tracking-wide"
        >
          Back
        </button>
      </div>
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
