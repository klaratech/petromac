'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStaffSession } from '@/hooks/useStaffSession';

export default function StaffIdentityCard() {
  const searchParams = useSearchParams();
  const authError = searchParams.get('authError');
  const { enabled, authenticated, user, isLoading } = useStaffSession();

  const loginHref = useMemo(() => '/auth/microsoft/login?returnTo=/intranet', []);
  const logoutHref = useMemo(() => '/auth/microsoft/logout?returnTo=/intranet', []);

  return (
    <section className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Staff Identity</p>
          {isLoading ? (
            <p className="text-sm text-slate-600">Checking Microsoft staff session…</p>
          ) : authenticated && user ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
              <p className="text-sm text-slate-600">
                Signed in as <span className="font-medium text-slate-800">{user.email}</span>. This identity will carry into kiosk mode for staff-assisted workflows.
              </p>
            </>
          ) : enabled ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900">Microsoft sign-in not active</h2>
              <p className="text-sm text-slate-600">
                Sign in with your Petromac Microsoft 365 account before entering kiosk mode if you want future sends to be linked to your own mailbox.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900">Microsoft sign-in not configured yet</h2>
              <p className="text-sm text-slate-600">
                Add the Entra app credentials in the environment before enabling staff identity in intranet and kiosk.
              </p>
            </>
          )}

          {authError ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Microsoft sign-in failed: {authError}
            </p>
          ) : null}
        </div>

        <div className="flex gap-3">
          {enabled && !authenticated ? (
            <a
              href={loginHref}
              className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brandblack"
            >
              Sign in with Microsoft
            </a>
          ) : null}
          {enabled && authenticated ? (
            <a
              href={logoutHref}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Sign out
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
