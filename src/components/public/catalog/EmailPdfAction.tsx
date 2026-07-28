'use client';

import { useEffect, useRef, useState } from 'react';
import { buildClientApiUrl } from '@/lib/api';
import { useStaffSession } from '@/hooks/useStaffSession';
import TurnstileWidget, { turnstileConfigured } from '@/components/public/TurnstileWidget';

const PDF_URL = '/flipbooks/catalog/petromac-product-catalog.pdf';

/**
 * Compact "Email PDF" action for the catalog sidebar. Available to everyone:
 * when a staff member is signed in with a live delegated Graph token the
 * mail goes out from THEIR mailbox (/api/staff/send-pdf → Graph /me/sendMail,
 * lands in their Sent Items); otherwise it falls back to the info@ sender on
 * the FastAPI backend — same logic as the shared EmailPdfButton, restyled
 * from the oversized pill to a quiet sidebar action.
 */
export default function EmailPdfAction() {
  const { canSendAsStaff, user } = useStaffSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorText, setErrorText] = useState('Couldn’t send. Please try again.');

  // Turnstile guards only the PUBLIC info@ path — a signed-in staff send goes
  // through /api/staff/send-pdf, where the session cookie is a stronger check
  // than a CAPTCHA. `forcePublic` covers the rare case where the staff token
  // lapses mid-session: the send 401s, we fall back to the public endpoint,
  // and the widget has to appear so the retry can carry a token.
  const [forcePublic, setForcePublic] = useState(false);
  const needsTurnstile = turnstileConfigured && (!canSendAsStaff || forcePublic);
  const turnstileResetRef = useRef<(() => void) | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileVerified, setTurnstileVerified] = useState(!turnstileConfigured);
  const [turnstileGraceOver, setTurnstileGraceOver] = useState(!turnstileConfigured);

  // Same 12 s fail-open grace as the contact form: if the script is blocked or
  // slow the button stops being held hostage, and the backend still enforces.
  useEffect(() => {
    if (!turnstileConfigured || !open) return;
    const t = window.setTimeout(() => setTurnstileGraceOver(true), 12_000);
    return () => window.clearTimeout(t);
  }, [open]);

  const sender = canSendAsStaff && user ? user.email : 'info@petromac.co.nz';
  const holdForVerification = needsTurnstile && !turnstileVerified && !turnstileGraceOver;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const base = { email, pdfUrl: PDF_URL, pdfType: 'catalog' };

    try {
      let response: Response | null = null;

      // Prefer send-as-staff. A 401 means the delegated token lapsed since
      // page load — fall through to the info@ sender rather than failing.
      if (canSendAsStaff) {
        const staffRes = await fetch('/api/staff/send-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(base),
        });
        if (staffRes.ok) {
          response = staffRes;
        } else if (staffRes.status === 401) {
          // Public fallback now needs a Turnstile token; surface the widget.
          setForcePublic(true);
        } else {
          throw new Error('staff send failed');
        }
      }

      if (!response) {
        response = await fetch(buildClientApiUrl('/api/email/send-pdf'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Token only matters on this path — the backend ignores it otherwise.
          body: JSON.stringify({ ...base, turnstileToken: turnstileToken || undefined }),
        });
        // Tokens are single-use: clear ours and re-arm the widget either way.
        turnstileResetRef.current?.();
        setTurnstileToken('');
        if (response.status === 403) {
          setErrorText('Verification didn’t complete. Please try again.');
          throw new Error('turnstile rejected');
        }
        if (!response.ok) {
          setErrorText('Couldn’t send. Please try again.');
          throw new Error('send failed');
        }
      }

      setStatus('sent');
      setEmail('');
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
      }, 2500);
    } catch {
      setStatus('error');
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-brand/30 bg-white px-4 py-2 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l2-2h14l2 2"
          />
        </svg>
        Email PDF
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="email-pdf-to" className="sr-only">
        Recipient email
      </label>
      <div className="flex items-center gap-1.5">
        <input
          id="email-pdf-to"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          maxLength={320}
          className="w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          disabled={status === 'sending' || holdForVerification}
          className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand/90 transition-colors disabled:bg-slate-300"
        >
          {status === 'sending' ? 'Sending…' : holdForVerification ? 'Verifying…' : 'Send'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setEmail('');
            setStatus('idle');
          }}
          aria-label="Cancel"
          className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      {/* Human verification — only on the public info@ path, and only when a
          site key is configured (so dev/kiosk-staff flows are untouched).
          Invisible unless Cloudflare demands interaction; light theme + a
          collapsing wrapper so it adds no visual weight to the white card. */}
      {needsTurnstile && (
        <TurnstileWidget
          resetRef={turnstileResetRef}
          onVerified={setTurnstileVerified}
          onToken={setTurnstileToken}
          theme="light"
          appearance="interaction-only"
          className="empty:hidden"
        />
      )}

      {status === 'sent' ? (
        <p className="text-xs text-emerald-600 font-medium">Sent!</p>
      ) : status === 'error' ? (
        <p className="text-xs text-red-600">{errorText}</p>
      ) : (
        <p className="text-xs text-slate-400">Sends from {sender}</p>
      )}
    </form>
  );
}
