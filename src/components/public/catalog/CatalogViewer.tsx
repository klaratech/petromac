'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Self-hosted worker (public/pdfjs/) — same rule as the Draco decoder:
// never let a viewer dependency reach for a CDN.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

// Single-PDF scheme (Jul 2026): the pipeline compresses each new catalog
// to <4 MB on ingest — the same file serves this viewer, the Download
// button, and emailed attachments. Descriptive filename because it's also
// what users see when they download.
const PDF_URL = '/flipbooks/catalog/petromac-product-catalog.pdf';
// Per-page text extracted at pipeline time (pypdf) from the full source.
// Fetching this ~50 KB index instead of scanning the PDF in the browser
// keeps search instant and independent of the rendered pages.
const SEARCH_INDEX_URL = '/flipbooks/catalog/search-index.json';
// Catalog pages are 1241x1754pt (A4-ish); used to size placeholders so
// unrendered pages hold their spot and scrolling doesn't jump.
const PAGE_ASPECT = 1754 / 1241;
// Pages within this margin of the viewport get a real canvas; the rest
// stay as placeholders. Keeps 62 pages from eating mobile memory.
const RENDER_MARGIN = '1200px';

// disableAutoFetch stops pdf.js from eagerly prefetching pages we haven't
// scrolled to. (Streaming/range behavior is moot now that the file is 4 MB.)
const DOCUMENT_OPTIONS = {
  disableAutoFetch: true,
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

interface PageMatch {
  page: number;
  count: number;
}

export default function CatalogViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));
  const [currentPage, setCurrentPage] = useState(1);

  // Search state. pageTexts is built once from the PDF's text content —
  // the search box therefore covers ALL pages, not just rendered ones
  // (browser Ctrl+F only sees text layers near the viewport).
  const [pageTexts, setPageTexts] = useState<string[] | null>(null);
  const [query, setQuery] = useState('');
  const [activeMatch, setActiveMatch] = useState(0);

  const pageWidth = containerWidth
    ? Math.round(Math.min(900, containerWidth - 16) * zoom)
    : undefined;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // rAF-throttled: un-throttled ResizeObserver callbacks re-measure and
    // re-render on every resize tick, thrashing layout with 62 pages.
    let frame = 0;
    const set = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setContainerWidth(el.clientWidth));
    };
    setContainerWidth(el.clientWidth);
    const obs = new ResizeObserver(set);
    obs.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, []);

  // Windowed rendering: placeholders are observed, and pages near the
  // viewport get real canvases. Also tracks the topmost visible page for
  // the "Page X of N" indicator.
  useEffect(() => {
    if (!numPages) return;
    const io = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const page = Number((entry.target as HTMLElement).dataset.page);
            if (entry.isIntersecting) next.add(page);
            else next.delete(page);
          }
          return next;
        });
      },
      { rootMargin: RENDER_MARGIN }
    );
    const indicator = new IntersectionObserver(
      (entries) => {
        const topmost = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number((e.target as HTMLElement).dataset.page))
          .sort((a, b) => a - b)[0];
        if (topmost) setCurrentPage(topmost);
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    pageRefs.current.forEach((el) => {
      if (el) {
        io.observe(el);
        indicator.observe(el);
      }
    });
    return () => {
      io.disconnect();
      indicator.disconnect();
    };
  }, [numPages]);

  const onDocumentLoad = useCallback((pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
  }, []);

  // Load the prebuilt search index (independent of the PDF stream).
  useEffect(() => {
    let cancelled = false;
    fetch(SEARCH_INDEX_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { pages: string[] }) => {
        if (!cancelled) setPageTexts(data.pages);
      })
      .catch(() => {
        // Index missing — viewer still works, search just stays disabled.
        if (!cancelled) setPageTexts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const matches: PageMatch[] = useMemo(() => {
    if (!pageTexts || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    const result: PageMatch[] = [];
    pageTexts.forEach((text, idx) => {
      const lower = text.toLowerCase();
      let count = 0;
      let pos = lower.indexOf(q);
      while (pos !== -1) {
        count++;
        pos = lower.indexOf(q, pos + q.length);
      }
      if (count > 0) result.push({ page: idx + 1, count });
    });
    return result;
  }, [pageTexts, query]);

  const totalMatches = useMemo(() => matches.reduce((s, m) => s + m.count, 0), [matches]);

  const scrollToPage = useCallback((page: number) => {
    pageRefs.current[page - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goToMatch = useCallback(
    (index: number) => {
      if (matches.length === 0) return;
      const wrapped = ((index % matches.length) + matches.length) % matches.length;
      setActiveMatch(wrapped);
      scrollToPage(matches[wrapped].page);
    },
    [matches, scrollToPage]
  );

  // Reset the match cursor when the query changes — but do NOT scroll:
  // jumping the viewport on every keystroke made typing a search term
  // nauseating. Enter (or the arrows) navigates instead.
  const hasNavigatedRef = useRef(false);
  useEffect(() => {
    setActiveMatch(0);
    hasNavigatedRef.current = false;
  }, [query]);

  // Highlight search hits inside the text layer of rendered pages. The
  // return value is rendered as HTML by react-pdf, so every text fragment
  // is HTML-escaped — match positions are found on the raw string, then
  // the output is rebuilt from escaped slices.
  const highlight = useCallback(
    (textItem: { str: string }) => {
      const raw = textItem.str;
      const q = query.trim();
      if (q.length < 2) return escapeHtml(raw);
      const lower = raw.toLowerCase();
      const needle = q.toLowerCase();
      let out = '';
      let pos = 0;
      let hit = lower.indexOf(needle);
      while (hit !== -1) {
        out += escapeHtml(raw.slice(pos, hit));
        out += `<mark style="background:#fde047;color:inherit;border-radius:2px;">${escapeHtml(raw.slice(hit, hit + q.length))}</mark>`;
        pos = hit + q.length;
        hit = lower.indexOf(needle, pos);
      }
      out += escapeHtml(raw.slice(pos));
      return out;
    },
    [query]
  );

  const placeholderHeight = pageWidth ? Math.round(pageWidth * PAGE_ASPECT) : 900;

  if (loadError) {
    return (
      <div className="min-h-[700px] flex flex-col items-center justify-center text-center gap-3 px-6">
        <h2 className="text-lg font-semibold text-red-600">Couldn&apos;t load the catalog</h2>
        <p className="text-gray-600 max-w-md">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* Toolbar — sticky under the site header */}
      <div className="sticky top-[74px] z-20 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur rounded-lg border border-gray-200 shadow-sm px-4 py-2.5 mb-4">
        {/* Search */}
        <div className="flex items-center gap-2 min-w-0 grow sm:grow-0">
          <svg
            className="w-4 h-4 text-gray-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              // First Enter goes to the first hit; subsequent Enters step.
              const step = hasNavigatedRef.current ? (e.shiftKey ? -1 : 1) : 0;
              hasNavigatedRef.current = true;
              goToMatch(activeMatch + step);
            }}
            placeholder={pageTexts === null ? 'Indexing…' : 'Search the catalog…'}
            disabled={pageTexts === null}
            aria-label="Search the catalog"
            className="w-40 sm:w-56 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          {query.trim().length >= 2 && (
            <div className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
              {totalMatches > 0 ? (
                <>
                  <span className="tabular-nums">
                    {matches[activeMatch]?.page ? `p.${matches[activeMatch].page}` : ''} (
                    {totalMatches} match{totalMatches === 1 ? '' : 'es'})
                  </span>
                  <button
                    onClick={() => goToMatch(activeMatch - 1)}
                    className="px-1.5 py-0.5 rounded hover:bg-gray-100"
                    aria-label="Previous match"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => goToMatch(activeMatch + 1)}
                    className="px-1.5 py-0.5 rounded hover:bg-gray-100"
                    aria-label="Next match"
                  >
                    ↓
                  </button>
                </>
              ) : (
                <span>No matches</span>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" aria-hidden="true" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
            disabled={zoom <= 0.6}
            className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-700 font-semibold"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="text-sm text-gray-600 tabular-nums w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))}
            disabled={zoom >= 2}
            className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-700 font-semibold"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        {/* Page indicator + jump */}
        <div className="flex items-center gap-2 ml-auto text-sm text-gray-600">
          <span className="whitespace-nowrap">
            Page{' '}
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={currentPage}
              onChange={(e) => {
                const p = Number(e.target.value);
                setCurrentPage(p);
                if (p >= 1 && p <= numPages) scrollToPage(p);
              }}
              aria-label="Jump to page"
              className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center tabular-nums"
            />{' '}
            of {numPages || '…'}
          </span>
        </div>
      </div>

      {/* Pages */}
      {/* overflow-x-auto: zoomed pages wider than the container scroll
          horizontally instead of clipping (the page shell hides overflow).
          Rendering waits for a real container measurement so placeholders
          get correct dimensions on first paint (no layout shift). */}
      <div className="overflow-x-auto">
        {containerWidth == null ? (
          <div className="min-h-[700px]" aria-hidden="true" />
        ) : (
          <Document
            file={PDF_URL}
            options={DOCUMENT_OPTIONS}
            // Open catalog links (petromac.co.nz etc.) in a new tab.
            externalLinkTarget="_blank"
            externalLinkRel="noopener noreferrer"
            onLoadSuccess={onDocumentLoad}
            onLoadError={(err) => setLoadError(err.message)}
            loading={
              <div
                className="min-h-[700px] flex items-center justify-center text-gray-500"
                role="status"
              >
                Loading catalog…
              </div>
            }
            className="flex flex-col items-center gap-4"
          >
            {Array.from({ length: numPages }, (_, idx) => {
              const pageNumber = idx + 1;
              const shouldRender = visiblePages.has(pageNumber);
              return (
                <div
                  key={pageNumber}
                  ref={(el) => {
                    pageRefs.current[idx] = el;
                  }}
                  data-page={pageNumber}
                  // scroll-margin clears the sticky toolbar on jump-to-page
                  style={{ minHeight: placeholderHeight, scrollMarginTop: 140 }}
                  className="w-full flex justify-center"
                >
                  {shouldRender && pageWidth ? (
                    <Page
                      pageNumber={pageNumber}
                      width={pageWidth}
                      customTextRenderer={highlight}
                      className="shadow-md"
                      loading={
                        <div
                          style={{ width: pageWidth, height: placeholderHeight }}
                          className="bg-white shadow-md animate-pulse"
                        />
                      }
                    />
                  ) : (
                    <div
                      style={{ width: pageWidth, height: placeholderHeight }}
                      className="bg-white shadow-md"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </Document>
        )}
      </div>
    </div>
  );
}
