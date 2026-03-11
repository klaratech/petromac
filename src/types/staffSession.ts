export interface StaffUser {
  id: string;
  name: string;
  email: string;
  givenName?: string | null;
  surname?: string | null;
  tenantId?: string | null;
  authMethod: 'microsoft';
}

export interface StaffSession {
  user: StaffUser;
  issuedAt: number;
  expiresAt: number;
}
