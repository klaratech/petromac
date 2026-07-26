'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Simulated Athena run — the show-and-tell inside /simulation's
 * "See it in action" section (lived in the homepage software band until
 * Jul 2026).
 *
 * All six lines are fully styled in the server-rendered HTML (SEO, no-JS,
 * reduced motion). After hydration, the first time the panel is ~40% in
 * view, it replays the transcript as a typewriter — once per page load.
 * Each line's final (styled, possibly wrapped) height is reserved by an
 * invisible copy underneath the typing overlay, so the panel never grows
 * line by line.
 */

type Run = { t: string; c?: string };

const OK = 'text-emerald-400';
const VAL = 'text-blue-300 font-semibold';
const DIM = 'text-slate-500';

const LINES: Run[][] = [
  [{ t: 'athena> ', c: DIM }, { t: 'load well  A-17  (deviation 80°, 6" open hole)' }],
  [{ t: 'athena> ', c: DIM }, { t: 'simulate descent  --toolstring MRIL-XL --taxis 4' }],
  [{ t: 'computing drag profile ............', c: 'text-slate-400' }],
  [
    { t: '✓ gravity descent achievable to ', c: OK },
    { t: '80.0°', c: VAL },
  ],
  [
    { t: '✓ stick risk: ', c: OK },
    { t: 'low', c: VAL },
    { t: '   sensor standoff: ', c: OK },
    { t: 'optimal', c: VAL },
  ],
  [
    { t: '✓ est. rig time saved: ', c: OK },
    { t: '8.2 hrs', c: VAL },
  ],
];

const plain = (line: Run[]) => line.map((r) => r.t).join('');

function BlockCaret() {
  return (
    <span
      aria-hidden="true"
      className="caret-blink inline-block w-[0.55em] h-[1.05em] translate-y-[0.18em] bg-slate-300"
    />
  );
}

function StyledLine({ line }: { line: Run[] }) {
  return (
    <>
      {line.map((run, i) => (
        <span key={i} className={run.c}>
          {run.t}
        </span>
      ))}
    </>
  );
}

export default function AthenaTerminal() {
  // 'static' matches the server HTML; 'typing' replays; 'done' = finished
  // replay (renders like 'static', plus the resting caret).
  const [mode, setMode] = useState<'static' | 'typing' | 'done'>('static');
  const [doneLines, setDoneLines] = useState(0);
  const [chars, setChars] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || ranRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      setMode('typing');
      setDoneLines(0);
      for (let li = 0; li < LINES.length; li++) {
        const text = plain(LINES[li]);
        setChars(0);
        for (let i = 1; i <= text.length; i++) {
          if (!alive) return;
          setChars(i);
          await sleep(22);
        }
        // Line complete — swap the plain overlay for the styled markup.
        setDoneLines(li + 1);
        await sleep(320);
      }
      if (alive) setMode('done');
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (ranRef.current || !entries.some((e) => e.isIntersecting)) return;
        ranRef.current = true; // once per page load — no replay on re-scroll
        io.disconnect();
        void run();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, []);

  const typing = mode === 'typing';

  return (
    <div
      ref={panelRef}
      className="rounded-xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-blue-950/40 overflow-hidden"
    >
      {/* Window chrome — inert dots */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.03]"
        aria-hidden="true"
      >
        <span className="h-3 w-3 rounded-full bg-red-400/70" />
        <span className="h-3 w-3 rounded-full bg-amber-300/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-xs text-slate-500 font-mono">athena — simulation</span>
      </div>

      {/* Transcript. Every line renders its final styled content in the
          markup; while typing, that copy turns invisible (still reserving
          its exact height) under a plain-text overlay. */}
      <div className="px-4 py-4 md:px-5 font-mono text-sm leading-relaxed text-slate-200">
        {LINES.map((line, i) => {
          const settled = !typing || i < doneLines;
          return (
            <div key={i} className="relative whitespace-pre-wrap">
              <span className={settled ? undefined : 'invisible'}>
                <StyledLine line={line} />
              </span>
              {typing && i === doneLines && (
                <span aria-hidden="true" className="absolute inset-0 whitespace-pre-wrap">
                  {plain(line).slice(0, chars)}
                  <BlockCaret />
                </span>
              )}
            </div>
          );
        })}
        {/* Resting prompt — a blinking cursor is idiomatic inside a
            terminal, so this one may persist. */}
        <div className={typing ? 'invisible' : undefined}>
          <span className={DIM}>athena&gt; </span>
          <BlockCaret />
        </div>
      </div>
    </div>
  );
}
