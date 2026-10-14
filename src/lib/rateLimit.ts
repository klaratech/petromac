/**
 * Minimal fixed-window rate limiter for Next.js route handlers.
 *
 * In-memory and per-process on purpose: the frontend runs as ONE container
 * per environment, so a module-level Map is the whole picture, and the only
 * caller today (`/api/staff/send-pdf`) needs "a handful per minute", not
 * precision. Mirrors `check_rate_limit` in backend/app/main.py — same
 * shape, same prune-on-growth guard — so the two sides reason alike.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const PRUNE_THRESHOLD = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets — for a Retry-After header. */
  retryAfter: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > PRUNE_THRESHOLD) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfter: 0 };
}

/** Test hook. */
export function resetRateLimits(): void {
  buckets.clear();
}
