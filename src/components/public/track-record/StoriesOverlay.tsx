'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Heavy (flipbook + filters + papaparse) — only pull it in when opened.
const SuccessStoriesFlipbook = dynamic(
  () => import('@/features/success-stories/components/SuccessStoriesFlipbook'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center text-slate-500" role="status">
        Loading success stories…
      </div>
    ),
  }
);

/**
 * Renders Success Stories as a full-screen overlay on top of Track Record
 * when the URL carries `?stories=1`. Using a query param (not local state)
 * makes the overlay Back-button-dismissable and shareable. The standalone
 * /success-stories/flipbook route still exists for direct links, SEO, and
 * the "view online" links in emailed PDFs.
 */
export default function StoriesOverlay() {
  const params = useSearchParams();
  const router = useRouter();
  const open = params.get('stories') === '1';

  const close = useCallback(() => {
    router.push('/track-record', { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50"
      role="dialog"
      aria-modal="true"
      aria-label="Success Stories"
    >
      <SuccessStoriesFlipbook onBack={close} backLabel="Back to Track Record" />
    </div>
  );
}
