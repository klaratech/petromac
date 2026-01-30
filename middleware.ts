import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function unauthorized() {
  return new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Intranet"' },
  });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/intranet')) {
    const isPrefetch =
      req.headers.get('x-middleware-prefetch') === '1' ||
      req.headers.get('next-router-prefetch') === '1' ||
      req.headers.get('purpose') === 'prefetch' ||
      req.headers.get('sec-purpose') === 'prefetch';

    if (isPrefetch) {
      return NextResponse.next();
    }

    const user = process.env.INTRANET_USER || '';
    const pass = process.env.INTRANET_PASS || '';
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return unauthorized();
    }

    let decoded = '';
    try {
      decoded = atob(authHeader.slice(6));
    } catch {
      return unauthorized();
    }

    const [givenUser = '', givenPass = ''] = decoded.split(':');

    if (!safeEqual(givenUser, user) || !safeEqual(givenPass, pass)) {
      return unauthorized();
    }

    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/intranet/:path*'],
};
