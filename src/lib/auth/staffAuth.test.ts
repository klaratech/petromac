import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import {
  buildOAuthStateCookieOptions,
  buildSessionCookieOptions,
  createOAuthStateValue,
  createStaffSessionCookieValue,
  getStaffGraphToken,
  isStaffAuthConfigured,
  normalizeReturnTo,
  readOAuthStateCookie,
  readStaffSessionCookie,
  verifyOAuthState,
} from './staffAuth';
import type { StaffSession } from '@/types/staffSession';

const SECRET = 'unit-test-session-secret-0123456789abcdef';

beforeEach(() => {
  process.env.STAFF_SESSION_SECRET = SECRET;
});

function makeSession(overrides: Partial<StaffSession> = {}): StaffSession {
  return {
    email: 'staff@petromac.co.nz',
    name: 'Test Staff',
    expiresAt: Date.now() + 60 * 60 * 1000,
    ...overrides,
  } as StaffSession;
}

/** Run fn with Date.now shifted by ms (restores afterwards). */
function withClockOffset<T>(ms: number, fn: () => T): T {
  const realNow = Date.now;
  Date.now = () => realNow() + ms;
  try {
    return fn();
  } finally {
    Date.now = realNow;
  }
}

// ── returnTo normalization (open-redirect guard) ────────────────────────

test('normalizeReturnTo accepts safe intranet paths', () => {
  assert.equal(normalizeReturnTo('/intranet'), '/intranet');
  assert.equal(normalizeReturnTo('/intranet/kiosk/dashboard'), '/intranet/kiosk/dashboard');
  assert.equal(
    normalizeReturnTo('/intranet/kiosk?tab=overview#top'),
    '/intranet/kiosk?tab=overview#top'
  );
});

test('normalizeReturnTo rejects unsafe values', () => {
  assert.equal(normalizeReturnTo('//evil.com'), '/intranet');
  assert.equal(normalizeReturnTo('https://evil.com/path'), '/intranet');
  assert.equal(normalizeReturnTo('/intranet\\kiosk'), '/intranet');
  assert.equal(normalizeReturnTo('\\\\evil.com'), '/intranet');
  assert.equal(normalizeReturnTo('not-a-path'), '/intranet');
});

test('normalizeReturnTo falls back for invalid or non-intranet paths', () => {
  // '/' is deliberately allowed — sign-out returns to the homepage.
  assert.equal(normalizeReturnTo('/'), '/');
  assert.equal(normalizeReturnTo('/catalog'), '/intranet');
  assert.equal(normalizeReturnTo(null), '/intranet');
  assert.equal(normalizeReturnTo(undefined), '/intranet');
  assert.equal(normalizeReturnTo(''), '/intranet');
});

// ── staff session cookie: encrypt/decrypt round-trip ────────────────────

test('session cookie round-trips while unexpired', () => {
  const session = makeSession();
  const cookie = createStaffSessionCookieValue(session);
  assert.notEqual(cookie, '');
  assert.ok(!cookie.includes('petromac.co.nz'), 'cookie must not leak plaintext');
  const read = readStaffSessionCookie(cookie);
  assert.deepEqual(read, session);
});

test('expired session reads as null', () => {
  const cookie = createStaffSessionCookieValue(makeSession({ expiresAt: Date.now() - 1000 }));
  assert.equal(readStaffSessionCookie(cookie), null);
});

test('tampered cookie reads as null (AES-GCM auth tag)', () => {
  const cookie = createStaffSessionCookieValue(makeSession());
  const [iv, tag, data] = cookie.split('.');
  const flipped = data.slice(0, -2) + (data.endsWith('AA') ? 'BB' : 'AA');
  assert.equal(readStaffSessionCookie(`${iv}.${tag}.${flipped}`), null);
});

test('cookie encrypted under a different secret reads as null', () => {
  const cookie = createStaffSessionCookieValue(makeSession());
  process.env.STAFF_SESSION_SECRET = 'a-completely-different-secret-0123456789';
  assert.equal(readStaffSessionCookie(cookie), null);
});

test('garbage cookie values read as null', () => {
  assert.equal(readStaffSessionCookie(''), null);
  assert.equal(readStaffSessionCookie(null), null);
  assert.equal(readStaffSessionCookie('not.a.cookie'), null);
  assert.equal(readStaffSessionCookie('one-part-only'), null);
});

test('creating a cookie without a proper secret throws', () => {
  process.env.STAFF_SESSION_SECRET = 'short';
  assert.throws(() => createStaffSessionCookieValue(makeSession()));
});

// ── OAuth state cookie ──────────────────────────────────────────────────

test('oauth state round-trips: nonce matches, returnTo normalized', () => {
  const { cookieValue, state } = createOAuthStateValue(
    'https://evil.com/steal',
    'https://www.petromac.co.nz/auth/microsoft/callback'
  );
  const payload = readOAuthStateCookie(cookieValue);
  assert.ok(payload);
  assert.equal(payload.nonce, state);
  assert.equal(payload.returnTo, '/intranet'); // unsafe value normalized away
  assert.equal(payload.redirectUri, 'https://www.petromac.co.nz/auth/microsoft/callback');
});

test('oauth state expires after its TTL (10 min)', () => {
  const { cookieValue } = createOAuthStateValue('/intranet', 'https://x/cb');
  assert.ok(readOAuthStateCookie(cookieValue));
  withClockOffset(11 * 60 * 1000, () => {
    assert.equal(readOAuthStateCookie(cookieValue), null);
  });
});

test('oauth state from the future is rejected', () => {
  const { cookieValue } = createOAuthStateValue('/intranet', 'https://x/cb');
  withClockOffset(-60 * 1000, () => {
    assert.equal(readOAuthStateCookie(cookieValue), null);
  });
});

test('verifyOAuthState compares exactly', () => {
  assert.equal(verifyOAuthState('abc123', 'abc123'), true);
  assert.equal(verifyOAuthState('abc123', 'abc124'), false);
  assert.equal(verifyOAuthState('abc123', 'abc1234'), false);
  assert.equal(verifyOAuthState('', ''), true);
});

// ── Graph token skew guard ──────────────────────────────────────────────

test('getStaffGraphToken returns token only while comfortably valid', () => {
  const valid = makeSession({
    graph: { accessToken: 'tok', expiresAt: Date.now() + 10 * 60 * 1000 },
  } as Partial<StaffSession>);
  assert.equal(getStaffGraphToken(valid), 'tok');

  // Inside the 60 s skew window — treated as expired.
  const expiring = makeSession({
    graph: { accessToken: 'tok', expiresAt: Date.now() + 30 * 1000 },
  } as Partial<StaffSession>);
  assert.equal(getStaffGraphToken(expiring), null);

  assert.equal(getStaffGraphToken(null), null);
  assert.equal(getStaffGraphToken(makeSession()), null);
});

// ── configuration detection ─────────────────────────────────────────────

test('isStaffAuthConfigured requires all four env vars', () => {
  const saved = { ...process.env };
  try {
    process.env.ENTRA_TENANT_ID = 't';
    process.env.ENTRA_CLIENT_ID = 'c';
    process.env.ENTRA_CLIENT_SECRET = 's';
    process.env.STAFF_SESSION_SECRET = SECRET;
    assert.equal(isStaffAuthConfigured(), true);
    delete process.env.ENTRA_CLIENT_SECRET;
    assert.equal(isStaffAuthConfigured(), false);
  } finally {
    process.env.ENTRA_TENANT_ID = saved.ENTRA_TENANT_ID;
    process.env.ENTRA_CLIENT_ID = saved.ENTRA_CLIENT_ID;
    process.env.ENTRA_CLIENT_SECRET = saved.ENTRA_CLIENT_SECRET;
    process.env.STAFF_SESSION_SECRET = saved.STAFF_SESSION_SECRET;
  }
});

// ── cookie attributes ───────────────────────────────────────────────────

test('cookies are httpOnly + lax with sane lifetimes', () => {
  const session = buildSessionCookieOptions();
  assert.equal(session.httpOnly, true);
  assert.equal(session.sameSite, 'lax');
  assert.equal(session.maxAge, 12 * 60 * 60);
  const oauth = buildOAuthStateCookieOptions();
  assert.equal(oauth.httpOnly, true);
  assert.equal(oauth.maxAge, 10 * 60);
});
