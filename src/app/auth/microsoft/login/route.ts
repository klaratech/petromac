import { NextRequest, NextResponse } from 'next/server';
import {
  buildOAuthStateCookieOptions,
  createOAuthStateValue,
  getOAuthStateCookieName,
  isStaffAuthConfigured,
  normalizeReturnTo,
} from '@/lib/auth/staffAuth';
import { buildMicrosoftAuthorizeUrl } from '@/lib/auth/entra';

export async function GET(request: NextRequest) {
  if (!isStaffAuthConfigured()) {
    return NextResponse.json({ error: 'Microsoft staff auth is not configured' }, { status: 503 });
  }

  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const redirectUri = new URL('/auth/microsoft/callback', request.nextUrl.origin).toString();
  const { cookieValue, state } = createOAuthStateValue(returnTo, redirectUri);
  const response = NextResponse.redirect(buildMicrosoftAuthorizeUrl(redirectUri, state));

  response.cookies.set(getOAuthStateCookieName(), cookieValue, buildOAuthStateCookieOptions());
  return response;
}
