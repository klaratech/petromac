"use client";

import dynamic from "next/dynamic";
import { EmailPdfButton } from "@/components/shared/EmailPdfButton";
import { FLIPBOOK_KEYS, buildFlipbookPageUrls, getFlipbookBasePath } from "@/features/flipbooks";
import { useFlipbookManifest } from "@/features/flipbooks/hooks/useFlipbookManifest";

const Flipbook = dynamic(() => import("@/components/shared/pdf/Flipbook"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[700px] flex items-center justify-center" role="status">
      Loading flipbook...
    </div>
  ),
});

export default function CatalogPage() {
  const { manifest, error: manifestError } = useFlipbookManifest(FLIPBOOK_KEYS.catalog);
  const pages = manifest ? buildFlipbookPageUrls(FLIPBOOK_KEYS.catalog, manifest) : [];

  return (
    <main className="min-h-screen bg-gray-100 overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600 mt-1">
              Browse our complete catalog of wireline logging devices and solutions
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
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {manifestError ? (
            <div className="min-h-[700px] flex flex-col items-center justify-center text-center px-6">
              <h2 className="text-lg font-semibold text-red-600 mb-2">
                Couldn&apos;t load the catalog
              </h2>
              <p className="text-gray-600 max-w-md mb-6">{manifestError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : manifest ? (
            <Flipbook pages={pages} width={600} height={840} />
          ) : (
            <div className="min-h-[700px] flex items-center justify-center text-gray-600" role="status">
              Loading catalog...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
