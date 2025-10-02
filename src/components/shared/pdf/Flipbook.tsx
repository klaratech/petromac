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

  useEffect(() => {
    if (!bookRef.current) return;

    // Destroy existing instance if any
    if (flipRef.current) {
      try {
        flipRef.current.destroy();
      } catch (e) {
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
        // Initialize PageFlip with two-page spread like an open book
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
          usePortrait: false,
          startZIndex: 0,
          autoSize: false,
        });

        flipRef.current.loadFromHTML(pageElements);
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing flipbook:", error);
        setIsLoading(false);
      }
    }, 100);

    return () => {
      if (flipRef.current) {
        try {
          flipRef.current.destroy();
        } catch (e) {
          console.error("Error during cleanup:", e);
        }
        flipRef.current = null;
      }
    };
  }, [pages, width, height]);

  return (
    <div className="w-full flex flex-col justify-center items-center py-8">
      {isLoading && (
        <div className="text-center mb-4">
          <p>Loading flipbook...</p>
        </div>
      )}
      <div 
        ref={bookRef} 
        className="flipbook-container"
        style={{
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          background: "#fff",
        }}
      />
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
