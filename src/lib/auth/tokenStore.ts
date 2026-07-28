/**
 * In-memory store for delegated Microsoft refresh tokens, keyed by the
 * random `tokenRef` carried in the (encrypted, httpOnly) staff session
 * cookie. The refresh token itself is far too large for the ~4 KB cookie
 * (the access token alone already flirts with the limit), and the frontend
 * container has no persistent volume — so process memory is the store.
 *
 * Consequences of that choice, by design:
 * - While the server runs, send-as-staff works for the whole 12 h session
 *   (access tokens are refreshed on demand).
 * - After a deploy/restart the store is empty: sends fall back to info@
 *   until the next sign-in. The UI shows the actual sender, so this is
 *   visible, never silent.
 *
 * `globalThis` stash so dev HMR / route-module duplication share one map.
 */

interface StoredToken {
  refreshToken: string;
  expiresAt: number;
}

const globalStash = globalThis as typeof globalThis & {
  __staffTokenStore?: Map<string, StoredToken>;
};

const store: Map<string, StoredToken> = (globalStash.__staffTokenStore ??= new Map());

function prune() {
  const now = Date.now();
  for (const [key, value] of store) {
    if (value.expiresAt <= now) store.delete(key);
  }
}

export function putRefreshToken(ref: string, refreshToken: string, ttlMs: number) {
  prune();
  store.set(ref, { refreshToken, expiresAt: Date.now() + ttlMs });
}

export function getRefreshToken(ref: string | undefined | null): string | null {
  if (!ref) return null;
  const entry = store.get(ref);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(ref);
    return null;
  }
  return entry.refreshToken;
}

export function hasRefreshToken(ref: string | undefined | null): boolean {
  return getRefreshToken(ref) !== null;
}

export function dropRefreshToken(ref: string | undefined | null) {
  if (ref) store.delete(ref);
}
