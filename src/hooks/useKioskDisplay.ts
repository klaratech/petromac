'use client';

import { useEffect, useState } from 'react';

/**
 * Kiosk display flags read from the URL once at boot and persisted to
 * sessionStorage so they survive in-kiosk navigation.
 *
 * Flags
 *   ?tv=1   "TV safe-area mode" — scales the kiosk content slightly so TV
 *           overscan (Fire Stick, set-top boxes) can't crop chrome out of
 *           the picture. KioskShell applies the `.kiosk-tv-mode` class
 *           which scales children to 94% with bg-black filling the
 *           overscan gutter.
 *   ?sd=1   Skip the kiosk-hd 1080p upgrade — useKioskVideo stays on the
 *           720p `transcoded/` clips. Use on devices that stutter on
 *           1080p H.264 (Fire Stick is the canonical case).
 *
 * Visit `…/intranet/kiosk?tv=1&sd=1` once to set the flags; they stick
 * for the rest of the session even when the user navigates within the
 * kiosk and the query string drops.
 */

const STORAGE_PREFIX = 'kiosk-flag:';

function readOnce(key: string): boolean {
  if (typeof window === 'undefined') return false;
  const storageKey = STORAGE_PREFIX + key;
  try {
    const url = new URLSearchParams(window.location.search);
    if (url.get(key) === '1') {
      window.sessionStorage.setItem(storageKey, '1');
      return true;
    }
    if (url.get(key) === '0') {
      // Explicit opt-out clears the persisted flag, useful for swapping
      // a Fire Stick kiosk back to tablet mode without clearing storage.
      window.sessionStorage.removeItem(storageKey);
      return false;
    }
    return window.sessionStorage.getItem(storageKey) === '1';
  } catch {
    // SessionStorage can throw in private browsing or when disabled —
    // fall back to URL-only.
    const url = new URLSearchParams(window.location.search);
    return url.get(key) === '1';
  }
}

// Module-level cache so non-React callers (useKioskVideo's module cache,
// for example) can read the same flag without a re-mount.
let cachedTv: boolean | null = null;
let cachedSd: boolean | null = null;

export function getKioskDisplayMode(): { tvMode: boolean; sdMode: boolean } {
  if (cachedTv === null) cachedTv = readOnce('tv');
  if (cachedSd === null) cachedSd = readOnce('sd');
  return { tvMode: cachedTv, sdMode: cachedSd };
}

/**
 * React hook variant — returns the same values as `getKioskDisplayMode`,
 * but defers the initial read until after hydration so the server-rendered
 * markup matches the client (the flags are window-only). On the first
 * paint the values are `false`; the effect updates them right after.
 */
export function useKioskDisplay(): { tvMode: boolean; sdMode: boolean } {
  const [mode, setMode] = useState<{ tvMode: boolean; sdMode: boolean }>(
    { tvMode: false, sdMode: false },
  );

  useEffect(() => {
    setMode(getKioskDisplayMode());
  }, []);

  return mode;
}
