'use client';

/**
 * SectionPill — persistent navigation pill shared by the CH product screens
 * (HelixProductScreen, RockerProductScreen) and the Mechanism / Case Studies
 * sub-views. Also used by the OH OverlayExperience's M/CS screens.
 *
 * Visual language mirrors the main-view HUD pill so the chrome feels like
 * one continuous control as the visitor drills in.
 *
 * Buttons
 * - Mechanism / Case Studies — state-driven, exactly one of them carries
 *   the active treatment (solid white-on-black + `aria-current="page"`).
 *   When `active` is undefined (e.g. on a product screen sitting above
 *   both sub-views) neither pill is highlighted — both render in the
 *   inactive ghost style so the visitor sees the pair as equal-status
 *   options to drill into.
 * - Specifications — appears only when `onOpenSpecs` is provided. Never
 *   carries an active state; it opens a modal so there's no "you're here"
 *   semantics. Allows the same pill to expose the spec sheet from every
 *   screen that has `config.specs` set, replacing the old per-screen
 *   header button.
 */
export type Section = 'mechanism' | 'logs';

interface Props {
  /** Which section is currently shown. Undefined when the pill is mounted
   *  on a screen that isn't either of the sub-views (e.g. a product page). */
  active?: Section | undefined;
  onSwitch: (_section: Section) => void;
  /** When provided, renders a third "Specifications" pill button that
   *  triggers this callback. Typically `() => setSpecsOpen(true)` from the
   *  parent screen's local modal state. */
  onOpenSpecs?: (() => void) | undefined;
}

export default function SectionPill({
  active,
  onSwitch,
  onOpenSpecs,
}: Props) {
  return (
    <div className="flex gap-2 px-2 py-2 rounded-xl bg-black/65 border border-white/10 shadow-xl">
      <PillButton
        label="Mechanism"
        active={active === 'mechanism'}
        onClick={() => onSwitch('mechanism')}
      />
      <PillButton
        label="Case Studies"
        active={active === 'logs'}
        onClick={() => onSwitch('logs')}
      />
      {onOpenSpecs && (
        <PillButton label="Specifications" active={false} onClick={onOpenSpecs} />
      )}
    </div>
  );
}

function PillButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors ${
        active
          ? 'bg-white text-black shadow-inner'
          : 'bg-white/10 text-white/85 hover:bg-white/25 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
