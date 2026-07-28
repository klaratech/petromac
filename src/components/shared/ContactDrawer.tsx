'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import ContactForm from '@/components/public/ContactForm';

/**
 * Contact form in a slide-out drawer, so a visitor can send a message without
 * leaving the page they're reading.
 *
 * Mirrors LegalDrawer's shell (right-hand panel, backdrop, Escape to close,
 * scroll lock) with ONE deliberate difference: LegalDrawer stays mounted and
 * hides itself with `aria-hidden`/`inert`, whereas this one RENDERS NOTHING
 * when closed. That is not a style preference — `ContactForm` contains the
 * Turnstile widget, and Turnstile cannot run a challenge inside a hidden
 * container. Keeping it mounted-but-hidden is exactly the deadlock that broke
 * every email send on 28 Jul 2026. Mounting on open also means each open gets
 * a fresh widget, which suits single-use tokens.
 *
 * /contact remains a real route for direct links and SEO — same split as
 * privacy/terms, where one content component serves both surfaces.
 */
export default function ContactDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    // Lock background scroll while the drawer owns the screen.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the panel so keyboard users aren't left behind the
    // backdrop, and screen readers announce the dialog.
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Contact Petromac"
        // Dark panel because ContactForm is themed dark (bg-slate-800/60
        // fields) — a white drawer would leave the inputs unreadable.
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-slate-950 shadow-2xl focus:outline-none"
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
              Contact
            </p>
            <h2 className="font-heading text-lg font-bold text-white">Send us a message</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact form"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <p className="mb-5 text-sm leading-relaxed text-slate-400">
            Tell us about your well or tool string and we&apos;ll point you to the right regional
            manager.
          </p>
          <ContactForm />
          <p className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-500">
            Prefer the full page?{' '}
            <Link href="/contact" className="font-medium text-brand hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
