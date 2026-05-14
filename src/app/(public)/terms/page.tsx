import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of Use for Petromac website",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-brand mb-8">Terms of Use</h1>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <p>
            These Terms of Use apply to your access to and use of the Petromac
            website. By using this website, you agree to these terms. If you do not
            agree, please do not use the website.
          </p>

          <p>
            These terms do not replace any separate written agreement you may have
            with Petromac for products, services, software, projects, or confidential
            information.
          </p>

          <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
            Website Information
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

          <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
            Permitted Use
          </h2>

          <p>
            You may view, download, and print reasonable portions of this website
            for your internal business evaluation or informational use. You must not
            copy, modify, distribute, frame, scrape, reverse engineer, or commercially
            exploit website content without Petromac&apos;s prior written permission,
            except where permitted by law.
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
            Submissions and Enquiries
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
            Petromac Software and Staff Areas
          </h2>

          <p>
            Access to Athena, staff intranet pages, kiosk workflows, or any Petromac
            software may require authorisation and may be subject to separate terms.
            You must not access those systems unless you are authorised to do so,
            and you must not copy, sell, modify, decompile, reverse engineer, or
            create derivative works from any Petromac software except where
            expressly permitted by law or by written agreement.
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
            Third-Party Links
          </h2>

          <p>
            This website may link to third-party websites or services. Petromac is
            not responsible for the content, security, availability, or privacy
            practices of those third-party sites.
          </p>

          <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
            Disclaimers
          </h2>

          <p>
            To the fullest extent permitted by law, this website and its content are
            provided on an &quot;as is&quot; and &quot;as available&quot; basis.
            Petromac excludes all warranties, representations, and conditions that
            are not expressly stated in these terms.
          </p>

          <p>
            Nothing in these terms limits any rights or remedies that cannot lawfully
            be excluded, including under applicable consumer, fair trading, privacy,
            or other mandatory laws.
          </p>

          <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
            Liability
          </h2>

          <p>
            To the fullest extent permitted by law, Petromac is not liable for any
            indirect, incidental, special, consequential, punitive, or loss-of-profit
            damages arising from use of this website or reliance on its content.
          </p>

          <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
            Compliance with Laws
          </h2>

          <p>
            You are responsible for using the website and any materials obtained
            from it in compliance with applicable laws, including export control,
            sanctions, intellectual property, privacy, and safety requirements where
            relevant.
          </p>

          <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
            Governing Law
          </h2>

          <p>
            These terms are governed by the laws of New Zealand. The New Zealand
            courts have non-exclusive jurisdiction over disputes relating to these
            terms or this website.
          </p>

          <h2 className="text-2xl font-bold text-brand mt-8 mb-4">
            Changes to These Terms
          </h2>

          <p>
            We may update these terms from time to time. The date of the latest
            update is shown below. Continued use of the website after an update
            means you accept the updated terms.
          </p>

          <p className="text-sm text-gray-600 mt-8 pt-8 border-t border-gray-200">
            Last updated: 14 May 2026 Version 1.4
          </p>
        </div>
      </div>
    </main>
  );
}
