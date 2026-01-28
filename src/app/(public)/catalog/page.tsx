"use client";

import dynamic from "next/dynamic";
import { EmailPdfButton } from "@/components/shared/EmailPdfButton";
import { FLIPBOOK_KEYS, buildFlipbookPageUrls, getFlipbookBasePath } from "@/features/flipbooks";
import { useFlipbookManifest } from "@/features/flipbooks/hooks/useFlipbookManifest";

const Flipbook = dynamic(() => import("@/components/shared/pdf/Flipbook"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[700px] flex items-center justify-center" aria-hidden="true">
      Loading flipbook...
    </div>
  ),
});

export default function CatalogPage() {
  const { manifest } = useFlipbookManifest(FLIPBOOK_KEYS.catalog);
  const pages = manifest ? buildFlipbookPageUrls(FLIPBOOK_KEYS.catalog, manifest) : [];

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600 mt-1">
              Browse our complete catalog of wireline logging devices and solutions
            </p>
          </div>
          <div className="flex gap-3">
            <EmailPdfButton
              pdfUrl={`${getFlipbookBasePath(FLIPBOOK_KEYS.catalog)}/source.pdf`}
              pdfType="catalog"
            />
            <a
              href={`${getFlipbookBasePath(FLIPBOOK_KEYS.catalog)}/source.pdf`}
              download
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Download PDF
            </a>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {manifest ? (
            <Flipbook pages={pages} width={500} height={700} />
          ) : (
            <div className="min-h-[700px] flex items-center justify-center text-gray-600">
              Loading catalog...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
