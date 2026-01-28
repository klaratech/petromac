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
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Email PDF</h3>
            <button
              onClick={() => {
                setRevealed(false);
                setEmail("");
                setMessage(null);
              }}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="your.email@example.com"
              />
            </div>

            {message && (
              <div
                className={`p-2 rounded text-xs ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
            >
              {isLoading ? "Sending..." : "Send PDF"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
