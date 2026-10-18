'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * "Copy link" for a video's own page — writes the ABSOLUTE /watch URL to the
 * clipboard so it can be pasted straight into a slide deck, a PDF or an email.
 * Falls back to showing the URL (selectable) where the Clipboard API is
 * unavailable (non-secure contexts, some embedded browsers).
 */
export default function CopyLinkButton({
  path,
  className = '',
}: {
  /** Site-relative path, e.g. "/watch/high-deviations". */
  path: string;
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copy = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      setState('failed');
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2500);
  };

  if (state === 'failed') {
    return (
      <span className={className} role="status">
        Link: <code className="select-all">{`petromac.co.nz${path}`}</code>
      </span>
    );
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {state === 'copied' ? 'Link copied ✓' : 'Copy link'}
    </button>
  );
}
