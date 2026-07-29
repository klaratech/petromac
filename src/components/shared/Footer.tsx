'use client';

import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { type LegalDoc } from './legal/LegalDrawer';

// Loaded on demand. This one also trims the HTML, not just JS: LegalDrawer
// stays mounted when closed, so the FULL privacy policy and terms text was
// being server-rendered into the footer of every single page.
const LegalDrawer = dynamic(() => import('./legal/LegalDrawer'), { ssr: false });

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
            {/* Plain link, no drawer handler: /contact is indexed and was left
                orphaned when the catalog CTA and the drawer's own footer link
                were removed. A crawlable link back keeps the search-landing
                path alive; the header's email icon remains the in-flow route. */}
            <Link
              href="/contact"
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Contact
            </Link>
            <div className="h-4 w-px bg-slate-600" />
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
