import { NextRequest, NextResponse } from 'next/server';
import { SuccessStoriesService } from '@/modules/success-stories/services/successStories.service';
import type { SuccessStoriesFilters } from '@/modules/success-stories/types/successStories.types';
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
    const pdfPath = path.join(process.cwd(), 'public', 'successstories.pdf');
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Load CSV data and get page numbers for filters
    const csvData = await SuccessStoriesService.loadDataServer();
    const filteredData = SuccessStoriesService.filterData(csvData, filters);
    
    // Get unique page numbers (1-based from CSV, convert to 0-based for pdf-lib)
    const pageNumbers = [...new Set(filteredData.map(row => row.page))].sort((a, b) => a - b);
    
    // If no filters or all pages match, return the original PDF
    if (pageNumbers.length === 0 || pageNumbers.length === pdfDoc.getPageCount()) {
      const originalPdfBytes = await pdfDoc.save();
      const buffer = Buffer.from(originalPdfBytes);
      
      if (mode === 'preview') {
        // For preview, we could store temporarily and return URL, but for simplicity return the full PDF
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="success-stories-preview.pdf"',
          },
        });
      } else {
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="success-stories.pdf"',
          },
        });
      }
    }

    // Create a new PDF with only the filtered pages
    const newPdfDoc = await PDFDocument.create();
    
    // Copy the filtered pages (convert 1-based to 0-based indexing)
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
      // For preview mode, return as inline
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="success-stories-preview.pdf"',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } else {
      // For download mode, return as attachment
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="success-stories-filtered.pdf"',
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
