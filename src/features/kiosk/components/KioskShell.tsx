'use client';

import { useEffect } from 'react';

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

  return <div className="fixed inset-0 z-50 bg-black overflow-hidden">{children}</div>;
}
