import type { Metadata, Viewport } from 'next';
import KioskShell from '@/components/kiosk/KioskShell';

export const metadata: Metadata = {
  title: 'Petromac Kiosk',
  description: 'Petromac kiosk application',
  // Staff-only surface — robots.txt already disallows /intranet, this is
  // defense-in-depth (robots.txt is advisory).
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <KioskShell>{children}</KioskShell>;
}
