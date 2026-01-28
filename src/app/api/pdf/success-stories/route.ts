import { NextRequest, NextResponse } from 'next/server';
import type { SuccessStoriesFilters } from '@/features/success-stories/types';
import { generateSuccessStoriesPdf } from '@/features/success-stories/services/successStoriesPdf.server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, mode = 'download', pageNumbers } = body as {
      filters?: SuccessStoriesFilters;
      mode?: 'preview' | 'download';
      pageNumbers?: number[];
    };

    const options: { filters?: SuccessStoriesFilters; pageNumbers?: number[] } = {};
    if (filters) options.filters = filters;
    if (pageNumbers) options.pageNumbers = pageNumbers;

    const result = await generateSuccessStoriesPdf(options);
    const buffer = Buffer.from(result.bytes);

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
        'Content-Disposition': result.isFullDocument
          ? 'attachment; filename="success-stories.pdf"'
          : 'attachment; filename="success-stories-filtered.pdf"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate PDF';
    const status = message.startsWith('Too many pages') ? 400 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
