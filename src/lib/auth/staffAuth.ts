import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { StaffSession } from '@/types/staffSession';

interface OAuthStatePayload {
  nonce: string;
  returnTo: string;
  redirectUri: string;
  createdAt: number;
}

interface CookieReader {
  get(_name: string): { value: string } | undefined;
}

const SESSION_COOKIE_NAME = 'petromac_staff_session';
const OAUTH_STATE_COOKIE_NAME = 'petromac_staff_oauth_state';
const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 12;
const OAUTH_STATE_TTL_SECONDS = 60 * 10;

function getSessionSecret() {
  const secret = process.env.STAFF_SESSION_SECRET || '';
  if (secret.length < 32) {
    throw new Error('STAFF_SESSION_SECRET must be set to at least 32 characters');
  }
  return secret;
}

function getEncryptionKey() {
  return createHash('sha256').update(getSessionSecret()).digest();
}

function encryptJson(payload: Record<string, unknown>): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

function decryptJson<T>(value: string): T | null {
  const parts = value.split('.');
  if (parts.length !== 3) return null;

  try {
    const [ivPart, tagPart, dataPart] = parts;
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(ivPart, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString('utf8')) as T;
  } catch {
    return null;
  }
}

function secureCookie() {
  return process.env.NODE_ENV === 'production';
}

export function isStaffAuthConfigured() {
  return Boolean(
    process.env.ENTRA_TENANT_ID &&
      process.env.ENTRA_CLIENT_ID &&
      process.env.ENTRA_CLIENT_SECRET &&
      process.env.STAFF_SESSION_SECRET
  );
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getOAuthStateCookieName() {
  return OAUTH_STATE_COOKIE_NAME;
}

export function normalizeReturnTo(value: string | null | undefined) {
  const fallback = '/intranet';
  if (!value) return fallback;

  const raw = value.trim();
  if (!raw) return fallback;
  if (raw.includes('\\')) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(raw, 'https://petromac.local');
  } catch {
    return fallback;
  }

  if (parsed.origin !== 'https://petromac.local') return fallback;

  const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  if (!(normalized === '/intranet' || normalized.startsWith('/intranet/'))) {
    return fallback;
  }

  return normalized;
}

export function createOAuthStateValue(returnTo: string, redirectUri: string) {
  const payload: OAuthStatePayload = {
    nonce: randomBytes(24).toString('base64url'),
    returnTo: normalizeReturnTo(returnTo),
    redirectUri,
    createdAt: Date.now(),
  };

  return {
    cookieValue: encryptJson(payload as unknown as Record<string, unknown>),
    state: payload.nonce,
  };
}

export function readOAuthStateCookie(value: string | undefined | null) {
  if (!value) return null;
  const payload = decryptJson<OAuthStatePayload>(value);
  if (!payload) return null;

  const ageMs = Date.now() - payload.createdAt;
  if (ageMs < 0 || ageMs > OAUTH_STATE_TTL_SECONDS * 1000) {
    return null;
  }

  return payload;
}

export function verifyOAuthState(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createStaffSessionCookieValue(session: StaffSession) {
  return encryptJson(session as unknown as Record<string, unknown>);
}

export function readStaffSessionCookie(value: string | undefined | null): StaffSession | null {
  if (!value) return null;
  const session = decryptJson<StaffSession>(value);
  if (!session) return null;
  if (!session.expiresAt || session.expiresAt <= Date.now()) return null;
  return session;
}

export function readStaffSession(cookies: CookieReader): StaffSession | null {
  try {
    return readStaffSessionCookie(cookies.get(SESSION_COOKIE_NAME)?.value);
  } catch {
    return null;
  }
}

export function buildSessionCookieOptions(maxAge = STAFF_SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secureCookie(),
    path: '/',
    maxAge,
  };
}

export function buildOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secureCookie(),
    path: '/',
    maxAge: OAUTH_STATE_TTL_SECONDS,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secureCookie(),
    path: '/',
    maxAge: 0,
  };
}

export function getStaffSessionTtlSeconds() {
  return STAFF_SESSION_TTL_SECONDS;
}
