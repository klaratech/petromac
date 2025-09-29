import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const filtersJson = formData.get('filters_json') as string;
    const caseInsensitive = formData.get('case_insensitive') === 'true';
    const preview = formData.get('preview') === 'true';

    if (!filtersJson) {
      return NextResponse.json(
        { error: 'filters_json is required' },
        { status: 400 }
      );
    }

    // Validate that filters_json is valid JSON
    try {
      JSON.parse(filtersJson);
    } catch {
      return NextResponse.json(
        { error: 'Invalid filters_json format' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Create FormData for the backend request
    const backendFormData = new FormData();
    backendFormData.append('filters_json', filtersJson);
    backendFormData.append('case_insensitive', caseInsensitive.toString());
    if (preview) {
      backendFormData.append('preview', 'true');
    }

    // Forward the request to the FastAPI backend
    const response = await fetch(`${apiUrl}/extract`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    // If preview mode, return JSON response
    if (preview) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // For PDF download, stream the response
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const contentDisposition = response.headers.get('content-disposition') || 'attachment; filename="extracted.pdf"';

    // Get the PDF data as an ArrayBuffer
    const pdfArrayBuffer = await response.arrayBuffer();

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': pdfArrayBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during PDF generation' },
      { status: 500 }
    );
  }
}
