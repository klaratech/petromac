import { NextResponse, type NextRequest } from 'next/server';
import { resolveLegacyRequest } from '@/lib/redirects';

/**
 * WordPress-migration URL handling (Jul 2026).
 *
 * All the decision-making lives in `src/lib/redirects.ts` (pure, unit-tested);
 * this file only turns a resolution into a response. It has to run here rather
 * than in next.config's `redirects()` because trailing-slash normalisation
 * happens BEFORE that table is consulted — see the header comment in
 * redirects.ts for why that turned every indexed `/legacy-page/` URL into a
 * redirect chain or a 404.
 *
 * Since `skipTrailingSlashRedirect` is on, canonicalising the trailing slash
 * is now this file's job too: any path that isn't a legacy URL still 308s to
 * its slashless form, exactly as Next did before.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const resolution = resolveLegacyRequest(pathname, search);

  if (!resolution) return NextResponse.next();

  if (resolution.type === 'redirect') {
    return NextResponse.redirect(new URL(resolution.location, request.url), resolution.status);
  }

  if (resolution.type === 'gone') {
    // 410 tells Google the URL is intentionally dead — it drops out of the
    // index faster than a 404 does, which is the whole point for the ~30
    // "Crawled – currently not indexed" WordPress feed URLs.
    return new NextResponse('410 Gone', {
      status: 410,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': 'noindex',
        'cache-control': 'public, max-age=3600',
      },
    });
  }

  // notFound: rewrite to App Router's not-found route so the junk URL gets the
  // styled 404 page with a real 404 status, instead of a 200 homepage.
  return NextResponse.rewrite(new URL('/_not-found', request.url));
}

export const config = {
  // Everything except Next's own build output and the two root files that are
  // fetched constantly. The static asset trees are cheap no-ops inside
  // resolveLegacyRequest, and /pdf/*.pdf must stay in scope for the patent
  // redirects, so they are not excluded here.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
