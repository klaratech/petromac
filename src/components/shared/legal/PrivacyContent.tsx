/**
 * Privacy Policy body content.
 *
 * Shared between the standalone /privacy route (kept for direct links and
 * SEO) and the footer slide-out drawer. Presentational only — the page
 * title and surrounding chrome are supplied by whichever wrapper renders
 * this. Source of truth: IP counsel ("Privacy Policy Website.docx",
 * Craig, May 2026).
 *
 * Cookies/analytics section REWRITTEN 28 Jul 2026, and it is now the accurate
 * one — keep it in step with the code, not with the old .docx. It previously
 * claimed "We use Google Analytics", which was inherited verbatim from the
 * WordPress site (where GA really did run) and was never true of this site:
 * no analytics of any kind was installed until Cloudflare Web Analytics went
 * in on the same date. So this is not a departure from counsel's considered
 * drafting — it is stale copy that came along with the migration.
 *
 * What it now says, and why each part matters:
 * - No cookies while browsing. Verified: zero Set-Cookie headers on / and
 *   /catalog in production.
 * - Staff-auth cookies only after an intranet sign-in, strictly necessary.
 * - Cloudflare Web Analytics is cookieless, with no fingerprinting or
 *   cross-site tracking. THIS is what lets the site run with no consent
 *   banner — so if anything cookie-setting is ever added (GA4, ad pixels,
 *   embedded media that sets cookies), this section AND the banner question
 *   both have to be revisited.
 */

export const PRIVACY_TITLE = 'Privacy Policy';
export const PRIVACY_UPDATED = 'Last updated: 28 July 2026 · Version 2.4';

export default function PrivacyContent() {
  return (
    <div className="prose prose-lg max-w-none text-slate-700 space-y-6">
      <p>
        This Privacy Policy explains how Petromac collects, uses, stores, and shares personal
        information through this website, including public pages, contact forms, document email
        tools, and staff intranet features.
      </p>

      <p>
        Petromac is based in New Zealand. We handle personal information in line with the New
        Zealand Privacy Act 2020 and, where applicable, other privacy laws that may apply to
        visitors or customers outside New Zealand.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Information we collect</h2>

      <p>
        You can browse most of this website without telling us who you are. We collect personal
        information when you choose to provide it, or where it is needed to operate and secure the
        website.
      </p>

      <h3 className="text-xl font-semibold text-brand mt-6 mb-3">Information you provide</h3>

      <ul className="list-disc pl-6 space-y-2">
        <li>Your name, email address, company, role, and contact details.</li>
        <li>
          Messages, enquiries, demo requests, simulation requests, and any well, tool, job, or
          operational details you choose to send us.
        </li>
        <li>
          Email addresses entered to receive catalogs, success stories, or other Petromac documents.
        </li>
        <li>
          Staff identity details used for intranet or kiosk workflows, such as name and email
          address from Microsoft sign-in.
        </li>
      </ul>

      <h3 className="text-xl font-semibold text-brand mt-6 mb-3">
        Information collected automatically
      </h3>

      <p>
        We may collect technical information such as IP address, browser type, device type, pages
        visited, referring page, timestamps, and security or error logs. This helps us run the
        website, prevent misuse, diagnose issues, and improve performance.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Cookies and similar technologies</h2>

      <p>
        Browsing this website sets no cookies. We do not use advertising, marketing, or cross-site
        tracking cookies, and there is nothing here to opt into or out of.
      </p>

      <p>
        The only cookies we set are for staff sign-in to our internal intranet: a secure session
        cookie, a sign-in token, and a short-lived OAuth state cookie. They are set only after a
        Petromac staff member signs in, they are strictly necessary to keep that session secure, and
        they are never used to track browsing. Cloudflare, which serves and protects this website,
        may also set a short-lived cookie to distinguish visitors from automated traffic.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Analytics</h2>

      <p>
        We use Cloudflare Web Analytics to understand basic website trends, such as which pages are
        visited, referring sites, and general country-level location. We chose it specifically
        because it is privacy-preserving: it sets no cookies, does not fingerprint your device or
        browser, and does not track you across other websites. The data is aggregated and does not
        identify you. We do not use Google Analytics.
      </p>

      <p>
        Cloudflare also provides security and performance protection for this website, which
        involves processing request information such as IP address to block malicious traffic.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">How we use personal information</h2>

      <ul className="list-disc pl-6 space-y-2">
        <li>To respond to enquiries and requests.</li>
        <li>To provide demos, simulation support, documents, or follow-up.</li>
        <li>To operate staff intranet and kiosk workflows.</li>
        <li>To send requested emails or documents.</li>
        <li>To protect the website, prevent spam, and enforce rate limits.</li>
        <li>To maintain records, improve services, and comply with law.</li>
      </ul>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Sharing personal information</h2>

      <p>
        We do not sell personal information. We may share personal information with service
        providers who help us operate the website and related systems, including hosting providers,
        email providers, Microsoft identity services, IT support, security providers, and
        professional advisers. We may also disclose information where required by law or to protect
        Petromac, our users, or others.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">International transfers</h2>

      <p>
        Some service providers or systems may store or process information outside New Zealand.
        Where we disclose personal information overseas, we take reasonable steps to ensure
        appropriate safeguards apply, consistent with the New Zealand Privacy Act 2020 and any other
        applicable requirements.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Security and retention</h2>

      <p>
        We use reasonable technical and organisational safeguards to protect personal information.
        No website or email system is completely secure, so please avoid sending highly confidential
        information unless suitable arrangements are in place.
      </p>

      <p>
        We keep personal information only for as long as reasonably needed for the purposes
        described above, unless a longer period is required and permitted by law. If a notifiable
        privacy breach occurs, we will notify the Office of the Privacy Commissioner and affected
        individuals where required by law.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Your rights</h2>

      <p>
        You may ask us to access or correct personal information we hold about you. We may need to
        verify your identity before responding. If you are in a jurisdiction with additional privacy
        rights, we will respond to those rights where they apply.
      </p>

      <p>
        If you have a privacy concern, please contact us first so we can try to resolve it. You may
        also contact the New Zealand Office of the Privacy Commissioner or your local privacy
        authority.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Contacting us</h2>

      <p>
        For privacy questions or requests, contact Petromac at{' '}
        <a href="mailto:info@petromac.co.nz" className="text-brand hover:underline">
          info@petromac.co.nz
        </a>
        .
      </p>

      <p className="text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
        {PRIVACY_UPDATED}
      </p>
    </div>
  );
}
