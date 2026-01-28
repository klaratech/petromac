import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { SuccessStoriesFilters } from '@/features/success-stories/types';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

const RATE_LIMIT = { limit: 5, windowMs: 60_000 };

function parseEnvList(value?: string) {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isOriginAllowed(req: NextRequest) {
  const allowedOrigins = parseEnvList(process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_BASE_URL);
  if (allowedOrigins.length === 0) return true;

  const origin = req.headers.get('origin') || req.headers.get('referer');
  if (!origin) return true;

  return allowedOrigins.some((allowed) => origin.startsWith(allowed));
}

function isRecipientAllowed(email: string, defaultRecipient?: string | null) {
  const allowedRecipients = parseEnvList(process.env.ALLOWED_EMAIL_RECIPIENTS);
  const allowedDomains = parseEnvList(process.env.ALLOWED_EMAIL_DOMAINS);

  if (allowedRecipients.length === 0 && allowedDomains.length === 0) {
    // Allow only the default recipient when allowlists are unset.
    return defaultRecipient ? email === defaultRecipient : false;
  }

  if (allowedRecipients.includes(email)) return true;

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  return allowedDomains.map((d) => d.toLowerCase()).includes(domain);
}

function allowlistsConfigured() {
  const allowedRecipients = parseEnvList(process.env.ALLOWED_EMAIL_RECIPIENTS);
  const allowedDomains = parseEnvList(process.env.ALLOWED_EMAIL_DOMAINS);
  return allowedRecipients.length > 0 || allowedDomains.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    if (!isOriginAllowed(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    const ip = getClientIp(request.headers);
    const rate = rateLimit(`email-send:${ip}`, RATE_LIMIT);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { to, subject = 'Petromac Success Stories', filters } = body as {
      to?: string;
      subject?: string;
      filters?: SuccessStoriesFilters;
    };

    const defaultRecipient = process.env.CONTACT_TO_EMAIL || null;
    const recipientEmail = to || defaultRecipient;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email address is required' },
        { status: 400 }
      );
    }

    if (to && !allowlistsConfigured()) {
      return NextResponse.json(
        {
          error:
            'Recipient allowlist not configured. Set ALLOWED_EMAIL_DOMAINS or ALLOWED_EMAIL_RECIPIENTS in the environment.',
        },
        { status: 500 }
      );
    }

    if (!isRecipientAllowed(recipientEmail, defaultRecipient)) {
      return NextResponse.json({ error: 'Recipient not allowed' }, { status: 403 });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const pdfResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pdf/success-stories`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, mode: 'download' }),
      }
    );

    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF for email');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    const filterSummary = filters
      ? Object.entries(filters)
          .filter(([_, value]) => value && Array.isArray(value) && value.length > 0)
          .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
          .join('\n')
      : 'No filters applied';

    const mailOptions = {
      from: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER,
      to: recipientEmail,
      subject,
      text: `Please find attached the Petromac Success Stories PDF.\n\n${
        filterSummary ? `Applied Filters:\n${filterSummary}` : ''
      }\n\nBest regards,\nPetromac Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Petromac Success Stories</h2>
          <p>Please find attached the Success Stories PDF document.</p>
          ${
            filterSummary
              ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Applied Filters:</h3>
              <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${filterSummary}</pre>
            </div>
          `
              : ''
          }
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            Petromac Team
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'petromac-success-stories.pdf',
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
