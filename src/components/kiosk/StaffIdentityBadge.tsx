'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useStaffSession } from '@/hooks/useStaffSession';

export default function StaffIdentityBadge() {
  const pathname = usePathname();
  const { enabled, authenticated, user, isLoading } = useStaffSession();

  const loginHref = useMemo(() => `/auth/microsoft/login?returnTo=${encodeURIComponent(pathname || '/intranet/kiosk')}`, [pathname]);
  const logoutHref = useMemo(() => `/auth/microsoft/logout?returnTo=${encodeURIComponent(pathname || '/intranet/kiosk')}`, [pathname]);

  if (isLoading || !enabled) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-[60] max-w-sm rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-white shadow-lg backdrop-blur">
      {authenticated && user ? (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Staff Mode</p>
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-white/70">{user.email}</p>
          <a href={logoutHref} className="inline-block pt-1 text-xs font-semibold text-white/80 underline underline-offset-4 hover:text-white">
            Sign out
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Kiosk Identity</p>
          <p className="text-sm text-white/85">Not signed in. Staff-assisted send-as-me actions will stay unavailable until Microsoft sign-in is active.</p>
          <a href={loginHref} className="inline-block text-xs font-semibold text-white underline underline-offset-4 hover:text-white/80">
            Sign in with Microsoft
          </a>
        </div>
      )}
    </div>
  );
}
