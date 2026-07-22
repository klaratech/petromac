'use client';

import Link from 'next/link';
import { useState } from 'react';
import LegalDrawer, { type LegalDoc } from './legal/LegalDrawer';

export default function Footer() {
  // Which legal document (if any) is open in the slide-out drawer.
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  /**
   * Footer legal links stay real anchors (good for SEO and progressive
   * enhancement). A plain left-click opens the slide-out drawer instead of
   * navigating; modified clicks (cmd/ctrl/middle) fall through so the page
   * can still be opened in a new tab.
   */
  const openDrawer = (doc: Exclude<LegalDoc, null>) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    setLegalDoc(doc);
  };

  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center sm:justify-between sm:text-left">
          <div className="text-lg font-heading font-semibold text-white">Petromac</div>
          <div className="text-sm text-slate-400">
            <p>© 2026 Petromac. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              onClick={openDrawer('privacy')}
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <div className="h-4 w-px bg-slate-600" />
            <Link
              href="/terms"
              onClick={openDrawer('terms')}
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>

      <LegalDrawer doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </footer>
  );
}
