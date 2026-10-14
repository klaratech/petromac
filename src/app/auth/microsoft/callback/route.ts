import { NextRequest, NextResponse } from 'next/server';
import { getRequestOrigin } from '@/lib/auth/requestOrigin';
import {
  buildSessionCookieOptions,
  clearCookieOptions,
  createRefreshTokenCookieValue,
  createStaffSessionCookieValue,
  getOAuthStateCookieName,
  getRefreshTokenCookieName,
  getSessionCookieName,
  getStaffSessionTtlSeconds,
  isStaffAuthConfigured,
  normalizeReturnTo,
  readOAuthStateCookie,
  verifyOAuthState,
} from '@/lib/auth/staffAuth';
import { exchangeMicrosoftCode, fetchMicrosoftUser } from '@/lib/auth/entra';

/**
 * Only a fixed vocabulary reaches the URL. `/intranet` renders `authError`
 * as text, so forwarding Microsoft's raw error body (tenant ids, correlation
 * ids, free text) both leaked details and let anyone craft a link that
 * prints arbitrary text on a Petromac page. The full error still goes to
 * the server log.
 */
const AUTH_ERROR_CODES = new Set([
  'access_denied',
  'invalid_request',
  'invalid_oauth_state',
  'missing_oauth_parameters',
  'token_exchange_failed',
  'profile_fetch_failed',
  'microsoft_auth_failed',
]);

function errorRedirect(request: NextRequest, code: string, detail?: unknown) {
  // eslint-disable-next-line no-console -- server log is the only place the real error goes
  if (detail !== undefined) console.error(`[auth/microsoft] ${code}:`, detail);
  const redirectUrl = new URL('/intranet', getRequestOrigin(request));
  redirectUrl.searchParams.set(
    'authError',
    AUTH_ERROR_CODES.has(code) ? code : 'microsoft_auth_failed'
  );
  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  if (!isStaffAuthConfigured()) {
    return NextResponse.json({ error: 'Microsoft staff auth is not configured' }, { status: 503 });
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const oauthError = request.nextUrl.searchParams.get('error');

  if (oauthError) {
    return errorRedirect(request, oauthError);
  }

  if (!code || !state) {
    return errorRedirect(request, 'missing_oauth_parameters');
  }

  const statePayload = readOAuthStateCookie(request.cookies.get(getOAuthStateCookieName())?.value);
  if (!statePayload || !verifyOAuthState(statePayload.nonce, state)) {
    return errorRedirect(request, 'invalid_oauth_state');
  }

  try {
    const tokens = await exchangeMicrosoftCode(code, statePayload.redirectUri);
    const user = await fetchMicrosoftUser(tokens.access_token);

    const now = Date.now();
    const sessionTtlMs = getStaffSessionTtlSeconds() * 1000;

    const session = {
      user,
      issuedAt: now,
      expiresAt: now + sessionTtlMs,
      // Delegated Graph token for send-as-staff (~1 h; refreshed on demand
      // from the refresh-token cookie when it lapses).
      graph: {
        accessToken: tokens.access_token,
        expiresAt: now + (tokens.expires_in ?? 3600) * 1000,
      },
    };

    // Cookie-size guard: the Graph token can push the encrypted cookie past
    // the browser's ~4 KB limit, and an oversized Set-Cookie is silently
    // dropped — which would break the whole session. If it's too big, drop
    // the token (staff-send falls back to info@) but keep the session.
    let cookieValue = createStaffSessionCookieValue(session);
    if (cookieValue.length > 3800) {
      const { graph: _dropped, ...sessionWithoutToken } = session;
      void _dropped;
      cookieValue = createStaffSessionCookieValue(sessionWithoutToken);
    }

    const safeReturnTo = normalizeReturnTo(statePayload.returnTo);
    const response = NextResponse.redirect(new URL(safeReturnTo, getRequestOrigin(request)));
    response.cookies.set(getSessionCookieName(), cookieValue, buildSessionCookieOptions());
    // The refresh token rides in its own encrypted cookie so send-as-staff
    // keeps working across server restarts/deploys for the whole 12 h
    // session. Same size guard as the session cookie.
    if (tokens.refresh_token) {
      const refreshCookieValue = createRefreshTokenCookieValue(
        tokens.refresh_token,
        now + sessionTtlMs
      );
      if (refreshCookieValue.length <= 3800) {
        response.cookies.set(
          getRefreshTokenCookieName(),
          refreshCookieValue,
          buildSessionCookieOptions()
        );
      }
    }
    response.cookies.set(getOAuthStateCookieName(), '', clearCookieOptions());
    return response;
  } catch (error) {
    return errorRedirect(request, 'microsoft_auth_failed', error);
  }
}
