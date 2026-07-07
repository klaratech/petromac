'use client';

import type { FlipbookManifest } from '../types';
import type { FlipbookKey } from '../constants';
import { getFlipbookManifest } from '../manifests';

/**
 * Returns the flipbook manifest synchronously. Manifests are imported at
 * build time (see ../manifests.ts); the async fetch + loading state this
 * hook used to manage is gone, but the return shape is kept so consumers
 * don't need to change their `{ manifest, error }` handling.
 */
export function useFlipbookManifest(docKey: FlipbookKey): {
  manifest: FlipbookManifest;
  error: null;
} {
  return { manifest: getFlipbookManifest(docKey), error: null };
}
