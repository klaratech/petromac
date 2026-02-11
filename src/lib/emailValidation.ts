import type { NextRequest } from 'next/server';

export function parseEnvList(value?: string) {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isOriginAllowed(req: NextRequest) {
  const allowedOrigins = parseEnvList(process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_BASE_URL);
  if (allowedOrigins.length === 0) return true;

  const raw = req.headers.get('origin') || req.headers.get('referer');
  if (!raw) return false;

  let incoming: string;
  try {
    incoming = new URL(raw).hostname;
  } catch {
    return false;
  }

  return allowedOrigins.some((allowed) => {
    try {
      return new URL(allowed).hostname === incoming;
    } catch {
      return false;
    }
  });
}

export function isRecipientAllowed(email: string, defaultRecipient?: string | null) {
  const allowedRecipients = parseEnvList(process.env.ALLOWED_EMAIL_RECIPIENTS);
  const allowedDomains = parseEnvList(process.env.ALLOWED_EMAIL_DOMAINS);

  if (allowedRecipients.length === 0 && allowedDomains.length === 0) {
    return defaultRecipient ? email === defaultRecipient : false;
  }

  if (allowedRecipients.includes(email)) return true;

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  return allowedDomains.map((d) => d.toLowerCase()).includes(domain);
}

export function allowlistsConfigured() {
  const allowedRecipients = parseEnvList(process.env.ALLOWED_EMAIL_RECIPIENTS);
  const allowedDomains = parseEnvList(process.env.ALLOWED_EMAIL_DOMAINS);
  return allowedRecipients.length > 0 || allowedDomains.length > 0;
}
