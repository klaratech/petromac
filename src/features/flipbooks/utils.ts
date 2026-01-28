import type { FlipbookManifest } from './types';
import type { FlipbookKey } from './constants';
import { getFlipbookBasePath } from './constants';

export function getFlipbookPageUrl(
  docKey: FlipbookKey,
  manifest: FlipbookManifest,
  pageNumber: number
): string {
  const pad = String(pageNumber).padStart(manifest.pageDigits, '0');
  const pagesPath = manifest.pagesPath || 'pages';
  return `${getFlipbookBasePath(docKey)}/${pagesPath}/${pad}.${manifest.pageExtension}`;
}

export function buildFlipbookPageUrls(
  docKey: FlipbookKey,
  manifest: FlipbookManifest
): string[] {
  return Array.from({ length: manifest.pageCount }, (_, index) =>
    getFlipbookPageUrl(docKey, manifest, index + 1)
  );
}
