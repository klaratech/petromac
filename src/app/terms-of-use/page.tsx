import Link from "next/link";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-brand hover:text-brand/80 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Terms of Use
        </h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Agreement to Terms
          </h2>
          <p className="text-slate-700 mb-4">
            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this website.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Use of Website
          </h2>
          <p className="text-slate-700 mb-4">
            This website is provided for informational purposes regarding Petromac's products and services. You may use this website for lawful purposes only. You agree not to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Use the website in any way that violates any applicable law or regulation</li>
            <li>Attempt to gain unauthorized access to any portion of the website</li>
            <li>Interfere with or disrupt the website or servers or networks connected to the website</li>
            <li>Use any automated system to access the website</li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Intellectual Property
          </h2>
          <p className="text-slate-700 mb-4">
            The content, features, and functionality of this website, including but not limited to text, graphics, logos, images, and software, are owned by Petromac and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Disclaimer of Warranties
          </h2>
          <p className="text-slate-700 mb-4">
            This website is provided "as is" and "as available" without any warranties of any kind, either express or implied. Petromac does not warrant that the website will be uninterrupted, timely, secure, or error-free.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Limitation of Liability
          </h2>
          <p className="text-slate-700 mb-4">
            In no event shall Petromac be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the website.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Links to Third-Party Websites
          </h2>
          <p className="text-slate-700 mb-4">
            This website may contain links to third-party websites. These links are provided for your convenience only. Petromac has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party websites.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Changes to Terms
          </h2>
          <p className="text-slate-700 mb-4">
            We reserve the right to modify these terms at any time. Your continued use of the website following any changes indicates your acceptance of the new terms.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Contact Information
          </h2>
          <p className="text-slate-700 mb-4">
            If you have any questions about these Terms of Use, please contact us through our{" "}
            <Link href="/contact" className="text-brand hover:text-brand/80">
              contact page
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
