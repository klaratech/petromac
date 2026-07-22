'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Video lightbox built on the native <dialog> element, which provides the
 * modal behaviours the section needs for free: focus trapping while open,
 * Escape-to-close (the 'cancel' event), focus restoration to the trigger
 * on close, and a ::backdrop pseudo-element. The <video> keeps native
 * controls, so browser-native full-screen (and iOS inline/fullscreen
 * toggling via playsinline) works out of the box — nothing intercepts it.
 *
 * The element is only mounted while `open` is true, so no video resource
 * is fetched until the user asks for one, and closing tears the player
 * down (pausing is handled explicitly too, for the fullscreen-exit path).
 */
export default function VideoLightbox({
  open,
  src,
  poster,
  label,
  onClose,
}: {
  open: boolean;
  /** MP4 source for the active solution. */
  src: string;
  poster: string;
  /** Accessible name for the dialog, e.g. "Wireline Express video". */
  label: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // The dialog unmounts on close, which skips the browser's native
  // focus-restoration — return focus to the triggering element ourselves.
  // Declared BEFORE the showModal effect so the opener is captured before
  // focus moves into the dialog.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    return () => {
      opener?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Lock page scroll behind the modal.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleClose = useCallback(() => {
    videoRef.current?.pause();
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={handleClose}
      onCancel={handleClose}
      // Clicks on the backdrop land on the <dialog> element itself; clicks
      // inside the content land on descendants.
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
      className="bg-transparent p-0 m-auto w-[min(90vw,160vh)] max-w-[90vw] max-h-[90vh] backdrop:bg-slate-950/85 backdrop:backdrop-blur-sm"
    >
      <div className="relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close video"
          className="absolute -top-3 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M4 4l10 10M14 4L4 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          autoPlay
          className="block w-full max-h-[85vh] rounded-lg bg-black aspect-video object-contain"
        />
      </div>
    </dialog>
  );
}
