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
  /** Present only while the delegated Graph token is valid; lets the kiosk
   *  send emails AS the signed-in staff member. Short-lived by design — no
   *  refresh token is stored. */
  graph?: StaffGraphToken;
}
