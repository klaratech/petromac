import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isStaffAuthConfigured, readStaffSession } from '@/lib/auth/staffAuth';

export async function GET() {
  const cookieStore = await cookies();
  const session = readStaffSession(cookieStore);

  return NextResponse.json({
    enabled: isStaffAuthConfigured(),
    authenticated: Boolean(session),
    user: session?.user ?? null,
  });
}
