'use server';

import { setEmailConfig, getEmailConfig } from '@/lib/emailLog';

export async function updateEventTag(formData: FormData) {
  const event = formData.get('event')?.toString().trim() || null;
  await setEmailConfig({ currentEvent: event });
}

export async function clearEventTag() {
  await setEmailConfig({ currentEvent: null });
}

export async function fetchEmailConfig() {
  return getEmailConfig();
}
