'use client';

import { useState } from 'react';

import { buildClientApiUrl } from '@/lib/api';

/**
 * "Download this page" on a success story — the published PDF page for this
 * one story.
 *
 * The story page used to RENDER that whole published page as an image below
 * the extracted prose, which repeated every word of the story back at the
 * reader as pixels (and gave Google a second copy of the text it couldn't
 * read). The page now shows the extracted figures instead, and the published
 * page becomes a download for anyone who wants the original artefact.
 *
 * Same endpoint and same shape as the hub's filtered download in
 * CaseStudiesBrowser — a page list of exactly one. The backend wraps it in
 * cover/back, so what lands is a self-contained one-story PDF.
 */
export default function DownloadStoryPage({ page, slug }: { page: number; slug: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const download = async () => {
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(buildClientApiUrl('/api/pdf/success-stories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumbers: [page], mode: 'download' }),
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `petromac-${slug}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand disabled:opacity-60"
      >
        {busy ? 'Building…' : 'Download this page (PDF)'}
      </button>
      {error && (
        <span role="alert" className="text-sm text-red-600">
          Couldn’t build the PDF. Please try again.
        </span>
      )}
    </>
  );
}
