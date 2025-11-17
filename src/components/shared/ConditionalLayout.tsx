'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isKioskRoute = pathname?.startsWith('/intranet/kiosk');

  if (isKioskRoute) {
    // Kiosk routes: no header/footer, full viewport
    return <>{children}</>;
  }

  // Regular routes: with header and footer
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
