'use client';

/**
 * SectionPill — two-button persistent tab pill shared by MechanismScreen
 * and LogsScreen.
 *
 * Replaces the per-screen eyebrow + device-name title block in each sub-view
 * so visitors can hop directly between Mechanism and Case Studies without
 * bouncing back to the experience's main view. Mirrors the visual language
 * of the main-view HUD pill (same rounded chrome, same button geometry) so
 * the navigation feels like one continuous control rather than a new widget
 * once you've drilled in.
 *
 * Behaviour
 * - `active` is highlighted (solid white-on-black) and carries
 *   `aria-current="page"`; tapping it is a no-op state update that React
 *   short-circuits.
 * - The inactive button calls `onSwitch` with its own section id; the
 *   parent experience routes that through its `setView` so the swap is a
 *   single-tap hop in either direction.
 */
export type Section = 'mechanism' | 'logs';

interface Props {
  active: Section;
  onSwitch: (_section: Section) => void;
}

export default function SectionPill({ active, onSwitch }: Props) {
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
