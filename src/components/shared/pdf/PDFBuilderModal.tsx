'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PDFBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;

  /**
   * Build callback triggered by the modal. Should return a URL string
   * of the built PDF (e.g., in /public or a CDN URL).
   */
  onBuild: (_options: Record<string, unknown>) => Promise<string>;

  /** Optional defaults to pre-seed the modal form */
  defaultOptions?: Record<string, unknown>;

  /** Optional: Called when build completes with the URL */
  onBuiltUrl?: (_url: string) => void;

  /** Optional: Custom content to render inside the modal */
  children?: React.ReactNode;
}

export default function PDFBuilderModal({
  isOpen,
  onClose,
  title = 'PDF Builder',
  onBuild,
  defaultOptions,
  onBuiltUrl,
  children,
}: PDFBuilderModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the modal when it opens
    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDownload = async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      setError(null);

      const url = await onBuild(defaultOptions || {});
      setPdfUrl(url);

      if (onBuiltUrl) {
        onBuiltUrl(url);
      }

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = url.split('/').pop() || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleCopyLink = async () => {
    if (pdfUrl) {
      try {
        await navigator.clipboard.writeText(pdfUrl);
        alert('Link copied to clipboard!');
      } catch {
        alert('Failed to copy link');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-builder-title"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 id="pdf-builder-title" className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {children}

          {pdfUrl && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800 font-medium mb-3">PDF generated successfully!</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
