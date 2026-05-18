'use client';

import { useEffect, useState } from 'react';
import { getKioskDisplayMode } from './useKioskDisplay';

/**
 * Kiosk video source resolver.
 *
 * The kiosk ships with web-optimised clips in `/videos/transcoded/` (committed,
 * always present — the safe default). When higher-quality 1080p masters are
 * deployed alongside them in `/videos/kiosk-hd/`, the kiosk automatically
 * prefers those — they look sharper on the 60" trade-show screen.
 *
 * Resolution is per-file: a clip with no HD counterpart silently keeps
 * using its transcoded version.
 *
 * SD-only mode: when the kiosk URL carries `?sd=1` (see useKioskDisplay)
 * the HD probe is skipped entirely and every clip stays on its 720p
 * transcoded path. Use this on Fire Stick / weaker devices that stutter
 * on 1080p H.264 (or when mirroring from a tablet that's CPU-bound on
 * the encode side).
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
 * counterpart when available. Resolution is sticky for the lifetime of a
 * `transcodedPaths` value: the hook returns either HD (cache already warm) or
 * transcoded on first render, and never swaps the URL mid-playback.
 *
 * Why: when the resolved value changes, consumers re-render with a new key on
 * the `<video>` element, which remounts the player and restarts the clip. The
 * old strategy (probe → setResolved) caused a visible restart the moment the
 * HD HEAD request returned. Instead we now warm the module-level cache in the
 * background — the NEXT key change (e.g. the playlist advancing to the next
 * clip) picks HD synchronously via `initialResolve`.
 *
 * Trade-off: the very first kiosk load after a hard refresh plays the first
 * clip in transcoded SD. Every subsequent clip / experience open uses HD.
 */
export function useKioskVideos(transcodedPaths: string[]): string[] {
  const key = transcodedPaths.join('|');
  const [resolved] = useState<string[]>(() => {
    // ?sd=1 — never upgrade to kiosk-hd; stay on the 720p transcoded clips.
    // The flag is module-level cached so it's a synchronous read here.
    const { sdMode } = getKioskDisplayMode();
    if (sdMode) return [...transcodedPaths];
    return transcodedPaths.map(initialResolve);
  });

  useEffect(() => {
    // Skip the HD probe entirely in SD mode — there's no point warming
    // the cache when initialResolve will never look at it on the next
    // key change. Saves a HEAD request per clip on the weaker device
    // that explicitly opted out of HD.
    const { sdMode } = getKioskDisplayMode();
    if (sdMode) return;

    // Probe HD candidates to warm the module cache. We do NOT setState here
    // on purpose — that would remount the video element mid-playback.
    transcodedPaths.forEach((p) => {
      probeHd(hdCandidate(p)).catch(() => {});
    });
    // `key` captures the contents of `transcodedPaths`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return resolved;
}

/** Single-video convenience wrapper around {@link useKioskVideos}. */
export function useKioskVideo(transcodedPath: string): string {
  return useKioskVideos([transcodedPath])[0];
}
