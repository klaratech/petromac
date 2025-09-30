'use client';

import { useState, useEffect } from 'react';

export interface PDFViewerPaneProps {
  /** URL of the PDF to display */
  url: string;
  
  /** Optional class name for styling */
  className?: string;
  
  /** Show loading state */
  isLoading?: boolean;
  
  /** Error message if PDF failed to load */
  error?: string | null;
}

export default function PDFViewerPane({
  url,
  className = '',
  isLoading = false,
  error = null,
}: PDFViewerPaneProps) {
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(true);

  useEffect(() => {
    // Reset error state when URL changes
    setEmbedError(null);
    setIsLoadingEmbed(true);
  }, [url]);

  const handleIframeLoad = () => {
    setIsLoadingEmbed(false);
  };

  const handleIframeError = () => {
    setEmbedError('Failed to load PDF viewer');
    setIsLoadingEmbed(false);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center p-8">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading PDF</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {(isLoading || isLoadingEmbed) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}

      {embedError ? (
        <div className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 h-full">
          <div className="text-center p-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Viewer Error</h3>
            <p className="mt-1 text-sm text-gray-500">{embedError}</p>
            <button
              onClick={() => window.open(url, '_blank')}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Open in New Tab
            </button>
          </div>
        </div>
      ) : (
        <embed
          src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
          type="application/pdf"
          className="w-full h-full rounded-lg"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}
    </div>
  );
}
