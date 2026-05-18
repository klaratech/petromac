'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * AssetSlot — Image wrapper that hides a "drop file at /…" placeholder when
 * the image actually loads.
 *
 * The old pattern stuck a -z-10 placeholder behind the <Image>; with
 * `object-contain` the letterbox bled through and the placeholder showed
 * over loaded images. AssetSlot only renders the placeholder when the
 * image's `onError` fires — successful loads have nothing behind them.
 *
 * The component is intentionally render-prop-free: it ALWAYS fills its
 * parent (the parent decides aspect / sizing), so it slots into existing
 * layouts that were using `<Image fill />`.
 *
 * Theme:
 *   - 'dark'  → light text on transparent / dark backgrounds (kiosk shell)
 *   - 'light' → dark text + dashed border (white slide cards)
 */
export interface AssetSlotProps {
  src: string;
  alt: string;
  /** Standard <Image fill> sizes string for layout hints. */
  sizes?: string;
  /** Pass through to next/image. */
  priority?: boolean;
  /** className applied to the inner <Image>. Use for object-* + drop-shadow. */
  className?: string;
  /** Visual treatment for the missing-asset placeholder. */
  theme?: 'dark' | 'light';
  /** Override the label rendered inside the placeholder. Defaults to
   *  "Drop file at <code>{src}</code>". */
  placeholderLabel?: string;
}

export function AssetSlot({
  src,
  alt,
  sizes,
  priority,
  className,
  theme = 'dark',
  placeholderLabel,
}: AssetSlotProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return <Placeholder src={src} theme={theme} label={placeholderLabel} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      {...(priority ? { priority } : {})}
      {...(sizes ? { sizes } : {})}
      {...(className ? { className } : {})}
      onError={() => setErrored(true)}
    />
  );
}

function Placeholder({
  src,
  theme,
  label,
}: {
  src: string;
  theme: 'dark' | 'light';
  label?: string | undefined;
}) {
  const wrapper =
    theme === 'light'
      ? 'border border-dashed border-slate-300 text-slate-400 bg-white'
      : 'text-white/40';
  const codeClass = theme === 'light' ? 'text-slate-600' : 'text-white/60';

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center text-xs text-center px-4 rounded ${wrapper}`}
    >
      <div>
        {label ?? 'Drop file at'}
        {!label && (
          <>
            <br />
            <code className={codeClass}>{src}</code>
          </>
        )}
      </div>
    </div>
  );
}
