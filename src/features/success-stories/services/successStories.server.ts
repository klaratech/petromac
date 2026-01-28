import fs from 'fs/promises';
import type { SuccessStoryRow } from '../types';
import { parseSuccessStoriesTagsCsv } from './successStories.shared';
import { FLIPBOOK_KEYS } from '@/features/flipbooks/constants';
import { getFlipbookTagsPath } from '@/features/flipbooks/services/flipbookManifest.server';

export async function loadSuccessStoriesDataServer(): Promise<SuccessStoryRow[]> {
  const csvText = await fs.readFile(getFlipbookTagsPath(FLIPBOOK_KEYS.successStories), 'utf-8');
  return parseSuccessStoriesTagsCsv(csvText);
}
