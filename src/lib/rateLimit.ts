type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, RateLimitState>();

// Cap store size to prevent unbounded growth from unique keys (e.g. spoofed IPs).
const MAX_STORE_SIZE = 10_000;
// Cleanup runs at most once per this interval.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = 0;

function pruneExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, state] of memoryStore) {
    if (state.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export function rateLimit(key: string, options: RateLimitOptions) {
  pruneExpired();

  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    // Evict oldest entries if store is at capacity
    if (memoryStore.size >= MAX_STORE_SIZE) {
      const firstKey = memoryStore.keys().next().value;
      if (firstKey !== undefined) memoryStore.delete(firstKey);
    }

    const resetAt = now + options.windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  memoryStore.set(key, existing);
  return { allowed: true, remaining: options.limit - existing.count, resetAt: existing.resetAt };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return headers.get('x-real-ip') || 'unknown';
}
