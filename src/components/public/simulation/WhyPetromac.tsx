import Link from "next/link";

const points = [
  {
    title: "Vendor-neutral",
    text: "Planning intelligence that supports major wireline workflows without tying the recommendation to one logging provider.",
  },
  {
    title: "Engineering-led",
    text: "Hermes simulation is paired with Petromac field experience and configuration logic.",
  },
  {
    title: "Operationally useful",
    text: "Outputs are built around what changes the job: reach margin, risk intervals, configuration, and contingencies.",
  },
];

export default function WhyPetromac() {
  return (
    <section className="bg-white px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase text-brand">
              Decision support layer
            </p>
            <h2 className="font-heading text-3xl font-bold text-slate-900 md:text-4xl">
              Independent planning before hardware selection.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Athena sits above the equipment choice. It helps teams understand
              risk first, then select the conveyance and centralisation package
              that best reduces that risk.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/track-record"
                className="inline-flex items-center justify-center rounded-full border-2 border-brand px-6 py-3 font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                Explore track record
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                Browse hardware
              </Link>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg bg-slate-200 md:grid-cols-3">
            {points.map((point) => (
              <div key={point.title} className="bg-slate-50 p-5">
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  {point.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
