import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_PATH = path.join(DATA_DIR, 'email-log.jsonl');
const CONFIG_PATH = path.join(DATA_DIR, 'email-config.json');

export interface EmailLogEntry {
  id: string;
  timestamp: string;
  recipientEmail: string;
  emailType: 'contact' | 'catalog' | 'success-stories';
  filtersApplied?: { areas?: string[]; companies?: string[]; techs?: string[] };
  eventTag?: string;
}

export type NewEmailLogEntry = Omit<EmailLogEntry, 'id' | 'timestamp' | 'eventTag'>;

interface EmailConfig {
  currentEvent: string | null;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as EmailConfig;
  } catch {
    return { currentEvent: null };
  }
}

export async function setEmailConfig(config: EmailConfig): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export async function appendEmailLog(entry: NewEmailLogEntry): Promise<void> {
  // No-op on Vercel — log file is only for local/kiosk use
  if (process.env.VERCEL) return;

  await ensureDataDir();

  const config = await getEmailConfig();

  const full: EmailLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
    ...(config.currentEvent ? { eventTag: config.currentEvent } : {}),
  };

  await fs.appendFile(LOG_PATH, JSON.stringify(full) + '\n', 'utf-8');
}

export async function readEmailLog(): Promise<EmailLogEntry[]> {
  try {
    const raw = await fs.readFile(LOG_PATH, 'utf-8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as EmailLogEntry);
  } catch {
    return [];
  }
}
