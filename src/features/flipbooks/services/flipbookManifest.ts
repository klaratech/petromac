import type { FlipbookManifest } from '../types';
import type { FlipbookKey } from '../constants';
import { getFlipbookBasePath } from '../constants';

const manifestCache = new Map<FlipbookKey, FlipbookManifest>();

export async function loadFlipbookManifest(docKey: FlipbookKey): Promise<FlipbookManifest> {
  const cached = manifestCache.get(docKey);
  if (cached) return cached;

  const response = await fetch(`${getFlipbookBasePath(docKey)}/manifest.json`, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to load flipbook manifest for ${docKey}: ${response.status}`);
  }

  const manifest = (await response.json()) as FlipbookManifest;
  manifestCache.set(docKey, manifest);
  return manifest;
}
