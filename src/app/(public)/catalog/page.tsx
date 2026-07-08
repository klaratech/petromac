'use client';

import dynamic from 'next/dynamic';
import { EmailPdfButton } from '@/components/shared/EmailPdfButton';
import { FLIPBOOK_KEYS, getFlipbookBasePath } from '@/features/flipbooks';

// react-pdf (pdf.js) is ~350 KB gzipped — keep it out of every other page's
// bundle and off the server (pdf.js is browser-only).
const CatalogViewer = dynamic(() => import('@/components/public/catalog/CatalogViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[700px] flex items-center justify-center text-gray-500" role="status">
      Loading catalog…
    </div>
  ),
});

export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-gray-100 overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600 mt-1">
              Browse, search, and follow links through our complete catalog of wireline logging
              devices and solutions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <EmailPdfButton
              pdfUrl={`${getFlipbookBasePath(FLIPBOOK_KEYS.catalog)}/source.pdf`}
              pdfType="catalog"
            />
            <a
              href={`${getFlipbookBasePath(FLIPBOOK_KEYS.catalog)}/source.pdf`}
              download
              className="inline-flex items-center gap-2 whitespace-nowrap px-6 py-3 rounded-full font-semibold text-sm text-white bg-brand hover:bg-brand/90 shadow-lg shadow-blue-900/20 ring-1 ring-blue-900/10 transition-all hover:-translate-y-px hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                />
              </svg>
              Download PDF
            </a>
          </div>
        </div>
        <CatalogViewer />
      </div>
    </main>
  );
}
