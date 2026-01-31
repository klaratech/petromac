"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const instanceKey = useMemo(() => {
    const first = pages[0] ?? "";
    const last = pages[pages.length - 1] ?? "";
    return `${pages.length}-${first}-${last}-${pageWidth}-${pageHeight}-${isMobile}`;
  }, [pages, pageWidth, pageHeight, isMobile]);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isMobile = viewportWidth != null ? viewportWidth < 768 : false;
  const aspectRatio = height / width;
  const maxSpreadWidth = viewportWidth ? Math.max(320, viewportWidth - 48) : width * 2;
  const pageWidth = isMobile
    ? Math.max(240, Math.min(width, (viewportWidth ?? width) - 32))
    : Math.max(320, Math.min(width, Math.floor(maxSpreadWidth / 2)));
  const pageHeight = Math.round(pageWidth * aspectRatio);

  useEffect(() => {
    if (!bookRef.current) return;

    let cancelled = false;
    setIsLoading(true);

    // Create all page elements
    const pageElements: HTMLDivElement[] = [];
    pages.forEach((src) => {
      const pageElement = document.createElement("div");
      pageElement.className = "page";
      pageElement.setAttribute("data-density", "hard");
      
      const img = document.createElement("img");
      img.src = src;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      
      pageElement.appendChild(img);
      pageElements.push(pageElement);
    });

    // Wait a tick for DOM to update
    const rafId = window.requestAnimationFrame(() => {
      if (!bookRef.current || cancelled) return;

      try {
        if (flipRef.current) {
          flipRef.current.destroy();
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
  }, [pages, pageWidth, pageHeight, isMobile, instanceKey]);

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
    <div className="w-full flex flex-col justify-center items-center py-2">
      {isLoading && (
        <div className="text-center mb-4">
          <p>Loading flipbook...</p>
        </div>
      )}
      
      {/* Flipbook Container */}
      <div 
        key={instanceKey}
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
