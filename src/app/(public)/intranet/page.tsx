'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function IntranetHome() {
  const athenaProdUrl = process.env.NEXT_PUBLIC_ATHENA_PROD_URL || "https://athena.petromac.co.nz/";
  const athenaTestUrl = process.env.NEXT_PUBLIC_ATHENA_TEST_URL || "https://test.athena.digitaltwins.com.bo/#/login";
  const [showKioskInstructions, setShowKioskInstructions] = useState(false);
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 py-12 bg-gray-50 text-gray-900">
      <h1 className="text-3xl font-bold">Intranet</h1>

      <section className="w-full max-w-5xl">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Quick Links</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Athena Production */}
          <a
            href={athenaProdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-500 transition flex flex-col items-center gap-2 bg-white"
          >
            <Image
              src="/images/athena_logo.png"
              alt="Athena Production"
              width={64}
              height={64}
              className="object-contain"
            />
            <h3 className="text-base font-semibold tracking-wide text-gray-900">Athena (Prod)</h3>
          </a>

          {/* Athena Test */}
          <a
            href={athenaTestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-500 transition flex flex-col items-center gap-2 bg-white"
          >
            <Image
              src="/images/athena_logo_beta.png"
              alt="Athena Test"
              width={64}
              height={64}
              className="object-contain"
            />
            <h3 className="text-base font-semibold tracking-wide text-gray-900">Athena (Test)</h3>
          </a>
        </div>
      </section>

      <section className="w-full max-w-5xl">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Internal Applications</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 justify-items-center">
          {/* Kiosk */}
          <button
            onClick={() => setShowKioskInstructions(true)}
            className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-500 transition flex flex-col items-center gap-2 cursor-pointer bg-white w-full max-w-xs"
          >
            <div className="w-16 h-16 flex items-center justify-center text-3xl">
              🖥️
            </div>
            <h3 className="text-base font-semibold tracking-wide text-gray-900">Kiosk</h3>
          </button>

          {/* Email Log */}
          <Link
            href="/intranet/email-log"
            className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-500 transition flex flex-col items-center gap-2 bg-white w-full max-w-xs"
          >
            <div className="w-16 h-16 flex items-center justify-center text-3xl">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="text-base font-semibold tracking-wide text-gray-900">Email Log</h3>
          </Link>
        </div>
      </section>

      {/* Kiosk Instructions Modal */}
      {showKioskInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Kiosk Setup Instructions</h2>
                <button
                  onClick={() => setShowKioskInstructions(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 text-gray-700">
                <p className="text-lg">
                  The kiosk view is developed to be shown at trade shows. The ideal way to use it is to mirror an Android tablet to an Amazon Fire Stick connected to a TV. That way you can control the application with a tablet but also display the videos on a big screen.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Setup Steps:</h3>
                  <ol className="space-y-3 list-decimal list-inside">
                    <li className="text-gray-800">
                      <span className="font-medium">Open the link below</span> with Chrome or Edge on your Android tablet
                    </li>
                    <li className="text-gray-800">
                      <span className="font-medium">Click on the 3 dots</span> (browser menu) and select &ldquo;Install app&rdquo; or &ldquo;Add to Home Screen&rdquo;
                    </li>
                    <li className="text-gray-800">
                      This enables <span className="font-medium">full-screen and offline functionality</span>
                    </li>
                    <li className="text-gray-800">
                      <span className="font-medium">On your streaming stick</span> (Amazon Fire Stick), choose the mirroring/screen casting option
                    </li>
                    <li className="text-gray-800">
                      <span className="font-medium">Mirror your tablet</span> to the TV
                    </li>
                    <li className="text-gray-800">
                      <span className="font-medium">Open the installed application</span> on your tablet and you&apos;re done!
                    </li>
                  </ol>
                </div>

                <div className="pt-4">
                  <Link
                    href="/intranet/kiosk"
                    className="block w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition text-center font-semibold text-lg"
                  >
                    Open Kiosk Application
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
