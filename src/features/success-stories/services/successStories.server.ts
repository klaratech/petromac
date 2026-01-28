import fs from 'fs/promises';
import path from 'path';
import type { SuccessStoryRow } from '../types';
import { parseSuccessStoriesCsv } from './successStories.shared';

const CSV_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'successstories-summary.csv');

export async function loadSuccessStoriesDataServer(): Promise<SuccessStoryRow[]> {
  const csvText = await fs.readFile(CSV_FILE_PATH, 'utf-8');
  return parseSuccessStoriesCsv(csvText);
}
