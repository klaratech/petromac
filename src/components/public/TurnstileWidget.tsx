'use client';

import { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile widget (managed mode) — challenge ON SUBMIT.
 *
 * The widget is rendered in `execution: 'execute'` mode, so mounting it costs
 * nothing: no challenge runs, no token is minted, nothing is displayed. The
 * parent calls the `getTokenRef` function when the user actually submits; that
 * runs the challenge and resolves with a fresh token.
 *
 * Why this shape rather than verifying up-front (28 Jul 2026): the previous
 * version ran the challenge on mount and gated the submit button until a token
 * arrived, with a 12 s fail-open grace. That was fragile in two ways —
 * a) the grace latched, so the gate only worked for the FIRST submit, and
 * b) an invisible widget has no way to tell the user why Send is disabled, so
 * a slow or non-firing challenge just looked broken ("Verifying…" forever,
 * then "verification didn't complete").
 * Running it on submit removes the whole waiting-state problem: there is
 * nothing to gate, and the token is always fresh (they are single-use, so a
 * token minted at page load is the wrong thing to send anyway).
 *
 * Do NOT hide the container with `display:none` (e.g. Tailwind `empty:hidden`).
 * Turnstile cannot run a challenge inside a hidden element, so it never
 * injects anything, so an `:empty`-based rule stays applied — a deadlock that
 * silently breaks verification. `interaction-only` already renders nothing
 * until a challenge genuinely needs showing.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
/** Generous: a real interactive challenge can legitimately take a while. */
const TOKEN_TIMEOUT_MS = 30_000;

/** Whether this build has Turnstile enabled (site key baked in). */
export const turnstileConfigured = Boolean(SITE_KEY);

/** Resolves with a fresh token, or '' if verification is unavailable. */
export type GetTurnstileToken = () => Promise<string>;

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
  theme = 'dark',
  className,
}: {
  /**
   * Filled with a function the parent awaits on submit. Always resolves —
   * with '' when verification is unavailable (script blocked, offline). The
   * caller should still POST in that case: the backend is the judge, and it
   * no-ops when TURNSTILE_SECRET_KEY is unset, which is how dev works.
   */
  getTokenRef?: React.MutableRefObject<GetTurnstileToken | null>;
  /** Match the surrounding surface, for the rare visible-challenge case. */
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const readyRef = useRef<Promise<void> | null>(null);
  const waitersRef = useRef<((_token: string) => void)[]>([]);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;

    const settle = (token: string) => {
      const waiters = waitersRef.current;
      waitersRef.current = [];
      waiters.forEach((resolve) => resolve(token));
    };

    // Render once, lazily but eagerly enough that submit never waits on it.
    // execution:'execute' means this does NOT run a challenge or mint a token.
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
        // Nothing to do: tokens are consumed immediately after execute().
        'expired-callback': () => {},
      });
    })();

    return () => {
      cancelled = true;
      settle('');
    };
  }, [theme]);

  useEffect(() => {
    if (!getTokenRef) return;
    getTokenRef.current = async () => {
      if (!SITE_KEY) return '';
      try {
        await readyRef.current;
      } catch {
        return ''; // script blocked or offline
      }
      const widgetId = widgetIdRef.current;
      if (!window.turnstile || !widgetId) return '';

      const token = new Promise<string>((resolve) => {
        waitersRef.current.push(resolve);
        window.setTimeout(() => resolve(''), TOKEN_TIMEOUT_MS);
      });
      try {
        // Single-use tokens: reset first so a second submit gets a fresh one
        // rather than replaying the last (which the backend would reject).
        window.turnstile.reset(widgetId);
        window.turnstile.execute(widgetId);
      } catch {
        return '';
      }
      return token;
    };
    return () => {
      getTokenRef.current = null;
    };
  }, [getTokenRef]);

  if (!SITE_KEY) return null;
  // role="group" is required for aria-label to be valid here — a bare div is
  // a generic element, on which ARIA prohibits naming (axe:aria-prohibited-attr).
  return (
    <div ref={containerRef} role="group" aria-label="Human verification" className={className} />
  );
}
