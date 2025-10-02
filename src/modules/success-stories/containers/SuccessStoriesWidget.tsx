'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { SuccessStoriesPanel } from '@/components/shared/panels';
import type { SuccessStoriesFilters } from '../types/successStories.types';

export interface SuccessStoriesWidgetProps {
  /** Whether the widget is shown as a modal */
  isOpen?: boolean;
  
  /** Callback when modal is closed */
  onClose?: () => void;
  
  /** Initial filters */
  initialFilters?: SuccessStoriesFilters;
}

export default function SuccessStoriesWidget({
  isOpen = true,
  onClose,
  initialFilters = {},
}: SuccessStoriesWidgetProps) {
  const [filters, setFilters] = useState<SuccessStoriesFilters>(initialFilters);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('Petromac Success Stories');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handlePreview = useCallback(() => {
    // Redirect to flipbook page
    window.location.href = '/success-stories/flipbook';
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Check if offline
      if (!navigator.onLine) {
        alert('You are offline. The PDF download will be queued and processed when you\'re back online.');
      }

      const response = await fetch('/api/pdf/success-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, mode: 'download' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'success-stories.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // If offline or network error, the service worker will queue it
      if (!navigator.onLine || (err instanceof TypeError && err.message.includes('fetch'))) {
        alert('You are offline. Your PDF download request has been queued and will be processed when you\'re back online.');
      } else {
        setError(err instanceof Error ? err.message : 'Download failed');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [filters]);

  const handleEmail = useCallback(async () => {
    if (!emailTo.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setIsSendingEmail(true);
      setError(null);

      // Check if offline
      if (!navigator.onLine) {
        alert('You are offline. Your email will be queued and sent when you\'re back online.');
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          filters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email');
      }

      // Success
      setShowEmailForm(false);
      setEmailTo('');
      alert('Email sent successfully!');
    } catch (err) {
      // If offline or network error, the service worker will queue it
      if (!navigator.onLine || (err instanceof TypeError && err.message.includes('fetch'))) {
        alert('You are offline. Your email has been queued and will be sent when you\'re back online.');
        setShowEmailForm(false);
        setEmailTo('');
      } else {
        setError(err instanceof Error ? err.message : 'Email sending failed');
      }
    } finally {
      setIsSendingEmail(false);
    }
  }, [emailTo, emailSubject, filters]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  if (!isOpen && onClose) return null;

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Success Stories</h2>
          <p className="text-sm text-gray-600 mt-1">Filter and export custom PDF documents</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Filters */}
        <div className="w-96 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            <SuccessStoriesPanel
              filters={filters}
              onFiltersChange={setFilters}
              dense={false}
            />

            {/* Action Buttons */}
            <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
              <button
                onClick={handlePreview}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Preview Filtered PDF'}
              </button>
              
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download PDF
              </button>
              
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                disabled={isGenerating || isSendingEmail}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Email PDF
              </button>

              {/* Email Form */}
              {showEmailForm && (
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md space-y-3">
                  <div>
                    <label htmlFor="email-to" className="block text-sm font-medium text-gray-700 mb-1">
                      To Email
                    </label>
                    <input
                      id="email-to"
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      id="email-subject"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleEmail}
                    disabled={isSendingEmail}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Flipbook Link */}
        <div className="flex-1 bg-gray-100 p-6 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-32 h-32 mx-auto text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Interactive Flipbook</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              View success stories in an interactive flipbook format with smooth page-turning animations.
            </p>
            <Link
              href="/success-stories/flipbook"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-lg"
            >
              Open Flipbook
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // If used as a modal
  if (onClose) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleOverlayClick}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden">
          {content}
        </div>
      </div>
    );
  }

  // If used as a full-page widget
  return (
    <div className="h-screen bg-white">
      {content}
    </div>
  );
}
