"use client";

/**
 * "See Athena in action" — screen-recording demo section for the
 * Simulation page. Sits directly under the hero so visitors see the
 * software working before they read another word about it.
 *
 * ASSET PLACEHOLDERS (drop files in, the section picks them up):
 *   /public/videos/athena-demo.mp4        Main 60–90s walkthrough
 *                                         (build string → parameters →
 *                                          results → graphs → change & re-run)
 *   /public/images/athena-demo-poster.jpg Still frame shown before play
 *
 * Until the video lands, the player shows a styled placeholder with the
 * expected path. The three step cards below narrate the demo and don't
 * depend on any asset.
 */

const STEPS = [
  {
    n: "01",
    title: "Simulate",
    body: "Build the tool string, add conveyance and centralisation, and set the well parameters.",
  },
  {
    n: "02",
    title: "Evaluate",
    body: "Run the job and read cable tension, drag, and jarring-confidence results against the well profile.",
  },
  {
    n: "03",
    title: "Decide",
    body: "Change a parameter, re-run, compare configurations — and make the go / no-go call before the rig clock starts.",
  },
];

export default function AthenaInAction() {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-brand font-semibold mb-3">
            See it in action
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Watch Athena plan a job
          </h2>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            From an empty tool string to a go / no-go call — in about a
            minute.
          </p>
        </div>

        {/* Video player */}
        <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-slate-300 bg-slate-900 shadow-2xl">
          {/* Placeholder layer — visible until the video file exists or if
              it fails to load. */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 px-6 text-center">
            <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 ring-1 ring-white/20">
              <svg
                className="w-7 h-7 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <p className="text-sm font-medium text-slate-300">
              Athena demo
            </p>
            <code className="text-xs text-slate-500">
              drop video at /videos/athena-demo.mp4
            </code>
          </div>

          {/* The actual player. Sits above the placeholder; hides itself
              on error so the placeholder shows through. */}
          <video
            src="/videos/athena-demo.mp4"
            poster="/images/athena-demo-poster.jpg"
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLVideoElement).style.display = "none";
            }}
          />
        </div>

        {/* Simulate / Evaluate / Decide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-6"
            >
              <span className="font-heading text-sm font-bold text-brand">
                {s.n}
              </span>
              <h3 className="font-heading text-lg font-bold text-slate-900 mt-2 mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
