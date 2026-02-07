import { readEmailLog, getEmailConfig } from '@/lib/emailLog';
import { EmailLogClient } from './EmailLogClient';

export const dynamic = 'force-dynamic';

export default async function EmailLogPage() {
  const [entries, config] = await Promise.all([readEmailLog(), getEmailConfig()]);

  return <EmailLogClient entries={entries} currentEvent={config.currentEvent} />;
}
