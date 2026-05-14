const steps = [
  {
    title: "Simulate",
    text: "Load the well path, tool string, conveyance assumptions, friction, and access limits.",
  },
  {
    title: "Evaluate",
    text: "See where tension, drag, and sticking risk begin to constrain the job.",
  },
  {
    title: "Decide",
    text: "Select the configuration, contingency trigger, and go/no-go boundary before execution.",
  },
];

export default function WhatAthenaDoes() {
  return (
    <section className="bg-white px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase text-brand">
            Planning rhythm
          </p>
          <h2 className="font-heading text-3xl font-bold text-slate-900 md:text-4xl">
            Simulate. Evaluate. Decide.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg bg-slate-200 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="bg-slate-50 p-6 md:p-7">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {index + 1}
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
