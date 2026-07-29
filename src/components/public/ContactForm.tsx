'use client';

import { useEffect, useId, useRef, useState, FormEvent } from 'react';
import { buildClientApiUrl } from '@/lib/api';
import TurnstileWidget, { type GetTurnstileToken } from '@/components/public/TurnstileWidget';

/**
 * Contact form — form only, dark theme. The page chrome (heading, intro,
 * sitemap, layout) lives in the route that renders it: the /contact page
 * and the simulation page's contact section. Only the email field and
 * message are required.
 */
export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'verify-failed'>(
    'idle'
  );
  // Server-provided reason for a rejected submission (e.g. "message too
  // short") — shown instead of the generic error when available.
  const [serverError, setServerError] = useState<string | null>(null);
  const formStartTimeRef = useRef(0);
  // Unique per instance: the header's contact drawer can render a SECOND
  // ContactForm on a page that already has one (/ and /contact both do), and
  // duplicate ids break label-to-field association.
  const uid = useId();
  const nameId = `name-${uid}`;
  const emailId = `email-${uid}`;
  const messageId = `message-${uid}`;
  // Turnstile runs its challenge ON SUBMIT and hands back a fresh single-use
  // token (see TurnstileWidget). Nothing to gate before the user acts.
  const getTurnstileToken = useRef<GetTurnstileToken | null>(null);
  useEffect(() => {
    formStartTimeRef.current = Date.now();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validated here rather than with the textarea's minLength attribute: the
    // browser's native message for that is "Please lengthen this text to 10
    // characters or more", which pre-empted our own copy and is exactly the
    // robotic phrasing we were trying to avoid. Same wording as the backend's
    // check, so a visitor sees one consistent sentence either way.
    if (formData.message.trim().length < 10) {
      setServerError('Could you tell us a bit more? Your message is too short.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formDataObj = new FormData(e.currentTarget);

      const formStartTime = formStartTimeRef.current || Date.now();
      const timeTaken = (Date.now() - formStartTime) / 1000;
      formDataObj.append('_timing', timeTaken.toString());

      // Run the challenge now and set the token explicitly. In execute mode we
      // can't rely on Turnstile's hidden `cf-turnstile-response` input being
      // populated when FormData was snapshotted. '' when verification is
      // unavailable — still POST, the backend is the judge (and no-ops when
      // TURNSTILE_SECRET_KEY is unset, which is how dev works).
      const token = await getTurnstileToken.current?.();
      formDataObj.set('cf-turnstile-response', token ?? '');

      const response = await fetch(buildClientApiUrl('/api/contact'), {
        method: 'POST',
        body: formDataObj,
      });

      const result = (await response.json()) as { ok: boolean; error?: string };

      if (response.ok && result.ok) {
        setSubmitStatus('success');
        setServerError(null);
        setFormData({ name: '', email: '', message: '' });
        formStartTimeRef.current = Date.now();
      } else if (response.status === 403) {
        // Turnstile token missing/stale — a fresh widget pass usually fixes it.
        setSubmitStatus('verify-failed');
      } else {
        setServerError(result.error ?? null);
        setSubmitStatus('error');
      }
    } catch {
      setServerError(null);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field — hidden from users */}
      <input
        type="text"
        name="company"
        autoComplete="off"
        tabIndex={-1}
        className="absolute opacity-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Full name + email — side by side on wider screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor={nameId} className={labelClass}>
            Name
          </label>
          <input
            type="text"
            id={nameId}
            name="name"
            maxLength={200}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={fieldClass}
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label htmlFor={emailId} className={labelClass}>
            Email <span className="text-brand">*</span>
          </label>
          <input
            type="email"
            id={emailId}
            name="email"
            required
            aria-required="true"
            maxLength={320}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={fieldClass}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor={messageId} className={labelClass}>
          Message <span className="text-brand">*</span>
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          aria-required="true"
          maxLength={5000}
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={`${fieldClass} resize-none`}
          placeholder="Tell us about your well, tool string, or what you'd like to see — and we'll point you to the right person."
        />
      </div>

      {/* Required-field note — sits directly below the message field */}
      <p className="text-xs text-slate-500">
        <span className="text-brand">*</span> required
      </p>

      {/* Human verification (mounts only when a Turnstile site key is set).
          Invisible: the challenge runs on submit and only draws itself if
          Cloudflare demands interaction, in which case the dark theme matches
          this panel. Nothing is gated ahead of time, so there is no
          "Verifying…" wait before the user has done anything. */}
      <TurnstileWidget getTokenRef={getTurnstileToken} />

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-brand/90 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isSubmitting ? 'Sending…' : 'Send message'}
        </button>
      </div>

      {/* Status messages */}
      <div aria-live="polite">
        {submitStatus === 'success' && (
          <div
            role="alert"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            Thank you for your message — we&apos;ll get back to you soon.
          </div>
        )}
        {submitStatus === 'verify-failed' && (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300"
          >
            Human verification didn&apos;t complete — please wait a moment for the checkbox above
            the Send button, then try again. If it keeps failing, email us directly at{' '}
            <a href="mailto:info@petromac.co.nz" className="font-medium underline">
              info@petromac.co.nz
            </a>
            .
          </div>
        )}
        {submitStatus === 'error' && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {serverError ?? 'Something went wrong.'} Please try again, or email us directly at{' '}
            <a href="mailto:info@petromac.co.nz" className="font-medium underline">
              info@petromac.co.nz
            </a>
            .
          </div>
        )}
      </div>
    </form>
  );
}
