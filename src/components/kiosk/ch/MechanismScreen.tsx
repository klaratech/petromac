'use client';

/**
 * MechanismScreen — config-driven "Mechanism" sub-view.
 *
 * Used by the Cased Hole experiences (Helix / Rocker) and the Open Hole
 * `OverlayExperience` scaffolds. Renders a slideshow of mechanism content
 * (annotated diagrams + comparison videos) with a previous/next pager so
 * each piece gets the full screen rather than competing for space.
 *
 * A "Specifications" button in the header opens a modal with the device's
 * spec sheet (pulled from `deviceSpecs.ts` and passed in via `config.specs`).
 */

import { useState } from 'react';
import { AssetSlot } from '@/components/kiosk/AssetSlot';
import SectionPill, { type Section } from './SectionPill';
import SpecsModal from './SpecsModal';

// ── Slide types ──────────────────────────────────────────────────────────────

/** A single mechanism video that loops fullscreen. */
export interface MechanismVideoSlide {
  type: 'video';
  /** Heading text — e.g. "Conventional mechanism", "HELIX mechanism". */
  label: string;
  /** Video path under /public. */
  src: string;
  /** Outline the slide (use for the Petromac side of a comparison). */
  highlight?: boolean;
  /** Optional small caption shown beneath the heading. */
  caption?: string;
}

export interface Bullet {
  text: string;
  /** When set, renders the bullet in a highlight tone:
   *  - 'red'  for limitations (e.g. "Limited range of casing sizes")
   *  - 'blue' for benefits / takeaways (e.g. "Effective mechanism…").
   *    Uses the brand navy `#1E4A9A`. */
  highlight?: 'red' | 'blue';
}

/** An annotated diagram (tool render or looping video) with a bullet list. */
export interface MechanismAnnotatedSlide {
  type: 'annotated';
  /** Heading text — e.g. "Conventional centralizer". */
  label: string;
  /** Image of the tool. Also acts as the `poster` for `video` when both
   *  are set. */
  image: string;
  /** Optional mechanism video that plays in place of `image` (autoplay,
   *  loop, playsInline). Use this to embed a motion clip inside an
   *  annotated slide rather than spend a separate slide on it. `image`
   *  is still used as the poster fallback. */
  video?: string;
  /** Bullet list to the right of the diagram. */
  bullets: Bullet[];
  /** Optional secondary diagram shown above the bullets in the right column —
   *  used for things like the Rocker conventional-centralizer force section
   *  view. */
  detailImage?: string;
}

/** A two-row comparison slide — typically conventional on top, Petromac on
 *  the bottom — with a short bullet list to the right summarising the
 *  takeaway. The images themselves carry any inline annotation (arrows,
 *  brackets) baked in by graphics. */
export interface MechanismComparisonSlide {
  type: 'comparison';
  /** Heading text — e.g. "Lever arm comparison". */
  label: string;
  /** Stacked rows. Two rows is the common case (conventional vs Petromac);
   *  the renderer handles N rows. */
  rows: { image: string; rowLabel?: string }[];
  /** Bullet list to the right of the rows. */
  bullets: Bullet[];
}

export type MechanismSlide =
  | MechanismVideoSlide
  | MechanismAnnotatedSlide
  | MechanismComparisonSlide;

export interface MechanismConfig {
  /** Shown as the screen heading, e.g. "Helix", "Pathfinder". */
  title: string;
  /** Ordered slides — first one shown on entry, pager steps through. */
  slides: MechanismSlide[];
  /** Spec sheet — opened via the "Specifications" header button. Pass the
   *  `specs` object from `deviceSpecs.ts` for the relevant device. */
  specs?: Record<string, string>;
  /** Optional graph image (load-capacity, performance curve, etc.) shown
   *  beneath the spec table in SpecsModal. Pass `deviceSpec.graph` here. */
  specsGraph?: string;
  /** Optional footer note, e.g. a slide reference. */
  sourceNote?: string;
}

interface Props {
  config: MechanismConfig;
  onBack: () => void;
  /** Switch to the peer sub-view (Case Studies) without bouncing back to
   *  the experience's main view. Rendered as the persistent header pill;
   *  parent typically wires this to its `setView` so 'logs' lands directly
   *  on LogsScreen. */
  onSwitchSection: (_section: Section) => void;
}

// Configs (HELIX_MECHANISM, ROCKER_MECHANISM) moved to ./ch-configs.ts so
// the heavier screen code in this file can be dynamic()-imported by
// HelixExperience / RockerExperience without dragging the configs along.
//
// Asset slots — drop bare renders at these paths and the slides pick them up;
// inline annotations (dimension brackets, arrows) are baked into the artwork.
//   /public/images/helix-mechanism-conventional.png
//   /public/images/helix-mechanism-helix.png
//   /public/images/kiosk-images/leverage-{conventional,helix}.png
//   /public/images/rocker-mechanism-conventional.png
//   /public/images/rocker-mechanism-conventional-detail.png
//   /public/images/rocker-mechanism-rocker.png

// ── Main component ──────────────────────────────────────────────────────────

export default function MechanismScreen({
  config,
  onBack,
  onSwitchSection,
}: Props) {
  const { slides } = config;
  const [index, setIndex] = useState(0);
  const [specsOpen, setSpecsOpen] = useState(false);
  const slide = slides[index];

  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      {/* Persistent section pill — Mechanism · Case Studies · Specifications
          (Specs button only renders when `config.specs` is set). The old
          standalone Specifications header button is gone; the pill is the
          single canonical entry point so the spec sheet is reachable from
          every screen that shows the pill (M/CS sub-views + the CH product
          screens). Close ✕ stays docked right. */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <SectionPill
          active="mechanism"
          onSwitch={onSwitchSection}
          onOpenSpecs={
            config.specs ? () => setSpecsOpen(true) : undefined
          }
        />
        <button
          onClick={onBack}
          aria-label="Close"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-2xl"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 relative bg-black">
        {!slide ? (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            No mechanism slides configured yet.
          </div>
        ) : slide.type === 'video' ? (
          <VideoSlide
            key={slide.src}
            label={slide.label}
            src={slide.src}
            highlight={slide.highlight ?? false}
            caption={slide.caption}
          />
        ) : slide.type === 'annotated' ? (
          <AnnotatedSlide
            key={slide.image}
            label={slide.label}
            image={slide.image}
            video={slide.video}
            bullets={slide.bullets}
            detailImage={slide.detailImage}
          />
        ) : (
          <ComparisonSlide
            key={slide.label}
            label={slide.label}
            rows={slide.rows}
            bullets={slide.bullets}
          />
        )}

        {/* Pager — large round arrow buttons on the left + right middle
            edges of the slide area. Disabled (faded) at the boundaries
            rather than removed so the layout doesn't shift between slides. */}
        {slides.length > 1 && (
          <>
            <SlideNavButton
              direction="prev"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            />
            <SlideNavButton
              direction="next"
              onClick={() =>
                setIndex((i) => Math.min(slides.length - 1, i + 1))
              }
              disabled={index === slides.length - 1}
            />
          </>
        )}
      </div>

      {specsOpen && config.specs && (
        <SpecsModal
          specs={config.specs}
          graph={config.specsGraph}
          onClose={() => setSpecsOpen(false)}
        />
      )}
    </div>
  );
}

// ── Slide renderers ─────────────────────────────────────────────────────────

function VideoSlide({
  label,
  src,
  highlight,
  caption,
}: {
  label: string;
  src: string;
  highlight: boolean;
  caption?: string | undefined;
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <div
        className={`relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border ${
          highlight
            ? 'border-white/40 ring-2 ring-white/30'
            : 'border-white/10'
        } bg-black/40`}
      >
        {/* Muted — current mechanism clips (conventional-largecasings,
            conventional-smallcasings, helix-mechanism, rocker-mechanism)
            have no audio masters, and `muted` lets the browser autoplay
            them unconditionally regardless of activation policy. Drop
            `muted` if/when a clip with narration replaces these. */}
        <video
          src={src}
          autoPlay
          muted
          loop
          preload="metadata"
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLVideoElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm px-6 text-center -z-10">
          Drop file at <code className="text-white/70 mx-1">{src}</code>
        </div>
      </div>

      {/* Bottom-centre label pill (matches LogsScreen caption pattern) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="px-4 py-2 rounded-full bg-black/60 text-sm uppercase tracking-[0.2em]">
          {label}
        </div>
        {caption && <p className="text-white/60 text-xs">{caption}</p>}
      </div>
    </div>
  );
}

/**
 * AnnotatedSlide — light-themed card showing a tool image (or looping
 * mechanism video) on the left 2/3 with a bullet list on the right. Earlier
 * versions overlaid dimension brackets (9.0"/5.8", 6.3"/3.3") on top of the
 * diagram; those were removed in favour of a cleaner motion-only card.
 */
function AnnotatedSlide({
  label,
  image,
  video,
  bullets,
  detailImage,
}: {
  label: string;
  image: string;
  video?: string | undefined;
  bullets: Bullet[];
  detailImage?: string | undefined;
}) {
  return (
    <div className="w-full h-full p-6 flex">
      <div className="flex-1 m-2 rounded-2xl bg-white text-slate-900 grid grid-cols-3 gap-6 px-8 py-10">
        {/* Diagram (2/3 of the card) — tool image OR mechanism video. The
            video fills the column so motion plays as large as possible.
            `bg-white` paints any letterbox/pillarbox area white so it blends
            into the slide card (Android Chrome paints it black otherwise). */}
        <div className="col-span-2 relative flex items-center justify-center">
          {video ? (
            <video
              src={video}
              poster={image}
              autoPlay
              loop
              muted
              preload="metadata"
              playsInline
              className="absolute inset-0 w-full h-full object-contain bg-white"
              onError={(e) => {
                (e.currentTarget as HTMLVideoElement).style.display = 'none';
              }}
            />
          ) : (
            <AssetSlot
              src={image}
              alt={label}
              priority
              className="object-contain"
              theme="light"
            />
          )}
        </div>

        {/* Right column — optional detail image stacked above the bullets.
            When no detail image, bullets get the full column height. */}
        <div className="col-span-1 flex flex-col gap-4">
          {detailImage && (
            <div className="relative w-full h-36 shrink-0">
              <AssetSlot
                src={detailImage}
                alt={`${label} — detail`}
                className="object-contain"
                theme="light"
              />
            </div>
          )}
          <BulletList bullets={bullets} className="flex-1" />
        </div>
      </div>

      {/* Slide label pill — keeps the same affordance as VideoSlide */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="px-4 py-2 rounded-full bg-black/60 text-white text-sm uppercase tracking-[0.2em]">
          {label}
        </div>
      </div>
    </div>
  );
}

/**
 * ComparisonSlide — two (or more) stacked tool renders on a white card with
 * a short bullet list on the right. Used for the Helix lever-arm comparison
 * slide: conventional centraliser on top, HELIX on the bottom.
 *
 * Any inline annotations on the rows (arrows, lever-arm brackets) are baked
 * into the artwork by graphics — this component just lays the rows out.
 */
function ComparisonSlide({
  label,
  rows,
  bullets,
}: {
  label: string;
  rows: { image: string; rowLabel?: string }[];
  bullets: Bullet[];
}) {
  return (
    <div className="w-full h-full p-6 flex">
      <div className="flex-1 m-2 rounded-2xl bg-white text-slate-900 grid grid-cols-3 gap-6 px-8 py-10">
        {/* Stacked rows (2/3 of the card) */}
        <div className="col-span-2 flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.image}
              className="relative flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
            >
              <AssetSlot
                src={row.image}
                alt={row.rowLabel ?? ''}
                className="object-contain"
                theme="light"
              />
              {row.rowLabel && (
                <div className="absolute top-2 left-3 px-2 py-0.5 rounded bg-white/90 text-[10px] uppercase tracking-[0.18em] text-slate-700 z-10">
                  {row.rowLabel}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bullets */}
        <BulletList bullets={bullets} className="col-span-1" />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="px-4 py-2 rounded-full bg-black/60 text-white text-sm uppercase tracking-[0.2em]">
          {label}
        </div>
      </div>
    </div>
  );
}

/**
 * Shared bullet list for the annotated + comparison slides. Renders inside
 * the right-hand 1/3 column of the white card. Highlight tones:
 *   'red'  → limitations (text-red-600)
 *   'blue' → benefits / takeaways (brand navy #1E4A9A)
 *   undefined → neutral (slate-900)
 */
function BulletList({
  bullets,
  className = '',
}: {
  bullets: Bullet[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-col justify-center gap-6 ${className}`}>
      {bullets.map((b) => {
        const tone = bulletToneClasses(b.highlight);
        return (
          <li
            key={b.text}
            className={`flex items-start gap-3 text-lg font-medium ${tone.text}`}
          >
            <span
              className={`mt-2 inline-block w-1.5 h-1.5 rounded-full ${tone.dot}`}
              aria-hidden="true"
            />
            <span>{b.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

function bulletToneClasses(highlight?: 'red' | 'blue') {
  if (highlight === 'red') return { text: 'text-red-600', dot: 'bg-red-600' };
  if (highlight === 'blue') return { text: 'text-[#1E4A9A]', dot: 'bg-[#1E4A9A]' };
  return { text: 'text-slate-900', dot: 'bg-slate-900' };
}

// ── Pager ───────────────────────────────────────────────────────────────────

/** Large round arrow button pinned to the left or right middle edge of the
 *  slide area. Mirrors the same affordance used in LogsScreen (case
 *  studies pager) so the two slideshows feel consistent. */
function SlideNavButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  const sideClass = direction === 'prev' ? 'left-4' : 'right-4';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous slide' : 'Next slide'}
      className={`absolute top-1/2 -translate-y-1/2 z-30 ${sideClass} w-14 h-14 rounded-full bg-black/55 hover:bg-black/75 border border-white/15 text-white text-3xl flex items-center justify-center shadow-lg transition disabled:opacity-25 disabled:cursor-not-allowed`}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}
