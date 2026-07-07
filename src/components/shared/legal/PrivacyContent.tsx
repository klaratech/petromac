/**
 * Privacy Policy body content.
 *
 * Shared between the standalone /privacy route (kept for direct links and
 * SEO) and the footer slide-out drawer. Presentational only — the page
 * title and surrounding chrome are supplied by whichever wrapper renders
 * this. Source of truth: IP counsel ("Privacy Policy Website.docx",
 * Craig, May 2026).
 */

export const PRIVACY_TITLE = 'Privacy Policy';
export const PRIVACY_UPDATED = 'Last updated: 15 May 2026 · Version 2.3';

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
          Email addresses entered to receive catalogues, success stories, or other Petromac
          documents.
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
        We use cookies and similar technologies where needed for website functionality, security,
        staff sign-in, and session management. For example, staff intranet sign-in may use secure
        session and OAuth state cookies. You can disable cookies in your browser, but some features
        may not work properly.
      </p>

      <p>
        We use Google Analytics to understand website performance and visitor trends, such as which
        pages are visited, approximate location, and device and browser type. Google Analytics sets
        its own cookies and may process this information outside New Zealand. We may also use
        Cloudflare for website security, performance, and traffic analytics. Where required by
        applicable law, we will provide any additional notice or consent mechanism needed for these
        tools, and you can opt out of Google Analytics using the browser add-on Google provides.
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
