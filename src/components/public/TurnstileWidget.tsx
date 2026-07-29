'use client';

import { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile — warmed on FIRST INTERACTION, consumed on submit.
 *
 * Nothing happens on mount: no script, no challenge, no token. The parent calls
 * `warmRef.current()` when the user first focuses or types in the form, which
 * loads the script and runs the challenge in the background. By the time they
 * finish writing, a token is already in hand, so `getTokenRef.current()` at
 * submit usually returns instantly.
 *
 * Why this shape (three iterations got here on 28 Jul 2026):
 * 1. Verify-on-mount + gate the submit button. Fragile — the fail-open grace
 *    latched, so the gate only ever worked for the FIRST submit, and an
 *    invisible widget can't explain why Send is disabled.
 * 2. Challenge on submit. Correct but slow: Send waited for script download AND
 *    the challenge before the POST even began. It also still loaded ~128 KB of
 *    Turnstile on every page view, costing the homepage LCP 3.8s → 6.6s, because
 *    "mounting is free" was wrong — the challenge doesn't run, but the script
 *    still downloads.
 * 3. This: warm on interaction. No page-load cost (nobody who doesn't touch the
 *    form pays anything) AND no submit latency.
 *
 * Two invariants worth keeping:
 * - Never render the container with `display:none`. Turnstile cannot run a
 *   challenge inside a hidden element, and an `:empty`-based rule deadlocks it
 *   permanently. That broke every send earlier the same day.
 * - Tokens are SINGLE-USE and expire (~5 min), so a long message can outlive
 *   its token. `expired-callback` re-warms, and `getToken()` still falls back to
 *   execute-and-await when nothing fresh is banked — otherwise a slow send would
 *   become a failed one.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
/** Generous: a real interactive challenge can legitimately take a while. */
const TOKEN_TIMEOUT_MS = 30_000;
/** Cloudflare tokens last ~300s; bank ours well inside that. */
const TOKEN_MAX_AGE_MS = 240_000;

export const turnstileConfigured = Boolean(SITE_KEY);

/** Resolves with a token, or '' if verification is unavailable. */
export type GetTurnstileToken = () => Promise<string>;
/** Fire-and-forget: start loading + solving in the background. */
export type WarmTurnstile = () => void;

interface TurnstileApi {
  render: (_el: HTMLElement, _opts: Record<string, unknown>) => string;
  reset: (_widgetId: string) => void;
  execute: (_widgetIdOrEl: string | HTMLElement, _opts?: Record<string, unknown>) => void;
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
  getTokenRef,
  warmRef,
  theme = 'dark',
  className,
}: {
  getTokenRef?: React.MutableRefObject<GetTurnstileToken | null>;
  warmRef?: React.MutableRefObject<WarmTurnstile | null>;
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const readyRef = useRef<Promise<void> | null>(null);
  const waitersRef = useRef<((_token: string) => void)[]>([]);
  const bankedRef = useRef<{ token: string; at: number } | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const settle = (token: string) => {
      if (token) bankedRef.current = { token, at: Date.now() };
      const waiters = waitersRef.current;
      waitersRef.current = [];
      waiters.forEach((resolve) => resolve(token));
    };

    /** Load + render once. execution:'execute' means this alone solves nothing. */
    const ensureRendered = () => {
      if (!readyRef.current) {
        readyRef.current = (async () => {
          await loadScript();
          if (cancelled || !window.turnstile || container.childElementCount > 0) return;
          widgetIdRef.current = window.turnstile.render(container, {
            sitekey: SITE_KEY,
            theme,
            execution: 'execute',
            appearance: 'interaction-only',
            callback: (token: string) => settle(token),
            'error-callback': () => settle(''),
            'timeout-callback': () => settle(''),
            // Re-warm rather than sit on a dead token: someone composing a long
            // message would otherwise submit with an expired one.
            'expired-callback': () => {
              bankedRef.current = null;
              const id = widgetIdRef.current;
              if (id && window.turnstile) {
                try {
                  window.turnstile.reset(id);
                  window.turnstile.execute(id);
                } catch {
                  /* nothing useful to do — getToken() still has its fallback */
                }
              }
            },
          });
        })();
      }
      return readyRef.current;
    };

    const execute = async () => {
      try {
        await ensureRendered();
      } catch {
        return; // script blocked or offline
      }
      const id = widgetIdRef.current;
      if (!window.turnstile || !id) return;
      try {
        window.turnstile.execute(id);
      } catch {
        /* ignored — getToken() falls back */
      }
    };

    if (warmRef) {
      warmRef.current = () => {
        // Already hold something fresh? Nothing to do.
        const banked = bankedRef.current;
        if (banked && Date.now() - banked.at < TOKEN_MAX_AGE_MS) return;
        void execute();
      };
    }

    if (getTokenRef) {
      getTokenRef.current = async () => {
        if (!SITE_KEY) return '';
        // Fast path: a token banked by the warm-up. Single-use, so consume it.
        const banked = bankedRef.current;
        if (banked && Date.now() - banked.at < TOKEN_MAX_AGE_MS) {
          bankedRef.current = null;
          return banked.token;
        }
        // Slow path: nothing fresh (never warmed, or it expired). Solve now.
        const pending = new Promise<string>((resolve) => {
          waitersRef.current.push(resolve);
          window.setTimeout(() => resolve(''), TOKEN_TIMEOUT_MS);
        });
        try {
          await ensureRendered();
        } catch {
          return '';
        }
        const id = widgetIdRef.current;
        if (!window.turnstile || !id) return '';
        try {
          // Reset first so a second submit gets a genuinely fresh token rather
          // than replaying the last, which the backend would reject.
          window.turnstile.reset(id);
          window.turnstile.execute(id);
        } catch {
          return '';
        }
        const token = await pending;
        bankedRef.current = null; // consumed
        return token;
      };
    }

    return () => {
      cancelled = true;
      settle('');
      if (warmRef) warmRef.current = null;
      if (getTokenRef) getTokenRef.current = null;
    };
  }, [getTokenRef, warmRef, theme]);

  if (!SITE_KEY) return null;
  // role="group" is required for aria-label to be valid here — a bare div is
  // a generic element, on which ARIA prohibits naming (axe:aria-prohibited-attr).
  return (
    <div ref={containerRef} role="group" aria-label="Human verification" className={className} />
  );
}
