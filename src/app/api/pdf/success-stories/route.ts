import { NextRequest, NextResponse } from 'next/server';
import type { SuccessStoriesFilters } from '@/features/success-stories/types';
import { loadSuccessStoriesDataServer } from '@/features/success-stories/services/successStories.server';
import { getFilteredPageNumbers } from '@/features/success-stories/services/successStories.shared';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, mode = 'download' } = body as {
      filters: SuccessStoriesFilters;
      mode: 'preview' | 'download';
    };

    // Load the base PDF
    const pdfPath = path.join(process.cwd(), 'public', 'data', 'successstories.pdf');
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Load CSV data and get page numbers for filters
    const csvData = await loadSuccessStoriesDataServer();
    const pageNumbers = getFilteredPageNumbers(csvData, filters);

    // If no filters or all pages match, return the original PDF
    if (pageNumbers.length === 0 || pageNumbers.length === pdfDoc.getPageCount()) {
      const originalPdfBytes = await pdfDoc.save();
      const buffer = Buffer.from(originalPdfBytes);

      if (mode === 'preview') {
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="success-stories-preview.pdf"',
          },
        });
      }

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="success-stories.pdf"',
        },
      });
    }

    // Create a new PDF with only the filtered pages
    const newPdfDoc = await PDFDocument.create();

    for (const pageNum of pageNumbers) {
      const pageIndex = pageNum - 1;
      if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
        newPdfDoc.addPage(copiedPage);
      }
    }

    const newPdfBytes = await newPdfDoc.save();
    const buffer = Buffer.from(newPdfBytes);

    if (mode === 'preview') {
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="success-stories-preview.pdf"',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="success-stories-filtered.pdf"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
