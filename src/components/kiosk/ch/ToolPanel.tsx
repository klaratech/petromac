'use client';

import { AssetSlot } from '@/components/kiosk/AssetSlot';

/**
 * ToolPanel — one of the side-by-side tool renders shown on the CH product
 * screens (HelixProductScreen with 3 CX variants, RockerProductScreen with
 * Rocker + Rocker Inline).
 *
 * Centred image with a subtle drop shadow and a small uppercase label
 * pill underneath. Falls back to AssetSlot's "drop file" placeholder if the
 * asset is missing so the kiosk stays usable while content is in progress.
 *
 * Lifted out of the original RockerExperience.tsx in May 2026 when the CH
 * lane was reorganised — both product screens now share the same panel
 * visuals (and same alpha-friendly transparent-PNG rendering against the
 * dark canvas).
 */
interface Props {
  src: string;
  alt: string;
  label: string;
  /** Optional second-line subtitle shown beneath the label pill — used on
   *  the Helix CX panels to surface each variant's casing range. */
  sublabel?: string;
  sizes?: string;
}

export default function ToolPanel({ src, alt, label, sublabel, sizes }: Props) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-full flex-1 min-h-0">
        <AssetSlot
          src={src}
          alt={alt}
          priority
          sizes={sizes ?? '(min-width: 768px) 30vw, 90vw'}
          className="object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.35)]"
        />
      </div>
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white/85 text-xs uppercase tracking-[0.3em]">
          {label}
        </div>
        {sublabel && (
          <p className="text-white/60 text-xs tracking-wide">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
