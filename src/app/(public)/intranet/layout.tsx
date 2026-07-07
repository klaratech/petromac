import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intranet',
  // Staff-only surface — robots.txt already disallows /intranet, this is
  // defense-in-depth (robots.txt is advisory). Covers /intranet and
  // /intranet/email-log; the kiosk group has its own layout with the same.
  robots: { index: false, follow: false },
};

export default function IntranetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
