'use client';

import { Suspense, useEffect } from 'react';
import StaffIdentityBadge from '@/components/kiosk/StaffIdentityBadge';

export default function KioskShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/kiosk-sw.js', { scope: '/intranet/kiosk/' })
        .then((registration) => {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('[Kiosk] Service Worker registered:', registration.scope);
          }
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('[Kiosk] Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* StaffIdentityBadge calls useSearchParams() (to preserve ?lane= on
          the Microsoft login / logout redirects). Next.js 16 requires that
          any client component using useSearchParams sits inside a Suspense
          boundary on statically-prerendered pages — the kiosk splash is
          one of those — so the prerender doesn't bail. fallback={null}
          keeps the badge invisible until the params resolve (the badge is
          a corner overlay, no layout impact). */}
      <Suspense fallback={null}>
        <StaffIdentityBadge />
      </Suspense>
      {children}
    </div>
  );
}
