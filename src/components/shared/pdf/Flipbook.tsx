"use client";

import { useEffect, useRef, useState } from "react";
import { PageFlip } from "page-flip";

type FlipbookProps = {
  pages: string[];
  width?: number;
  height?: number;
  pageNumbers?: number[];
  selectedPages?: number[];
  onToggleSelect?: (_pageNumber: number) => void;
};

export default function Flipbook({
  pages,
  width = 800,
  height = 600,
  pageNumbers,
  selectedPages = [],
  onToggleSelect,
}: FlipbookProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  // Width of the parent container (where the flipbook is dropped in). We
  // size the spread off this rather than the viewport so the book always
  // fits its host — fixes horizontal overflow on the Catalog page where
  // a parent .container limits width below the viewport.
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const isMobile = containerWidth != null ? containerWidth < 768 : false;
  const aspectRatio = height / width;
  // Reserve a bit of horizontal padding so page shadows aren't clipped.
  const maxSpreadWidth = containerWidth
    ? Math.max(320, containerWidth - 16)
    : width * 2;
  const pageWidth = isMobile
    ? Math.max(240, Math.min(width, maxSpreadWidth))
    : Math.max(320, Math.min(width, Math.floor(maxSpreadWidth / 2)));
  const pageHeight = Math.round(pageWidth * aspectRatio);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const set = () => setContainerWidth(el.clientWidth);
    set();

    // ResizeObserver covers both window resizes and parent layout changes
    // (e.g. sidebar toggles). Falls back gracefully when unavailable.
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", set);
      return () => window.removeEventListener("resize", set);
    }

    const obs = new ResizeObserver(() => set());
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!bookRef.current) return;
    // Hold initialization until the wrapper has been measured.
    // Initialising at the fallback `width` and then re-initialising the
    // moment the ResizeObserver fires used to cause a visible race —
    // sometimes the "1 of N" header rendered with an empty book underneath
    // (the destroy/recreate happened mid-load), and sometimes PageFlip's
    // destroy() threw during the second pass and bubbled all the way up to
    // the global error boundary at src/app/error.tsx ("page 500 / Try
    // Again"). Waiting for a real measurement turns those into one clean
    // init.
    if (containerWidth == null) return;

    let cancelled = false;
    setIsLoading(true);

    // Create all page elements. Wrapped in try/catch defensively — a
    // malformed page URL or DOM error here used to take down the whole
    // tree.
    let pageElements: HTMLDivElement[] = [];
    try {
      pageElements = pages.map((src) => {
        const pageElement = document.createElement("div");
        pageElement.className = "page";
        pageElement.setAttribute("data-density", "hard");

        const img = document.createElement("img");
        img.src = src;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";

        pageElement.appendChild(img);
        return pageElement;
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error building flipbook page elements:", error);
      setIsLoading(false);
      return;
    }

    // Wait a tick for DOM to update
    const rafId = window.requestAnimationFrame(() => {
      if (!bookRef.current || cancelled) return;

      try {
        if (flipRef.current) {
          try {
            flipRef.current.destroy();
          } catch {
            // page-flip occasionally throws when destroying mid-animation;
            // we don't care — we're rebuilding anyway.
          }
          flipRef.current = null;
        }

        // Clear any existing content before init
        bookRef.current.innerHTML = "";

        // Initialize PageFlip (two-page on desktop, single-page on mobile)
        const flipInstance = new PageFlip(bookRef.current, {
          width: pageWidth,
          height: pageHeight,
          size: "fixed",
          minWidth: 240,
          maxWidth: 2000,
          minHeight: 320,
          maxHeight: 1533,
          maxShadowOpacity: 0.5,
          showCover: true,
          mobileScrollSupport: true,
          drawShadow: true,
          flippingTime: 1000,
          usePortrait: isMobile,
          startZIndex: 0,
          autoSize: false,
        });

        flipInstance.loadFromHTML(pageElements);
        flipRef.current = flipInstance;

        // Add event listener for page flip
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (flipInstance as any).on("flip", (e: any) => {
          setCurrentPage(e.data);
        });

        setCurrentPage(0);
        setIsLoading(false);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error updating flipbook:", error);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      if (flipRef.current) {
        try {
          flipRef.current.destroy();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Error during cleanup:", e);
        }
        flipRef.current = null;
      }
    };
  }, [pages, pageWidth, pageHeight, isMobile, containerWidth]);

  const goToNextPage = () => {
    if (flipRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (flipRef.current as any).flipNext();
    }
  };

  const goToPrevPage = () => {
    if (flipRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (flipRef.current as any).flipPrev();
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const totalPages = pages.length;
  const displayPage = currentPage + 1;
  const pageNumber = pageNumbers?.[currentPage] ?? displayPage;
  const isIncluded = selectedPages.includes(pageNumber);
  const isExcluded = !isIncluded;

  return (
    <div
      ref={wrapperRef}
      className="w-full flex flex-col justify-center items-center py-2 overflow-hidden"
    >
      {isLoading && (
        <div className="text-center mb-4">
          <p>Loading flipbook...</p>
        </div>
      )}
      
      {/* Flipbook Container — no `key` here on purpose. The effect above
          already destroys and rebuilds the PageFlip when its deps change;
          keying the div as well used to cause an unmount race where
          destroy() ran against a detached DOM element and sometimes
          bubbled an error up to the global error boundary. */}
      <div
        ref={bookRef}
        className="flipbook-container"
        style={{
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          background: "#fff",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: "transform 0.2s ease-out",
        }}
      />

      {/* Controls Bar */}
      {!isLoading && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 bg-gray-100 px-6 py-3 rounded-lg shadow">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Zoom Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 2}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Zoom In"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              title="Previous Page"
            >
              ← Previous
            </button>
            <span className="text-sm font-semibold min-w-[80px] text-center">
              {displayPage} of {totalPages}
            </span>
            {onToggleSelect && pageNumber != null && (
              <button
                onClick={() => onToggleSelect(pageNumber)}
                className={`px-4 py-2 rounded font-medium transition ${
                  isExcluded
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
                title={isExcluded ? "Include page" : "Exclude page"}
              >
                {isExcluded ? "Excluded" : "Exclude"}
              </button>
            )}
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              title="Next Page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
      <style jsx global>{`
        .flipbook-container {
          margin: 0 auto;
        }
        .page {
          background: white;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        .page img {
          user-select: none;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
