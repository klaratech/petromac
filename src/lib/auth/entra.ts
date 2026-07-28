import type { StaffUser } from '@/types/staffSession';

const DEFAULT_SCOPES = ['openid', 'profile', 'email', 'offline_access', 'User.Read', 'Mail.Send'];

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

interface MicrosoftProfile {
  id: string;
  displayName?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
  givenName?: string | null;
  surname?: string | null;
}

function getTenantId() {
  const tenantId = process.env.ENTRA_TENANT_ID;
  if (!tenantId) throw new Error('ENTRA_TENANT_ID is not configured');
  return tenantId;
}

function getClientId() {
  const clientId = process.env.ENTRA_CLIENT_ID;
  if (!clientId) throw new Error('ENTRA_CLIENT_ID is not configured');
  return clientId;
}

function getClientSecret() {
  const clientSecret = process.env.ENTRA_CLIENT_SECRET;
  if (!clientSecret) throw new Error('ENTRA_CLIENT_SECRET is not configured');
  return clientSecret;
}

function getScopes() {
  const configured = process.env.ENTRA_SCOPES?.split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  return configured && configured.length > 0 ? configured : DEFAULT_SCOPES;
}

function tokenEndpoint() {
  return `https://login.microsoftonline.com/${getTenantId()}/oauth2/v2.0/token`;
}

function authorizeEndpoint() {
  return `https://login.microsoftonline.com/${getTenantId()}/oauth2/v2.0/authorize`;
}

export function buildMicrosoftAuthorizeUrl(redirectUri: string, state: string, prompt?: string) {
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: getScopes().join(' '),
    state,
  });
  // No prompt (default) lets Microsoft silently SSO an already-signed-in
  // account — the user never sees the (slow, ~10 s) login page. Kiosk entry
  // points pass 'select_account' instead: on a shared tablet, silent SSO
  // would reuse the PREVIOUS staff member's session and send emails as them.
  if (prompt) params.set('prompt', prompt);

  return `${authorizeEndpoint()}?${params.toString()}`;
}

export async function exchangeMicrosoftCode(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Microsoft token exchange failed: ${response.status} ${message}`);
  }

  return (await response.json()) as TokenResponse;
}

/**
 * Exchange a refresh token for a fresh access token (and usually a rotated
 * refresh token). Used by send-as-staff when the ~1 h delegated token has
 * lapsed mid-session.
 */
export async function refreshMicrosoftToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: getScopes().join(' '),
  });

  const response = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Microsoft token refresh failed: ${response.status} ${message}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function fetchMicrosoftUser(accessToken: string): Promise<StaffUser> {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,givenName,surname',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Microsoft profile fetch failed: ${response.status} ${message}`);
  }

  const profile = (await response.json()) as MicrosoftProfile;
  const email = profile.mail || profile.userPrincipalName || '';
  if (!email) {
    throw new Error('Microsoft profile did not include an email address');
  }

  enforceAllowedDomains(email);

  return {
    id: profile.id,
    name: profile.displayName || email,
    email,
    givenName: profile.givenName || null,
    surname: profile.surname || null,
    tenantId: getTenantId(),
    authMethod: 'microsoft',
  };
}

function enforceAllowedDomains(email: string) {
  const domains = process.env.STAFF_ALLOWED_EMAIL_DOMAINS?.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!domains || domains.length === 0) return;

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || !domains.includes(domain)) {
    throw new Error(`Microsoft sign-in is restricted to: ${domains.join(', ')}`);
  }
}
