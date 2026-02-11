import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { z } from 'zod';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { isOriginAllowed, isRecipientAllowed, allowlistsConfigured } from '@/lib/emailValidation';
import { createEmailTransport, getFromAddress } from '@/lib/email';
import { appendEmailLog } from '@/lib/emailLog';
import { FLIPBOOK_KEYS } from '@/features/flipbooks/constants';
import { getFlipbookPdfPath } from '@/features/flipbooks/services/flipbookManifest.server';
import type { SuccessStoriesFilters } from '@/features/success-stories/types';
import { generateSuccessStoriesPdf } from '@/features/success-stories/services/successStoriesPdf.server';

const filtersSchema = z.object({
  areas: z.array(z.string()).optional(),
  companies: z.array(z.string()).optional(),
  techs: z.array(z.string()).optional(),
});

const sendPdfSchema = z.object({
  email: z.string().email('Invalid email address').max(320),
  pdfType: z.enum(['catalog', 'success-stories']),
  pageNumbers: z.array(z.number().int().positive()).optional(),
  filters: filtersSchema.optional(),
});

const RATE_LIMIT = { limit: 3, windowMs: 60_000 };

function buildDownloadFilename(filters?: SuccessStoriesFilters): string {
  const parts: string[] = ['petromac', 'successstories'];

  const appendFilters = (values?: string[]) => {
    if (!values || values.length === 0) return;
    const normalized = values
      .map((value) =>
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
      .filter(Boolean)
      .join('-');
    if (normalized) parts.push(normalized);
  };

  appendFilters(filters?.areas);
  appendFilters(filters?.companies);
  appendFilters(filters?.techs);

  const date = new Date().toISOString().slice(0, 10);
  parts.push(date);

  return `${parts.join('_')}.pdf`;
}

function buildCatalogFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `petromac_catalog_${date}.pdf`;
}

export async function POST(req: NextRequest) {
  try {
    if (!isOriginAllowed(req)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    const ip = getClientIp(req.headers);
    const rate = rateLimit(`email-send-pdf:${ip}`, RATE_LIMIT);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } }
      );
    }

    if (!allowlistsConfigured()) {
      return NextResponse.json(
        {
          error:
            'Email allowlist not configured. Set ALLOWED_EMAIL_DOMAINS or ALLOWED_EMAIL_RECIPIENTS in the environment.',
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsed = sendPdfSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { email, pdfType, pageNumbers, filters } = parsed.data;

    if (!isRecipientAllowed(email)) {
      return NextResponse.json({ error: 'Recipient not allowed' }, { status: 403 });
    }

    let pdfBuffer: Buffer;
    let pdfName: string;

    const cleanFilters: SuccessStoriesFilters = {
      ...(filters?.areas ? { areas: filters.areas } : {}),
      ...(filters?.companies ? { companies: filters.companies } : {}),
      ...(filters?.techs ? { techs: filters.techs } : {}),
    };

    if (pdfType === 'catalog') {
      pdfBuffer = await fs.readFile(getFlipbookPdfPath(FLIPBOOK_KEYS.catalog));
      pdfName = buildCatalogFilename();
    } else if (pdfType === 'success-stories') {
      if (Array.isArray(pageNumbers) && pageNumbers.length > 0) {
        const result = await generateSuccessStoriesPdf({ pageNumbers });
        pdfBuffer = Buffer.from(result.bytes);
      } else {
        pdfBuffer = await fs.readFile(getFlipbookPdfPath(FLIPBOOK_KEYS.successStories));
      }
      pdfName = buildDownloadFilename(cleanFilters);
    } else {
      return NextResponse.json({ error: 'Invalid pdfType' }, { status: 400 });
    }

    const transporter = createEmailTransport();

    const subject = pdfType === 'catalog' ? 'Petromac Product Catalog' : 'Petromac Success Stories';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Thank you for your interest in Petromac</h2>
        <p>Please find attached the ${pdfType === 'catalog' ? 'Product Catalog' : 'Success Stories'} you requested.</p>
        <p>For more information about our wireline logging solutions, please visit our website or contact us directly.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Petromac</strong><br />
          Wireline Logging Solutions<br />
          <a href="https://www.petromac.com" style="color: #1e40af;">www.petromac.com</a>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: pdfName,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await appendEmailLog({
      recipientEmail: email,
      emailType: pdfType,
      ...(pdfType === 'success-stories' && filters ? { filtersApplied: cleanFilters } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
