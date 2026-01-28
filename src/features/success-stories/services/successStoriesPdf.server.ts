import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import type { SuccessStoriesFilters } from '../types';
import { getFilteredPageNumbers } from './successStories.shared';
import { loadSuccessStoriesDataServer } from './successStories.server';
import { FLIPBOOK_KEYS } from '@/features/flipbooks/constants';
import { getFlipbookPdfPath } from '@/features/flipbooks/services/flipbookManifest.server';

export type SuccessStoriesPdfResult = {
  bytes: Uint8Array;
  pageNumbers: number[];
  totalPages: number;
  isFullDocument: boolean;
};

const DEFAULT_MAX_PAGES = 60;

function normalizePageNumbers(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const parsed = raw
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

export async function generateSuccessStoriesPdf(options: {
  filters?: SuccessStoriesFilters;
  pageNumbers?: number[];
  maxPages?: number;
}): Promise<SuccessStoriesPdfResult> {
  const { filters, pageNumbers: rawPageNumbers, maxPages = DEFAULT_MAX_PAGES } = options;
  const pageNumbersFromRequest = normalizePageNumbers(rawPageNumbers);

  const pdfPath = getFlipbookPdfPath(FLIPBOOK_KEYS.successStories);
  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const totalPages = pdfDoc.getPageCount();

  let pageNumbers = pageNumbersFromRequest;
  if (pageNumbers.length === 0) {
    const csvData = await loadSuccessStoriesDataServer();
    pageNumbers = getFilteredPageNumbers(csvData, filters || {});
  }

  if (pageNumbers.length > maxPages) {
    throw new Error(`Too many pages selected. Max ${maxPages} pages allowed.`);
  }

  if (pageNumbers.length === 0 || pageNumbers.length === totalPages) {
    return {
      bytes: await pdfDoc.save(),
      pageNumbers: pageNumbers.length === 0 ? Array.from({ length: totalPages }, (_, i) => i + 1) : pageNumbers,
      totalPages,
      isFullDocument: true,
    };
  }

  const newPdfDoc = await PDFDocument.create();

  for (const pageNum of pageNumbers) {
    const pageIndex = pageNum - 1;
    if (pageIndex >= 0 && pageIndex < totalPages) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
      newPdfDoc.addPage(copiedPage);
    }
  }

  return {
    bytes: await newPdfDoc.save(),
    pageNumbers,
    totalPages,
    isFullDocument: false,
  };
}
