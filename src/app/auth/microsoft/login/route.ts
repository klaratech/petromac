import { NextRequest, NextResponse } from 'next/server';
import {
  buildOAuthStateCookieOptions,
  createOAuthStateValue,
  getOAuthStateCookieName,
  isStaffAuthConfigured,
  normalizeReturnTo,
} from '@/lib/auth/staffAuth';
import { buildMicrosoftAuthorizeUrl } from '@/lib/auth/entra';
import { getRequestOrigin } from '@/lib/auth/requestOrigin';

export async function GET(request: NextRequest) {
  if (!isStaffAuthConfigured()) {
    return NextResponse.json({ error: 'Microsoft staff auth is not configured' }, { status: 503 });
  }

  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  // Allowlisted passthrough: kiosk links force the account picker (shared
  // devices); everything else defaults to silent SSO when possible.
  const requestedPrompt = request.nextUrl.searchParams.get('prompt');
  const prompt = requestedPrompt === 'select_account' ? requestedPrompt : undefined;
  const redirectUri = new URL('/auth/microsoft/callback', getRequestOrigin(request)).toString();
  const { cookieValue, state } = createOAuthStateValue(returnTo, redirectUri);
  const response = NextResponse.redirect(buildMicrosoftAuthorizeUrl(redirectUri, state, prompt));

  response.cookies.set(getOAuthStateCookieName(), cookieValue, buildOAuthStateCookieOptions());
  return response;
}
