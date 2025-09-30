import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-brand hover:text-brand/80 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Privacy Policy
        </h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Introduction
          </h2>
          <p className="text-slate-700 mb-4">
            Petromac ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Information We Collect
          </h2>
          <p className="text-slate-700 mb-4">
            We may collect personal information that you provide directly to us, such as:
          </p>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Name and contact information (email address, phone number)</li>
            <li>Professional information (company name, job title)</li>
            <li>Communications you send to us</li>
            <li>Any other information you choose to provide</li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            How We Use Your Information
          </h2>
          <p className="text-slate-700 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Respond to your inquiries and provide customer support</li>
            <li>Improve our website and services</li>
            <li>Send you technical notices and updates</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Information Sharing
          </h2>
          <p className="text-slate-700 mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as required by law or as necessary to provide our services.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Data Security
          </h2>
          <p className="text-slate-700 mb-4">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="font-heading text-2xl font-semibold text-slate-900 mt-8 mb-4">
            Contact Us
          </h2>
          <p className="text-slate-700 mb-4">
            If you have questions about this Privacy Policy, please contact us through our{" "}
            <Link href="/contact" className="text-brand hover:text-brand/80">
              contact page
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
