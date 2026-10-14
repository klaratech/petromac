/**
 * Open the header's ContactDrawer from anywhere on the page.
 *
 * The drawer is owned by <Header> (one instance per page). Rather than
 * threading an `openContact` prop through every section that wants a
 * contact action, a page section dispatches this DOM event and the header
 * listens. Pass a `prefill` to turn the general form into a specific ask —
 * the homepage's "Request this animation" link uses it to seed the message
 * so the visitor only has to leave an email.
 */
export const CONTACT_DRAWER_EVENT = 'petromac:open-contact';

export interface ContactPrefill {
  /** Drawer heading, replacing "Send us a message". */
  title?: string;
  /** Intro line under the heading. */
  intro?: string;
  /** Pre-written message body (the visitor can still edit it). */
  message?: string;
}

export function openContactDrawer(prefill?: ContactPrefill): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ContactPrefill>(CONTACT_DRAWER_EVENT, { detail: prefill ?? {} })
  );
}
