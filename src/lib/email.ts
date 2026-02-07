import nodemailer from 'nodemailer';

/**
 * Creates a shared nodemailer transport using unified SMTP_* env vars.
 * All email senders (contact form, PDF emails) use this.
 */
export function createEmailTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/** Returns the "from" address for outbound emails. */
export function getFromAddress(): string {
  return process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER || '';
}
