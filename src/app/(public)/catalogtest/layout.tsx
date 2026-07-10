import type { Metadata } from 'next';

// /catalogtest is the offline refinement area for the new HTML catalog.
// Keep it out of search indexes until it replaces /catalog.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CatalogTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
