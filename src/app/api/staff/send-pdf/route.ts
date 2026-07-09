import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStaffGraphToken, readStaffSession } from '@/lib/auth/staffAuth';
import { buildServerApiUrl } from '@/lib/api';
import { getRequestOrigin } from '@/lib/auth/requestOrigin';

/**
 * Sends a catalog / success-stories PDF AS the signed-in staff member, via
 * Microsoft Graph `/me/sendMail` using the delegated token captured at
 * sign-in. This is the kiosk path; the public site (no staff session) uses
 * the FastAPI `info@` sender instead.
 *
 * The token lives in the httpOnly session cookie and is read only here — it
 * is never exposed to client JS and never sent to the FastAPI backend. On a
 * 401 the client falls back to the `info@` send.
 */
const CATALOG_PDF_PATH = '/flipbooks/catalog/petromac-product-catalog.pdf';

export async function POST(request: NextRequest) {
  const session = readStaffSession(await cookies());
  const token = getStaffGraphToken(session);
  if (!token || !session) {
    // No valid staff token → let the client fall back to the info@ sender.
    return NextResponse.json({ error: 'no_staff_session' }, { status: 401 });
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

  return NextResponse.json({ ok: true, sentAs: session.user.email });
}
