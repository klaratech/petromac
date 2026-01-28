import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { SuccessStoriesFilters } from '@/features/success-stories/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject = 'Petromac Success Stories', filters } = body as {
      to?: string;
      subject?: string;
      filters?: SuccessStoriesFilters;
    };

    // Validate email address
    const recipientEmail = to || process.env.CONTACT_TO_EMAIL;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email address is required' },
        { status: 400 }
      );
    }

    // Check for SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Generate filtered PDF
    const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pdf/success-stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters, mode: 'download' }),
    });

    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF for email');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Prepare email content
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
      text: `Please find attached the Petromac Success Stories PDF.

${filterSummary ? `Applied Filters:\n${filterSummary}` : ''}

Best regards,
Petromac Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Petromac Success Stories</h2>
          <p>Please find attached the Success Stories PDF document.</p>
          ${filterSummary ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Applied Filters:</h3>
              <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${filterSummary}</pre>
            </div>
          ` : ''}
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

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
