import ContactForm from '@/components/public/ContactForm';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with Petromac for wireline logging solutions, product enquiries, or to request an Athena demo.',
  path: '/contact',
});

/** Right-column sitemap — grouped so the contact page doubles as a way in. */
const SITEMAP: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About Petromac' },
      { href: '/team', label: 'Team' },
      { href: '/track-record', label: 'Track record' },
    ],
  },
  {
    heading: 'Products & technology',
    links: [
      { href: '/catalog', label: 'Product catalog' },
      { href: '/simulation', label: 'Athena simulation' },
      { href: '/about/patents', label: 'Patents' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { href: '/case-studies', label: 'Success stories' },
      { href: '/about/publications', label: 'Publications' },
    ],
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left half — the form */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand font-semibold mb-3">
              Contact
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Get in touch
            </h1>
            <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-8 max-w-md">
              Questions about our conveyance and centralisation systems, a product enquiry, or want
              to see Athena in action? Send us a message and the right person will get back to you.
            </p>

            <ContactForm />

            <p className="mt-8 pt-6 border-t border-slate-800 text-sm text-slate-400">
              Prefer email?{' '}
              <a
                href="mailto:info@petromac.co.nz"
                className="font-medium text-brand hover:underline"
              >
                info@petromac.co.nz
              </a>
            </p>
          </div>

          {/* Right half — sitemap */}
          <div className="lg:border-l lg:border-slate-800 lg:pl-12 xl:pl-16">
            <p className="text-xs uppercase tracking-[0.3em] text-brand font-semibold mb-6">
              Explore the site
            </p>
            <div className="space-y-8">
              {SITEMAP.map((group) => (
                <div key={group.heading}>
                  <h2 className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-3">
                    {group.heading}
                  </h2>
                  <ul className="space-y-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="group -mx-3 flex items-center justify-between rounded-lg px-3 py-2 text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                        >
                          <span className="font-medium">{link.label}</span>
                          <span
                            aria-hidden="true"
                            className="text-brand opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                          >
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
