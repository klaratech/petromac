import { NextRequest, NextResponse } from 'next/server';
import type { SuccessStoriesFilters } from '@/features/success-stories/types';
import { generateSuccessStoriesPdf } from '@/features/success-stories/services/successStoriesPdf.server';

function buildDownloadFilename(filters?: SuccessStoriesFilters): string {
  const parts: string[] = ['petromac', 'successstories'];

  const appendFilters = (values?: string[]) => {
    if (!values || values.length === 0) return;
    const normalized = values
      .map((value) =>
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
      .filter(Boolean)
      .join('-');
    if (normalized) parts.push(normalized);
  };

  appendFilters(filters?.areas);
  appendFilters(filters?.companies);
  appendFilters(filters?.techs);

  const date = new Date().toISOString().slice(0, 10);
  parts.push(date);

  return `${parts.join('_')}.pdf`;
}

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
        'Content-Disposition': `attachment; filename="${buildDownloadFilename(filters)}"`,
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
