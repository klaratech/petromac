'use client';

import { useEffect, useRef } from 'react';

interface Props {
  pdfUrl: string;
  title?: string;
  onClose: () => void;
}

export default function PdfViewerModal({ pdfUrl, title = "PDF Viewer", onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
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
  }, [onClose]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
