import ContactForm from '@/components/public/ContactForm';

/**
 * Homepage contact section. The form component is dark-themed (it was built
 * for the /contact page), so it gets the matching dark chrome here: eyebrow +
 * heading + supporting copy on the left, form on the right. Bookends the page
 * with the dark hero at the top and flows into the slate-900 footer.
 */
export default function ContactSection() {
  return (
    <section id="contact" className="bg-slate-950 text-slate-100 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16 items-start">
          {/* Pitch + direct channels */}
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-brand font-semibold mb-3">
              Contact
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Planning a challenging well?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Questions about wireline conveyance, centralization, data quality, or risk management?
              Send us a message and the right regional manager — across Asia Pacific, the Americas,
              the Middle East, Europe and Africa — will get back to you.
            </p>

            <dl className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <dt className="sr-only">Email</dt>
                <svg
                  className="h-5 w-5 shrink-0 text-brand"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <dd>
                  <a
                    href="mailto:info@petromac.co.nz"
                    className="text-slate-300 hover:text-white font-medium transition-colors"
                  >
                    info@petromac.co.nz
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* The form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
