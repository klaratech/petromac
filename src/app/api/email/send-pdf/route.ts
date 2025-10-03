import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const { email, pdfUrl, pdfType } = await req.json();

    if (!email || !pdfUrl || !pdfType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine which PDF to send
    let pdfPath: string;
    let pdfName: string;
    
    if (pdfType === 'catalog') {
      pdfPath = path.join(process.cwd(), 'public', 'data', 'product-catalog.pdf');
      pdfName = 'Petromac-Product-Catalog.pdf';
    } else {
      pdfPath = path.join(process.cwd(), 'public', 'data', 'successstories.pdf');
      pdfName = 'Petromac-Success-Stories.pdf';
    }

    // Read the PDF file
    const pdfBuffer = await fs.readFile(pdfPath);

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email content
    const subject = pdfType === 'catalog' 
      ? 'Petromac Product Catalog'
      : 'Petromac Success Stories';
    
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

    // Send email
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
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
