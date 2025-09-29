import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { FilterPayload } from '@/types/pdf';

interface EmailRequest {
  email: string;
  filters: FilterPayload;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { email, filters } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Get environment variables for email
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || smtpUser;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json(
        { error: 'Email configuration missing' },
        { status: 500 }
      );
    }

    // Generate PDF from backend
    const formData = new FormData();
    formData.append('filters_json', JSON.stringify(filters));
    formData.append('case_insensitive', 'true');

    const pdfResponse = await fetch(`${apiUrl}/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      return NextResponse.json(
        { error: `PDF generation failed: ${pdfResponse.status} ${errorText}` },
        { status: pdfResponse.status }
      );
    }

    // Get PDF as buffer
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfData = Buffer.from(pdfBuffer);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Create filter summary for email body
    const filterSummary = Object.entries(filters)
      .filter(([, value]) => value && value.length > 0)
      .map(([key, value]) => `${key}: ${value?.join(', ')}`)
      .join('\n');

    const emailSubject = 'Your Success Stories PDF Report';
    const emailText = `
Hello,

Your Success Stories PDF report has been generated with the following filters:

${filterSummary || 'No filters applied'}

Please find the PDF attached to this email.

Best regards,
Petromac Team
    `.trim();

    const emailHtml = `
      <h2>Your Success Stories PDF Report</h2>
      <p>Hello,</p>
      <p>Your Success Stories PDF report has been generated with the following filters:</p>
      <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${filterSummary || 'No filters applied'}</pre>
      <p>Please find the PDF attached to this email.</p>
      <p>Best regards,<br>Petromac Team</p>
    `;

    // Send email
    const mailOptions = {
      from: fromEmail,
      to: email.trim(),
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments: [
        {
          filename: 'success-stories.pdf',
          content: pdfData,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ ok: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('Email sending error:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('EAUTH') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Email authentication failed' },
          { status: 500 }
        );
      }
      if (error.message.includes('ECONNECTION') || error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Email server connection failed' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during email sending' },
      { status: 500 }
    );
  }
}
