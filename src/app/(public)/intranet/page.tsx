import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isStaffAuthConfigured, readStaffSession } from '@/lib/auth/staffAuth';
import IntranetClient from './IntranetClient';

const LOGIN_HREF = '/auth/microsoft/login?returnTo=/intranet';

/**
 * Server-gated: the session cookie is verified in the initial request, so a
 * signed-out visitor gets a single 307 straight into Microsoft sign-in —
 * no page shell, no hydration, no client-side session fetch first. Content
 * renders only when authenticated (or when staff auth isn't configured,
 * e.g. local dev without Entra env vars).
 */
// `authError` is one of the fixed codes the callback route emits (anything
// else is rendered as the generic line) — never echo the raw param.
function describeAuthError(code: string): string {
  switch (code) {
    case 'access_denied':
      return 'The sign-in was cancelled or your account is not allowed here.';
    case 'invalid_oauth_state':
      return 'The sign-in link expired. Please try again.';
    case 'missing_oauth_parameters':
    case 'invalid_request':
      return 'Microsoft did not return a valid sign-in response.';
    default:
      return 'Microsoft sign-in failed. Please try again, or contact IT if it keeps happening.';
  }
}

export default async function IntranetHome({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string }>;
}) {
  const { authError } = await searchParams;

  if (!isStaffAuthConfigured()) {
    return <IntranetClient user={null} />;
  }

  const session = readStaffSession(await cookies());

  if (!session) {
    // authError guard: a failed/cancelled sign-in shows a retry screen
    // instead of bouncing straight back to Microsoft in a loop.
    if (authError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center text-gray-900">
          <h1 className="text-2xl font-semibold">Microsoft sign-in failed</h1>
          <p className="text-sm text-slate-600">{describeAuthError(authError)}</p>
          <a
            href={LOGIN_HREF}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            Sign in with Microsoft
          </a>
        </div>
      );
    }
    redirect(LOGIN_HREF);
  }

  return <IntranetClient user={session.user} />;
}
