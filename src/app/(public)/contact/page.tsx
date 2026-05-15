import ContactForm from "@/components/public/ContactForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Petromac for wireline logging solutions, product enquiries, or to request an Athena demo.",
};

const QUICK_LINKS = [
  {
    href: "/catalog",
    label: "Product catalog",
    description: "Wireline Express and Focus device range.",
  },
  {
    href: "/simulation",
    label: "Athena simulation",
    description: "See how a run is modelled before it happens.",
  },
  {
    href: "/track-record",
    label: "Track record",
    description: "Where our systems have run, worldwide.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Header band */}
        <header className="mb-10 md:mb-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-brand font-semibold mb-3">
            Contact
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Get in touch
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            Questions about our wireline conveyance and centralisation systems,
            a product enquiry, or want to see Athena in action? Send us a
            message and the right person will get back to you.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Form — primary column */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          {/* Info sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Direct email + response time */}
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-brand font-semibold mb-2">
                Email us directly
              </p>
              <a
                href="mailto:info@petromac.co.nz"
                className="font-medium text-brand hover:underline break-all"
              >
                info@petromac.co.nz
              </a>
              <p className="text-sm text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                We read every enquiry and typically reply within one to two
                business days.
              </p>
            </div>

            {/* Quick links */}
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-brand font-semibold mb-3">
                Explore
              </p>
              <div className="space-y-1">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group -mx-2 block rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-brand transition-colors">
                        {link.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-brand opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      >
                        →
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
