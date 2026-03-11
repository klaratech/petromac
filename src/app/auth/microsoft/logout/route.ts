import { NextRequest, NextResponse } from 'next/server';
import { clearCookieOptions, getSessionCookieName, normalizeReturnTo } from '@/lib/auth/staffAuth';

export async function GET(request: NextRequest) {
  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const response = NextResponse.redirect(new URL(returnTo, request.nextUrl.origin));
  response.cookies.set(getSessionCookieName(), '', clearCookieOptions());
  return response;
}
