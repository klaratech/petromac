"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PrivacyContent, { PRIVACY_TITLE } from "./PrivacyContent";
import TermsContent, { TERMS_TITLE } from "./TermsContent";

/** Which legal document the drawer is showing, or null when closed. */
export type LegalDoc = "privacy" | "terms" | null;

const TITLES: Record<"privacy" | "terms", string> = {
  privacy: PRIVACY_TITLE,
  terms: TERMS_TITLE,
};

const ROUTES: Record<"privacy" | "terms", string> = {
  privacy: "/privacy",
  terms: "/terms",
};

/**
 * Slide-out drawer for the Privacy Policy and Terms of Use.
 *
 * These documents are secondary to the main site experience, so instead of
 * navigating away they slide in from the right over a dimmed backdrop. The
 * standalone /privacy and /terms routes are kept intact for direct links,
 * SEO, and modified-click "open in new tab" behaviour.
 *
 * Controlled component: parent owns the `doc` state and `onClose`.
 */
export default function LegalDrawer({
  doc,
  onClose,
}: {
  doc: LegalDoc;
  onClose: () => void;
}) {
  const open = doc !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Keep the last document mounted while the drawer animates closed so the
  // content doesn't vanish mid-slide. This is the React-sanctioned "adjust
  // state during render" pattern: when a new doc opens we sync immediately,
  // but when `doc` goes null on close we keep showing the previous one.
  const [rendered, setRendered] =
    useState<Exclude<LegalDoc, null>>("privacy");
  if (doc !== null && doc !== rendered) {
    setRendered(doc);
  }

  // Reset the scroll position whenever a new document is opened.
  useEffect(() => {
    if (doc && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [doc]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Lightweight focus trap: keep Tab focus within the panel.
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the drawer for keyboard and screen-reader users.
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open, handleKeyDown]);

  const title = TITLES[rendered];

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] ${open ? "" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sticky header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
              Legal
            </p>
            <h2 className="truncate font-heading text-xl font-bold text-slate-900">
              {title}
            </h2>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <a
              href={ROUTES[rendered]}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand"
              title="Open as a full page"
            >
              Open page ↗
            </a>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8"
        >
          {rendered === "privacy" ? <PrivacyContent /> : <TermsContent />}
        </div>
      </div>
    </div>
  );
}
