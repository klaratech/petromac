import Link from "next/link";

/**
 * Terms of Use body content.
 *
 * Shared between the standalone /terms route (kept for direct links and
 * SEO) and the footer slide-out drawer. Presentational only — the page
 * title and surrounding chrome are supplied by whichever wrapper renders
 * this. Source of truth: IP counsel ("T&Cs Website.docx", Craig, May
 * 2026). Per counsel, all section headings use sentence case except
 * "Intellectual Property".
 */

export const TERMS_TITLE = "Terms of Use";
export const TERMS_UPDATED = "Last updated: 15 May 2026 · Version 1.5";

export default function TermsContent() {
  return (
    <div className="prose prose-lg max-w-none text-slate-700 space-y-6">
      <p>
        These Terms of Use apply to your access to and use of the Petromac
        website. By using this website, you agree to these terms. If you do not
        agree, please do not use the website.
      </p>

      <p>
        These terms do not replace any separate written agreement you may have
        with Petromac for products, services, software, projects, or
        confidential information.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
        Website information
      </h2>

      <p>
        The information on this website is provided for general business and
        technical information only. It is not a substitute for project-specific
        engineering, operational, safety, legal, or commercial advice. Any
        simulation, configuration, performance, or case-study information should
        be assessed against the actual well, tool string, operating conditions,
        and applicable procedures before use.
      </p>

      <p>
        We aim to keep the website accurate and current, but we do not guarantee
        that all content is complete, error-free, or up to date at all times.
        Petromac may update, remove, or change website content without notice.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Permitted use</h2>

      <p>
        You may view, download, and print reasonable portions of this website
        for your internal business evaluation or informational use. You must not
        copy, modify, distribute, frame, scrape, reverse engineer, or
        commercially exploit website content without Petromac&apos;s prior
        written permission.
      </p>

      <p>
        You must not use the website in a way that interferes with its
        operation, bypasses security controls, attempts unauthorised access, or
        breaches applicable law.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
        Intellectual Property
      </h2>

      <p>
        Unless otherwise stated, Petromac or its licensors own the copyright,
        trade marks, trade names, designs, graphics, files, videos, software,
        and other materials on this website. The Petromac name, logo, product
        names, and related marks must not be used without Petromac&apos;s prior
        written permission.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
        Submissions and enquiries
      </h2>

      <p>
        If you send us an enquiry, request, technical information, well data, or
        other material through the website, you confirm that you have the right
        to do so. Unless we have a separate written confidentiality agreement
        with you, website submissions should not be treated as confidential.
      </p>

      <p>
        You retain ownership of information you provide. You allow Petromac to
        use that information as reasonably needed to respond to you, assess your
        request, provide requested materials, prepare simulations or
        recommendations, keep business records, and protect our legal rights.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
        Petromac software and staff areas
      </h2>

      <p>
        Access to Athena, staff intranet pages, kiosk workflows, or any Petromac
        software may require authorisation and may be subject to separate terms.
        You must not access those systems unless you are authorised to do so,
        and you must not copy, sell, modify, decompile, reverse engineer, or
        create derivative works from any Petromac software or materials accessed
        through this website without Petromac&apos;s prior written permission.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Privacy</h2>

      <p>
        Our handling of personal information is described in our{" "}
        <Link href="/privacy" className="text-brand hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
        Third-party links
      </h2>

      <p>
        This website may link to third-party websites or services. Petromac is
        not responsible for the content, security, availability, or privacy
        practices of those third-party sites.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Disclaimers</h2>

      <p>
        To the fullest extent permitted by law, this website and its content are
        provided on an &quot;as is&quot; and &quot;as available&quot; basis.
        Petromac excludes all warranties, representations, and conditions that
        are not expressly stated in these terms.
      </p>

      <p>
        Nothing in these terms limits any rights or remedies that cannot
        lawfully be excluded, including under applicable consumer, fair trading,
        privacy, or other mandatory laws.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Liability</h2>

      <p>
        To the fullest extent permitted by law, Petromac is not liable for any
        loss, damage, cost, or expense arising from use of this website or
        reliance on its content, including any indirect, incidental, special,
        consequential, punitive, or loss-of-profit damages.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
        Compliance with laws
      </h2>

      <p>
        You are responsible for using the website and any materials obtained
        from it in compliance with applicable laws, including export control,
        sanctions, intellectual property, privacy, and safety requirements where
        relevant.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">Governing law</h2>

      <p>
        These terms are governed by the laws of New Zealand. The New Zealand
        courts have non-exclusive jurisdiction over disputes relating to these
        terms or this website.
      </p>

      <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
        Changes to these terms
      </h2>

      <p>
        We may update these terms from time to time. The date of the latest
        update is shown below. Continued use of the website after an update
        means you accept the updated terms.
      </p>

      <p className="text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
        {TERMS_UPDATED}
      </p>
    </div>
  );
}
