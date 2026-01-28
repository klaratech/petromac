import fs from 'fs/promises';
import path from 'path';
import type { FlipbookManifest } from '../types';
import type { FlipbookKey } from '../constants';

export function getFlipbookDir(docKey: FlipbookKey): string {
  return path.join(process.cwd(), 'public', 'flipbooks', docKey);
}

export async function loadFlipbookManifestServer(docKey: FlipbookKey): Promise<FlipbookManifest> {
  const manifestPath = path.join(getFlipbookDir(docKey), 'manifest.json');
  const raw = await fs.readFile(manifestPath, 'utf-8');
  return JSON.parse(raw) as FlipbookManifest;
}

export function getFlipbookPdfPath(docKey: FlipbookKey): string {
  return path.join(getFlipbookDir(docKey), 'source.pdf');
}

export function getFlipbookTagsPath(docKey: FlipbookKey): string {
  return path.join(getFlipbookDir(docKey), 'tags.csv');
}
