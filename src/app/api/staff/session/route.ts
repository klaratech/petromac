import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStaffGraphToken, isStaffAuthConfigured, readStaffSession } from '@/lib/auth/staffAuth';
import { hasRefreshToken } from '@/lib/auth/tokenStore';

export async function GET() {
  const cookieStore = await cookies();
  const session = readStaffSession(cookieStore);

  return NextResponse.json({
    enabled: isStaffAuthConfigured(),
    authenticated: Boolean(session),
    user: session?.user ?? null,
    // Whether email can be sent AS this staff member right now: either the
    // delegated Graph token is still valid, or the server holds a refresh
    // token that can mint one on demand. Never exposes the tokens.
    canSendAsStaff: getStaffGraphToken(session) !== null || hasRefreshToken(session?.tokenRef),
  });
}
