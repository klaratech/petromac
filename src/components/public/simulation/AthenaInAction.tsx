const outputs = [
  {
    label: "Max surface tension",
    value: "18.4 klbf",
    note: "below cable limit",
  },
  {
    label: "Primary risk interval",
    value: "7,820-8,140 ft",
    note: "high dogleg contact",
  },
  {
    label: "Recommended change",
    value: "Pathfinder + HTEN",
    note: "improves reach margin",
  },
];

export default function AthenaInAction() {
  return (
    <section id="simulation-output" className="bg-white px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="mb-3 text-xs uppercase text-brand font-semibold">
            Job risk, made visible
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-5">
            Know where the run gets difficult before it gets expensive.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Hermes&trade; turns the well profile, tool string, friction assumptions,
            and conveyance options into a planning view engineers can act on:
            tension behavior, risk intervals, pass/fail margins, and configuration
            comparisons.
          </p>

          <div className="mt-8 border-l-4 border-brand pl-5">
            <p className="font-heading text-xl font-bold text-slate-900">
              Avoid sticking events before the job begins.
            </p>
            <p className="mt-2 text-slate-600">
              Then decide whether to proceed, change centralisation, adjust the
              tool string, or define a contingency trigger.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950 p-4 shadow-2xl ring-1 ring-slate-200">
          <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase text-blue-300 font-semibold">
                  Hermes simulation output
                </p>
                <h3 className="font-heading text-xl font-bold text-white">
                  Tension and sticking-risk profile
                </h3>
              </div>
              <span className="w-fit rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Scenario B recommended
              </span>
            </div>

            <div
              className="relative mt-6 h-72 overflow-hidden rounded-md border border-slate-800 bg-slate-950"
              role="img"
              aria-label="Illustrative Hermes output showing tension rising through a high-risk interval before a recommended configuration lowers the risk."
            >
              <div
                className="absolute inset-0 opacity-45"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.18) 1px, transparent 1px)",
                  backgroundSize: "56px 44px",
                }}
              />
              <div className="absolute left-6 right-6 top-8 h-px bg-red-400/50" />
              <div className="absolute right-7 top-5 text-xs font-semibold text-red-300">
                cable limit
              </div>
              <div className="absolute left-[58%] top-0 h-full w-20 bg-amber-400/10 ring-1 ring-amber-300/20" />
              <div className="absolute left-[58%] top-12 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-slate-950">
                risk interval
              </div>
              <div className="absolute bottom-9 left-6 right-6 h-1 rounded-full bg-slate-700" />
              <div className="absolute bottom-7 left-6 text-xs text-slate-400">
                surface
              </div>
              <div className="absolute bottom-7 right-6 text-xs text-slate-400">
                TD
              </div>

              <div className="absolute left-[8%] top-[66%] h-2 w-2 rounded-full bg-blue-300 shadow-[28px_-18px_0_0_#93c5fd,56px_-28px_0_0_#93c5fd,84px_-48px_0_0_#93c5fd,112px_-64px_0_0_#93c5fd,140px_-84px_0_0_#93c5fd,168px_-98px_0_0_#93c5fd,196px_-118px_0_0_#93c5fd,224px_-132px_0_0_#93c5fd,252px_-112px_0_0_#93c5fd,280px_-96px_0_0_#93c5fd,308px_-84px_0_0_#93c5fd,336px_-74px_0_0_#93c5fd,364px_-64px_0_0_#93c5fd]" />
              <div className="absolute left-[8%] top-[75%] h-2 w-2 rounded-full bg-emerald-300 shadow-[28px_-12px_0_0_#6ee7b7,56px_-20px_0_0_#6ee7b7,84px_-34px_0_0_#6ee7b7,112px_-46px_0_0_#6ee7b7,140px_-54px_0_0_#6ee7b7,168px_-62px_0_0_#6ee7b7,196px_-72px_0_0_#6ee7b7,224px_-76px_0_0_#6ee7b7,252px_-70px_0_0_#6ee7b7,280px_-66px_0_0_#6ee7b7,308px_-62px_0_0_#6ee7b7,336px_-58px_0_0_#6ee7b7,364px_-54px_0_0_#6ee7b7]" />
              <div className="absolute left-6 top-6 flex gap-4 text-xs">
                <span className="flex items-center gap-2 text-blue-200">
                  <span className="h-2 w-2 rounded-full bg-blue-300" />
                  baseline
                </span>
                <span className="flex items-center gap-2 text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  recommended
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {outputs.map((item) => (
                <div key={item.label} className="rounded-md border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">{item.label}</p>
                  <p className="mt-2 font-heading text-lg font-bold text-white">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
