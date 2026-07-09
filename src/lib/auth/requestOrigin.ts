import type { NextRequest } from 'next/server';
import { getSiteUrl } from '@/lib/siteUrl';

/**
 * The app's public origin as seen by the user's browser.
 *
 * Behind the Cloudflare tunnel, `request.nextUrl.origin` resolves to the
 * container's bind address (`https://0.0.0.0:3000`) — sending that as an
 * OAuth redirect_uri breaks Microsoft sign-in with AADSTS50011. Derive the
 * origin from proxy headers instead, falling back to the configured site
 * URL, and keep plain-http localhost working for dev.
 */
export function getRequestOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');

  if (!host || host.startsWith('0.0.0.0') || host.startsWith('[::]')) {
    return getSiteUrl();
  }

  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = request.headers.get('x-forwarded-proto') ?? (isLocal ? 'http' : 'https');
  return `${proto}://${host}`;
}
