'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { buildClientApiUrl } from '@/lib/api';
import { useStaffSession } from '@/hooks/useStaffSession';
import TurnstileWidget, { turnstileConfigured } from '@/components/public/TurnstileWidget';

interface EmailPdfButtonProps {
  pdfUrl?: string;
  pdfType: 'catalog' | 'success-stories';
  endpoint?: string;
  payload?: Record<string, unknown>;
  disabled?: boolean;
  buttonLabel?: string;
}

export function EmailPdfButton({
  pdfUrl,
  pdfType,
  endpoint = buildClientApiUrl('/api/email/send-pdf'),
  payload,
  disabled = false,
  buttonLabel = 'Email PDF',
}: EmailPdfButtonProps) {
  const [revealed, setRevealed] = useState(false);
  // Unique per instance — a hardcoded id={emailInputId} produced duplicate DOM
  // ids when two of these buttons rendered on one page.
  const emailInputId = useId();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // When a staff member is signed in, send AS them via the Next.js staff
  // route; otherwise send from info@ via the FastAPI backend. The sender is
  // displayed on the form so a fallback to info@ is never silent.
  const { canSendAsStaff, user } = useStaffSession();
  const sender = canSendAsStaff && user ? user.email : 'info@petromac.co.nz';

  // Turnstile guards only the PUBLIC info@ path — a signed-in staff send uses
  // /api/staff/send-pdf, where the session cookie beats a CAPTCHA. On the
  // kiosk (staff signed in) no widget appears at all. `forcePublic` handles a
  // staff token lapsing mid-session: the send 401s, we fall back to the public
  // endpoint, so the widget must appear for the retry to carry a token.
  const [forcePublic, setForcePublic] = useState(false);
  const needsTurnstile = turnstileConfigured && (!canSendAsStaff || forcePublic);
  const turnstileResetRef = useRef<(() => void) | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileVerified, setTurnstileVerified] = useState(!turnstileConfigured);
  const [turnstileGraceOver, setTurnstileGraceOver] = useState(!turnstileConfigured);
  const holdForVerification = needsTurnstile && !turnstileVerified && !turnstileGraceOver;

  // 12 s fail-open grace, same as the contact form — a blocked/slow script
  // must not permanently disable sending; the backend still enforces.
  useEffect(() => {
    if (!turnstileConfigured || !revealed) return;
    const t = window.setTimeout(() => setTurnstileGraceOver(true), 12_000);
    return () => window.clearTimeout(t);
  }, [revealed]);

  const handleReveal = () => {
    if (disabled) return;
    setRevealed(true);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const base = { email, pdfUrl, pdfType, ...payload };
    let errorText = 'Failed to send. Please try again.';

    try {
      let response: Response | null = null;

      // Prefer send-as-staff on the kiosk. Same-origin (no NEXT_PUBLIC_API
      // prefix) — the route reads the httpOnly session cookie. A 401 means
      // the token lapsed; fall through to the info@ sender.
      if (canSendAsStaff) {
        const staffRes = await fetch('/api/staff/send-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(base),
        });
        if (staffRes.ok) {
          response = staffRes;
        } else if (staffRes.status === 401) {
          // Public fallback needs a Turnstile token — surface the widget.
          setForcePublic(true);
        } else {
          throw new Error('Failed to send email');
        }
      }

      if (!response) {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Only meaningful on the public endpoint; ignored elsewhere.
          body: JSON.stringify({ ...base, turnstileToken: turnstileToken || undefined }),
        });
        // Tokens are single-use: drop ours and re-arm the widget either way.
        turnstileResetRef.current?.();
        setTurnstileToken('');
        if (response.status === 403) {
          errorText = 'Verification didn’t complete. Please try again.';
          throw new Error('turnstile rejected');
        }
      }

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      setMessage({ type: 'success', text: 'PDF sent successfully!' });
      setEmail('');
      setTimeout(() => {
        setRevealed(false);
        setMessage(null);
      }, 2000);
    } catch {
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleReveal}
        disabled={revealed || disabled}
        className="inline-flex items-center gap-2 whitespace-nowrap px-6 py-3 rounded-full font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-900/10 transition-all hover:-translate-y-px hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:bg-slate-300 disabled:hover:bg-slate-300 disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:cursor-not-allowed"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l2-2h14l2 2"
          />
        </svg>
        {buttonLabel}
      </button>

      {revealed && (
        <div className="absolute right-0 top-0 z-50 email-slider">
          <div className="absolute -bottom-5 right-1 whitespace-nowrap text-[11px] text-gray-500">
            sends from <span className="font-medium">{sender}</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-xl border border-gray-200 px-2 py-1 w-80 h-10">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
              <input
                type="email"
                id={emailInputId}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
                placeholder="name@example.com"
                aria-label="Recipient"
              />

              <button
                type="submit"
                disabled={isLoading || holdForVerification}
                className="h-8 w-8 flex items-center justify-center bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300"
                title={holdForVerification ? 'Waiting for verification' : 'Send'}
                aria-label={holdForVerification ? 'Waiting for verification' : 'Send'}
              >
                {isLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14m-7-7l7 7-7 7"
                    />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRevealed(false);
                  setEmail('');
                  setMessage(null);
                }}
                className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
                aria-label="Close"
                title="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </form>
          </div>
          {/* Human verification — public info@ path only, so the kiosk (staff
              signed in) never sees it. Sits outside the <form> on purpose:
              the token is read via onToken and sent in the JSON body, so it
              does not need the hidden FormData input. */}
          {needsTurnstile && (
            <div className="mt-6 w-80">
              <TurnstileWidget
                resetRef={turnstileResetRef}
                onVerified={setTurnstileVerified}
                onToken={setTurnstileToken}
              />
            </div>
          )}
          {message && (
            <div
              className={`mt-2 px-3 py-2 rounded text-xs ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        .email-slider {
          animation: emailSlideIn 160ms ease-out;
        }

        @keyframes emailSlideIn {
          from {
            opacity: 0;
            transform: translateX(12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
