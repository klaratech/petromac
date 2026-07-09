import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStaffGraphToken, isStaffAuthConfigured, readStaffSession } from '@/lib/auth/staffAuth';

export async function GET() {
  const cookieStore = await cookies();
  const session = readStaffSession(cookieStore);

  return NextResponse.json({
    enabled: isStaffAuthConfigured(),
    authenticated: Boolean(session),
    user: session?.user ?? null,
    // Whether the kiosk can send email AS this staff member right now (the
    // delegated Graph token is still valid). Never expose the token itself.
    canSendAsStaff: getStaffGraphToken(session) !== null,
  });
}
