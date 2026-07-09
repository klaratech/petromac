import { NextRequest, NextResponse } from 'next/server';
import { getRequestOrigin } from '@/lib/auth/requestOrigin';
import {
  buildSessionCookieOptions,
  clearCookieOptions,
  createStaffSessionCookieValue,
  getOAuthStateCookieName,
  getSessionCookieName,
  getStaffSessionTtlSeconds,
  isStaffAuthConfigured,
  normalizeReturnTo,
  readOAuthStateCookie,
  verifyOAuthState,
} from '@/lib/auth/staffAuth';
import { exchangeMicrosoftCode, fetchMicrosoftUser } from '@/lib/auth/entra';

function errorRedirect(request: NextRequest, message: string) {
  const redirectUrl = new URL('/intranet', getRequestOrigin(request));
  redirectUrl.searchParams.set('authError', message);
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
    const session = {
      user,
      issuedAt: now,
      expiresAt: now + getStaffSessionTtlSeconds() * 1000,
    };

    const safeReturnTo = normalizeReturnTo(statePayload.returnTo);
    const response = NextResponse.redirect(new URL(safeReturnTo, getRequestOrigin(request)));
    response.cookies.set(
      getSessionCookieName(),
      createStaffSessionCookieValue(session),
      buildSessionCookieOptions()
    );
    response.cookies.set(getOAuthStateCookieName(), '', clearCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'microsoft_auth_failed';
    return errorRedirect(request, message);
  }
}
