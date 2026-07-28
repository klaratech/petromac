import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getRefreshTokenCookieName,
  getStaffGraphToken,
  isStaffAuthConfigured,
  readRefreshTokenCookie,
  readStaffSession,
} from '@/lib/auth/staffAuth';

export async function GET() {
  const cookieStore = await cookies();
  const session = readStaffSession(cookieStore);
  const refreshToken = session
    ? readRefreshTokenCookie(cookieStore.get(getRefreshTokenCookieName())?.value)
    : null;

  return NextResponse.json({
    enabled: isStaffAuthConfigured(),
    authenticated: Boolean(session),
    user: session?.user ?? null,
    // Whether email can be sent AS this staff member right now: either the
    // delegated Graph token is still valid, or the refresh-token cookie can
    // mint one on demand. Never exposes the tokens.
    canSendAsStaff: getStaffGraphToken(session) !== null || refreshToken !== null,
  });
}
