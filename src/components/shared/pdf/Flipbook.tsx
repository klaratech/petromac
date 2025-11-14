"use client";

import { useEffect, useRef, useState } from "react";
import { PageFlip } from "page-flip";

type FlipbookProps = {
  pages: string[];
  width?: number;
  height?: number;
};

export default function Flipbook({ pages, width = 800, height = 600 }: FlipbookProps) {
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!bookRef.current) return;

    // Destroy existing instance if any
    if (flipRef.current) {
      try {
        flipRef.current.destroy();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error destroying flipbook:", e);
      }
      flipRef.current = null;
    }

    // Clear any existing content
    bookRef.current.innerHTML = "";

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
      bookRef.current?.appendChild(pageElement);
      pageElements.push(pageElement);
    });

    // Wait a tick for DOM to update
    setTimeout(() => {
      if (!bookRef.current) return;

      try {
        // Initialize PageFlip with single page view
        flipRef.current = new PageFlip(bookRef.current, {
          width,
          height,
          size: "fixed",
          minWidth: 315,
          maxWidth: 2000,
          minHeight: 400,
          maxHeight: 1533,
          maxShadowOpacity: 0.5,
          showCover: true,
          mobileScrollSupport: true,
          drawShadow: true,
          flippingTime: 1000,
          usePortrait: true,
          startZIndex: 0,
          autoSize: false,
        });

        flipRef.current.loadFromHTML(pageElements);
        
        // Add event listener for page flip
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (flipRef.current as any).on("flip", (e: any) => {
          setCurrentPage(e.data);
        });
        
        setCurrentPage(0);
        setIsLoading(false);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error initializing flipbook:", error);
        setIsLoading(false);
      }
    }, 100);

    return () => {
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
  }, [pages, width, height]);

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

  return (
    <div className="w-full flex flex-col justify-center items-center py-2">
      {isLoading && (
        <div className="text-center mb-4">
          <p>Loading flipbook...</p>
        </div>
      )}
      
      {/* Flipbook Container */}
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
        <div className="flex items-center justify-center gap-4 mt-3 bg-gray-100 px-6 py-3 rounded-lg shadow">
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
