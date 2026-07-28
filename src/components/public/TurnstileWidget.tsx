'use client';

import { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile widget (managed mode) for the contact form.
 *
 * - Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, so dev
 *   and staging work without keys (the backend also skips verification
 *   when its secret is unset — set both or neither).
 * - The api.js script loads lazily, when the widget scrolls near the
 *   viewport — the contact section sits at the bottom of every page that
 *   has it, so first paint never pays for it.
 * - Turnstile injects a hidden `cf-turnstile-response` input into the
 *   surrounding <form>, which ContactForm's FormData picks up untouched.
 * - Tokens are single-use: pass `resetRef` and call it after each submit
 *   attempt so the next submit gets a fresh token.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Whether this build has Turnstile enabled (site key baked in). */
export const turnstileConfigured = Boolean(SITE_KEY);

interface TurnstileApi {
  render: (_el: HTMLElement, _opts: Record<string, unknown>) => string;
  reset: (_widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.addEventListener('load', () => resolve());
    s.addEventListener('error', reject);
    document.head.appendChild(s);
  });
}

export default function TurnstileWidget({
  resetRef,
  onVerified,
}: {
  resetRef?: React.MutableRefObject<(() => void) | null>;
  /** Called with true when a token is issued, false when it expires/errors. */
  onVerified?: ((_ok: boolean) => void) | undefined;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;
    const container = containerRef.current;
    let widgetId: string | null = null;
    let cancelled = false;

    const render = async () => {
      try {
        await loadScript();
        if (cancelled || !window.turnstile || container.childElementCount > 0) return;
        widgetId = window.turnstile.render(container, {
          sitekey: SITE_KEY,
          theme: 'dark',
          appearance: 'always',
          callback: () => onVerified?.(true),
          'expired-callback': () => onVerified?.(false),
          'error-callback': () => onVerified?.(false),
        });
        if (resetRef) {
          resetRef.current = () => {
            if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
            onVerified?.(false);
          };
        }
      } catch {
        /* script blocked/offline — backend will reject; the form's error
           path (with the direct email address) covers the user */
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void render();
        }
      },
      { rootMargin: '400px' }
    );
    io.observe(container);
    return () => {
      cancelled = true;
      io.disconnect();
      if (resetRef) resetRef.current = null;
    };
  }, [resetRef, onVerified]);

  if (!SITE_KEY) return null;
  // role="group" is required for aria-label to be valid here — a bare div is
  // a generic element, on which ARIA prohibits naming (axe:aria-prohibited-attr).
  return <div ref={containerRef} role="group" aria-label="Human verification" />;
}
