export interface StaffUser {
  id: string;
  name: string;
  email: string;
  givenName?: string | null;
  surname?: string | null;
  tenantId?: string | null;
  authMethod: 'microsoft';
}

export interface StaffGraphToken {
  /** Delegated Microsoft Graph access token (Mail.Send) captured at sign-in. */
  accessToken: string;
  /** Epoch ms when the access token expires (~1 h after sign-in). */
  expiresAt: number;
}

export interface StaffSession {
  user: StaffUser;
  issuedAt: number;
  expiresAt: number;
  /** Delegated Graph token for send-as-staff. Short-lived (~1 h); when it
   *  lapses, the server mints a fresh one from the encrypted refresh-token
   *  cookie (see lib/auth/staffAuth `readRefreshTokenCookie`). */
  graph?: StaffGraphToken;
}
