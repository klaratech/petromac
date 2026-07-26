'use client';

import { useEffect, useRef, useState } from 'react';

type LazyVideoProps = {
  src: string;
  poster?: string | undefined;
  className?: string | undefined;
};

/**
 * A muted, looping, autoplaying video that only downloads once it scrolls
 * near the viewport. The poster shows immediately; the video source is
 * attached (and playback started) via IntersectionObserver.
 *
 * Why: an `autoPlay` <video> downloads its full file on mount regardless of
 * `preload="metadata"`. The homepage has several of these below the fold and
 * reuses the same clips across sections, so eager autoplay pulled ~60 MB up
 * front (with duplicate downloads). Deferring to scroll cuts the initial load
 * to just the above-the-fold hero, and lets the HTTP cache dedupe the shared
 * clips (by the time a later section scrolls in, its clip is already cached).
 */
export default function LazyVideo({ src, poster, className }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Decorative autoplay backgrounds: reduced-motion users keep the static
    // poster — the source is never attached, so nothing downloads either.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Attach the source and start playback once visible. Setting src + load() +
  // play() explicitly is more reliable than relying on `autoPlay` firing
  // after a late src change.
  useEffect(() => {
    const el = ref.current;
    if (!el || !visible || el.getAttribute('src') === src) return;
    el.src = src;
    el.load();
    el.play().catch(() => {
      /* autoplay may be blocked; the poster stays visible */
    });
  }, [visible, src]);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  );
}
