import Link from "next/link";

export default function BottomCTA() {
  return (
    <section className="bg-brand px-6 py-14 md:py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
          Rehearse the job before the run.
        </h2>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
          Send the well profile, tool objectives, and constraints. We&rsquo;ll return
          the risk view, assumptions, and recommended configuration.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#contact"
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-lg font-semibold text-brand shadow-lg transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand"
          >
            Request a Simulation
          </Link>
          <Link
            href="#contact"
            className="inline-flex items-center justify-center rounded-full border-2 border-white px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand"
          >
            Contact your Regional Manager
          </Link>
        </div>
      </div>
    </section>
  );
}
