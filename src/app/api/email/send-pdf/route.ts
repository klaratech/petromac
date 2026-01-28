import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

const RATE_LIMIT = { limit: 3, windowMs: 60_000 };

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

function isRecipientAllowed(email: string) {
  const allowedRecipients = parseEnvList(process.env.ALLOWED_EMAIL_RECIPIENTS);
  const allowedDomains = parseEnvList(process.env.ALLOWED_EMAIL_DOMAINS);

  if (allowedRecipients.length === 0 && allowedDomains.length === 0) {
    return false;
  }

  if (allowedRecipients.includes(email)) return true;

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  return allowedDomains.map((d) => d.toLowerCase()).includes(domain);
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

    const { email, pdfType } = await req.json();

    if (!email || !pdfType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isRecipientAllowed(email)) {
      return NextResponse.json({ error: 'Recipient not allowed' }, { status: 403 });
    }

    let pdfPath: string;
    let pdfName: string;

    if (pdfType === 'catalog') {
      pdfPath = path.join(process.cwd(), 'public', 'data', 'product-catalog.pdf');
      pdfName = 'Petromac-Product-Catalog.pdf';
    } else if (pdfType === 'success-stories') {
      pdfPath = path.join(process.cwd(), 'public', 'data', 'successstories.pdf');
      pdfName = 'Petromac-Success-Stories.pdf';
    } else {
      return NextResponse.json({ error: 'Invalid pdfType' }, { status: 400 });
    }

    const pdfBuffer = await fs.readFile(pdfPath);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

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
      from: process.env.EMAIL_FROM,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
