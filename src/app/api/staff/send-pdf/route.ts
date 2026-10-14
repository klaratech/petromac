import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  buildSessionCookieOptions,
  clearCookieOptions,
  createRefreshTokenCookieValue,
  createStaffSessionCookieValue,
  getRefreshTokenCookieName,
  getSessionCookieName,
  getStaffGraphToken,
  readRefreshTokenCookie,
  readStaffSession,
} from '@/lib/auth/staffAuth';
import { refreshMicrosoftToken } from '@/lib/auth/entra';
import type { StaffSession } from '@/types/staffSession';
import { buildServerApiUrl } from '@/lib/api';
import { getRequestOrigin } from '@/lib/auth/requestOrigin';
import { getSiteUrl, isProductionSite } from '@/lib/siteUrl';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Sends a catalog / success-stories PDF AS the signed-in staff member, via
 * Microsoft Graph `/me/sendMail` using the delegated token captured at
 * sign-in. This is the kiosk path; the public site (no staff session) uses
 * the FastAPI `info@` sender instead.
 *
 * The tokens live in httpOnly cookies (session + refresh-token cookie) and
 * are read only here — never exposed to client JS and never sent to the
 * FastAPI backend. On a 401 the client falls back to the `info@` send.
 */
const CATALOG_PDF_PATH = '/flipbooks/catalog/petromac-product-catalog.pdf';

// A 12 h staff session on a shared trade-show tablet is the threat model:
// whoever picks the tablet up can mail PDFs AS the signed-in staff member.
// Same shape as the backend's PDF_RATE_LIMIT; keyed per staff account so one
// person can't drain another's allowance.
const SEND_RATE_LIMIT = { limit: 5, windowMs: 60_000 };

/**
 * Same-origin check, mirroring the backend's `is_origin_allowed`: a browser
 * sends `Origin` on every cross-site POST and on same-origin fetches, so a
 * request from another site (or a bare curl replaying a stolen cookie) is
 * refused. In production the configured site URL is authoritative; on
 * test/dev the request's own origin is accepted so the staging host works.
 */
function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const allowed = new Set([getRequestOrigin(request)]);
  if (isProductionSite()) allowed.add(getSiteUrl());
  try {
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
  }

  const cookieStore = await cookies();
  const session = readStaffSession(cookieStore);
  if (!session) {
    return NextResponse.json({ error: 'no_staff_session' }, { status: 401 });
  }

  const clientIp =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  const rate = checkRateLimit(
    `staff-send-pdf:${session.user.email.toLowerCase()}`,
    SEND_RATE_LIMIT.limit,
    SEND_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    );
  }

  // Valid access token in the session? Use it. Otherwise mint a fresh one
  // from the refresh-token cookie (survives server restarts for the whole
  // 12 h session) and rotate both cookies on the way out.
  let token = getStaffGraphToken(session);
  let refreshedSession: StaffSession | null = null;
  let rotatedRefreshToken: string | null = null;
  if (!token) {
    const refreshToken = readRefreshTokenCookie(
      cookieStore.get(getRefreshTokenCookieName())?.value
    );
    if (!refreshToken) {
      return NextResponse.json({ error: 'no_staff_session' }, { status: 401 });
    }
    try {
      const fresh = await refreshMicrosoftToken(refreshToken);
      token = fresh.access_token;
      if (fresh.refresh_token) {
        // Microsoft rotates refresh tokens — keep the newest one.
        rotatedRefreshToken = fresh.refresh_token;
      }
      refreshedSession = {
        ...session,
        graph: {
          accessToken: fresh.access_token,
          expiresAt: Date.now() + (fresh.expires_in ?? 3600) * 1000,
        },
      };
    } catch {
      // Refresh token revoked/expired — drop the dead cookie and fall back
      // to info@.
      const response = NextResponse.json({ error: 'no_staff_session' }, { status: 401 });
      response.cookies.set(getRefreshTokenCookieName(), '', clearCookieOptions());
      return response;
    }
  }

  let body: {
    email?: string;
    pdfType?: string;
    pageNumbers?: number[];
    filters?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const recipient = String(body.email ?? '').trim();
  const pdfType = body.pdfType === 'catalog' ? 'catalog' : 'success-stories';
  if (!recipient || !recipient.includes('@') || recipient.length > 320) {
    return NextResponse.json({ error: 'invalid_recipient' }, { status: 400 });
  }

  // --- Build the attachment bytes ---
  let pdfBytes: ArrayBuffer;
  let filename: string;
  try {
    if (pdfType === 'catalog') {
      const res = await fetch(new URL(CATALOG_PDF_PATH, getRequestOrigin(request)), {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`catalog pdf ${res.status}`);
      pdfBytes = await res.arrayBuffer();
      filename = 'petromac-product-catalog.pdf';
    } else {
      // Filtered success-stories PDF is built by the FastAPI backend. That
      // endpoint enforces origin validation, so a server-to-server call needs
      // an allowed Origin header (there's none otherwise).
      const res = await fetch(buildServerApiUrl('/api/pdf/success-stories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: getRequestOrigin(request),
          // The backend keys its PDF rate limit on the caller's IP. Without
          // this, every staff send shared ONE bucket (the frontend
          // container's address) — 5 per minute for the whole company.
          'X-Real-IP': clientIp,
        },
        body: JSON.stringify({ pageNumbers: body.pageNumbers, mode: 'download' }),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`success-stories pdf ${res.status}`);
      pdfBytes = await res.arrayBuffer();
      filename = 'petromac-success-stories.pdf';
    }
  } catch {
    return NextResponse.json({ error: 'pdf_build_failed' }, { status: 502 });
  }

  const contentBytes = Buffer.from(pdfBytes).toString('base64');
  const label = pdfType === 'catalog' ? 'Product Catalog' : 'Success Stories';

  // --- Send as the staff member ---
  const graphBody = {
    message: {
      subject: `Petromac ${label}`,
      body: {
        contentType: 'HTML',
        content: `<p>Hi,</p><p>Please find the Petromac ${label} attached.</p><p>${session.user.name}<br/>Petromac</p>`,
      },
      toRecipients: [{ emailAddress: { address: recipient } }],
      attachments: [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: filename,
          contentType: 'application/pdf',
          contentBytes,
        },
      ],
    },
    saveToSentItems: true,
  };

  const graphRes = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(graphBody),
    cache: 'no-store',
  });

  if (!graphRes.ok) {
    // 401/403 from Graph (token expired between the session check and now, or
    // consent missing) → let the client retry via the info@ sender.
    const status = graphRes.status === 401 || graphRes.status === 403 ? 401 : 502;
    return NextResponse.json({ error: 'graph_send_failed' }, { status });
  }

  const response = NextResponse.json({ ok: true, sentAs: session.user.email });
  if (refreshedSession) {
    // Persist the freshly minted access token so the next send within the
    // hour skips the refresh round-trip. Same cookie-size guard as sign-in:
    // if the token pushes past the ~4 KB limit, skip the update — the
    // refresh-token cookie alone keeps future sends refreshable.
    const remainingSeconds = Math.max(
      60,
      Math.floor((refreshedSession.expiresAt - Date.now()) / 1000)
    );
    const cookieValue = createStaffSessionCookieValue(refreshedSession);
    if (cookieValue.length <= 3800) {
      response.cookies.set(
        getSessionCookieName(),
        cookieValue,
        buildSessionCookieOptions(remainingSeconds)
      );
    }
    if (rotatedRefreshToken) {
      const refreshCookieValue = createRefreshTokenCookieValue(
        rotatedRefreshToken,
        refreshedSession.expiresAt
      );
      if (refreshCookieValue.length <= 3800) {
        response.cookies.set(
          getRefreshTokenCookieName(),
          refreshCookieValue,
          buildSessionCookieOptions(remainingSeconds)
        );
      }
    }
  }
  return response;
}
