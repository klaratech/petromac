'use client';

import { useEffect, useState } from 'react';

/**
 * Kiosk video source resolver.
 *
 * The kiosk ships with web-optimised clips in `/videos/transcoded/` (committed,
 * always present — the safe default). When higher-quality 1080p masters are
 * deployed alongside them in `/videos/kiosk-hd/`, the kiosk automatically
 * prefers those — they look sharper on the 60" trade-show screen.
 *
 * Resolution is per-file: a clip with no HD counterpart (e.g. `dice.mp4`)
 * silently keeps using its transcoded version.
 *
 * See docs/ADMIN.md ("Kiosk HD videos") for how the kiosk-hd folder is managed.
 */

const HD_DIR = '/videos/kiosk-hd/';

/** Strip any query string and directory, returning just the file name. */
function fileName(path: string): string {
  return path.split('/').pop()?.split('?')[0] ?? '';
}

/** The HD candidate URL for a given transcoded path. */
function hdCandidate(transcodedPath: string): string {
  return HD_DIR + fileName(transcodedPath);
}

/**
 * Module-level cache of probe results, keyed by HD url. Shared across every
 * hook instance so the lane-loop screen's probes warm the cache for the
 * experiences opened from it.
 */
const probeCache = new Map<string, boolean>();

/**
 * Is the HD clip available? Checks the offline cache first (so a primed kiosk
 * keeps using HD with no network), then falls back to a lightweight network
 * HEAD request (so a kiosk being primed online discovers HD and lets the
 * service worker cache it).
 */
async function probeHd(hdUrl: string): Promise<boolean> {
  const cached = probeCache.get(hdUrl);
  if (cached !== undefined) return cached;

  let available = false;
  try {
    // 1. Already in a kiosk cache? Works fully offline.
    if (typeof caches !== 'undefined') {
      const match = await caches.match(hdUrl);
      if (match) available = true;
    }
    // 2. Reachable on the network? Covers the online priming run.
    if (!available) {
      const res = await fetch(hdUrl, { method: 'HEAD' });
      available = res.ok;
    }
  } catch {
    available = false;
  }

  probeCache.set(hdUrl, available);
  return available;
}

/** Synchronous best-guess used for initial state (HD only if already probed). */
function initialResolve(transcodedPath: string): string {
  const hd = hdCandidate(transcodedPath);
  return probeCache.get(hd) === true ? hd : transcodedPath;
}

/**
 * Resolves a list of transcoded kiosk video paths, upgrading each to its HD
 * counterpart when available. Returns transcoded paths immediately, then
 * upgrades once probing completes.
 */
export function useKioskVideos(transcodedPaths: string[]): string[] {
  const key = transcodedPaths.join('|');
  const [resolved, setResolved] = useState<string[]>(() =>
    transcodedPaths.map(initialResolve),
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      transcodedPaths.map(async (p) => {
        const hd = hdCandidate(p);
        return (await probeHd(hd)) ? hd : p;
      }),
    ).then((next) => {
      if (!cancelled) setResolved(next);
    });
    return () => {
      cancelled = true;
    };
    // `key` captures the contents of `transcodedPaths`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return resolved;
}

/** Single-video convenience wrapper around {@link useKioskVideos}. */
export function useKioskVideo(transcodedPath: string): string {
  return useKioskVideos([transcodedPath])[0];
}
