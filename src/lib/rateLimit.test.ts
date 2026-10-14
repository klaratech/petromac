import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, resetRateLimits } from './rateLimit';

test('allows up to the limit, then blocks with a Retry-After', () => {
  resetRateLimits();
  for (let i = 0; i < 3; i++) assert.equal(checkRateLimit('k', 3, 60_000).allowed, true);
  const blocked = checkRateLimit('k', 3, 60_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);
});

test('keys are independent', () => {
  resetRateLimits();
  assert.equal(checkRateLimit('a', 1, 60_000).allowed, true);
  assert.equal(checkRateLimit('a', 1, 60_000).allowed, false);
  assert.equal(checkRateLimit('b', 1, 60_000).allowed, true);
});

test('window expiry opens the bucket again', () => {
  resetRateLimits();
  assert.equal(checkRateLimit('w', 1, 1).allowed, true);
  const until = Date.now() + 5;
  while (Date.now() < until) {
    /* spin past the 1 ms window */
  }
  assert.equal(checkRateLimit('w', 1, 1).allowed, true);
});
