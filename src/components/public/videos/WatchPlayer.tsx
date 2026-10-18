'use client';

import { openContactDrawer } from '@/lib/contactDrawer';
import { requestFilePrefill, watchPath, type SiteVideo } from '@/features/videos';
import CopyLinkButton from './CopyLinkButton';

/**
 * The inline player on /watch/<slug> — the same policy as the homepage
 * lightbox: native controls, no Download item, no right-click "Save video",
 * and "Request the file" as the honest alternative (docs/DECISIONS.md, Oct
 * 2026). No autoplay: browsers block unmuted autoplay without a gesture on
 * the page, and a muted start would hide the narration.
 */
export default function WatchPlayer({ video }: { video: SiteVideo }) {
  const linkClass =
    'font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm';

  return (
    <div>
      <video
        src={video.src}
        poster={video.poster}
        controls
        controlsList="nodownload noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        playsInline
        preload="metadata"
        aria-label={`${video.product} video — ${video.challenge} (${video.duration})`}
        className="block w-full aspect-video rounded-xl bg-black object-contain shadow-card"
      />
      <p className="mt-3 text-sm text-slate-500">
        Want to share this animation with your team?{' '}
        <button
          type="button"
          onClick={() => openContactDrawer(requestFilePrefill(video))}
          className={linkClass}
        >
          Request the file
        </button>{' '}
        <span aria-hidden="true">·</span>{' '}
        <CopyLinkButton path={watchPath(video.slug)} className={linkClass} />
      </p>
    </div>
  );
}
