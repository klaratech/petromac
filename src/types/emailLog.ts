export interface EmailLogEntry {
  id: string;
  timestamp: string;
  recipientEmail: string;
  emailType: 'contact' | 'catalog' | 'success-stories';
  filtersApplied?: { areas?: string[]; companies?: string[]; techs?: string[] };
  eventTag?: string;
}

export interface EmailConfig {
  currentEvent: string | null;
}
