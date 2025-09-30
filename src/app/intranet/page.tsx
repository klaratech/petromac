'use client';

import { useState } from 'react';
import Image from "next/image";
import PdfViewerModal from "@/components/PdfViewerModal";

export default function IntranetHome() {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  const athenaProdUrl = process.env.NEXT_PUBLIC_ATHENA_PROD_URL || "https://athena.example.com";
  const athenaTestUrl = process.env.NEXT_PUBLIC_ATHENA_TEST_URL || "https://athena-beta.example.com";
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 py-16">
      <h1 className="text-3xl font-bold mb-8">Intranet</h1>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
        <a
          href={athenaProdUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border rounded-xl p-10 shadow hover:shadow-lg transition flex flex-col items-center gap-4"
        >
          <Image
            src="/images/athena_logo.png"
            alt="Athena"
            width={120}
            height={120}
            className="object-contain"
          />
          <h2 className="text-2xl font-bold">Athena</h2>
        </a>
        <a
          href={athenaTestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border rounded-xl p-10 shadow hover:shadow-lg transition flex flex-col items-center gap-4"
        >
          <Image
            src="/images/athena_logo_beta.png"
            alt="Athena Beta"
            width={120}
            height={120}
            className="object-contain"
          />
          <h2 className="text-2xl font-bold">Athena Beta</h2>
        </a>
        <a
          href="/intranet/kiosk"
          target="_blank"
          rel="noopener noreferrer"
          className="border rounded-xl p-10 shadow hover:shadow-lg transition flex flex-col items-center gap-4"
        >
          <div className="w-[120px] h-[120px] flex items-center justify-center text-6xl">
            🖥️
          </div>
          <h2 className="text-2xl font-bold">Kiosk</h2>
        </a>
        <div
          onClick={() => setIsPdfModalOpen(true)}
          className="border rounded-xl p-10 shadow hover:shadow-lg transition flex flex-col items-center gap-4 cursor-pointer"
        >
          <div className="w-[120px] h-[120px] flex items-center justify-center text-6xl">
            📄
          </div>
          <h2 className="text-2xl font-bold">Success Stories</h2>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {isPdfModalOpen && (
        <PdfViewerModal
          pdfUrl="/successstories.pdf"
          title="Success Stories"
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </main>
  );
}
