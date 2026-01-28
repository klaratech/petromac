"use client";

import { useState } from "react";

interface EmailPdfButtonProps {
  pdfUrl?: string;
  pdfType: "catalog" | "success-stories";
  endpoint?: string;
  payload?: Record<string, unknown>;
  disabled?: boolean;
  buttonLabel?: string;
}

export function EmailPdfButton({
  pdfUrl,
  pdfType,
  endpoint = "/api/email/send-pdf",
  payload,
  disabled = false,
  buttonLabel = "Email PDF",
}: EmailPdfButtonProps) {
  const [revealed, setRevealed] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReveal = () => {
    if (disabled) return;
    setRevealed(true);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          pdfUrl,
          pdfType,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      setMessage({ type: "success", text: "PDF sent successfully!" });
      setEmail("");
      setTimeout(() => {
        setRevealed(false);
        setMessage(null);
      }, 2000);
    } catch {
      setMessage({ type: "error", text: "Failed to send. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleReveal}
        disabled={revealed || disabled}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:bg-green-400 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>

      {revealed && (
        <div className="absolute right-0 top-0 z-50">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-xl border border-gray-200 px-3 py-2 w-80 transform transition-transform duration-200 translate-x-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="you@company.com"
                aria-label="Recipient"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="h-9 w-9 flex items-center justify-center bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300"
                title="Send"
                aria-label="Send"
              >
                {isLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRevealed(false);
                  setEmail("");
                  setMessage(null);
                }}
                className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-gray-600"
                aria-label="Close"
                title="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          </div>
          {message && (
            <div
              className={`mt-2 px-3 py-2 rounded text-xs ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
