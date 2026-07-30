import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  LEGACY_CASE_STUDY_SLUGS,
  LEGACY_PATHS,
  PATENT_PDF_RENAMES,
  resolveLegacyRequest,
} from './redirects';
import { caseStudies } from '@/features/case-studies/content';

/**
 * The P0 acceptance criterion from the 30 Jul 2026 Search Console audit:
 * every legacy URL resolves in a SINGLE permanent hop to a 200 page, with
 * and without a trailing slash, and no rule's destination is itself
 * redirected (no chains).
 */

/** Assert `from` → `to` in one 301, for both slash forms. */
function assertSingleHop(from: string, to: string) {
  for (const variant of [from, from.endsWith('/') ? from.slice(0, -1) : `${from}/`]) {
    const result = resolveLegacyRequest(variant);
    assert.deepEqual(
      result,
      { type: 'redirect', location: to, status: 301 },
      `${variant} should 301 to ${to}`
    );
  }
}

test('the P0 mapping table resolves in one 301 hop, slash or no slash', () => {
  const expected: Record<string, string> = {
    '/contacts': '/contact',
    '/patents': '/about/patents',
    '/origins': '/about',
    '/publications': '/about/publications',
    '/privacy-policy': '/privacy',
    '/terms-of-use': '/terms',
    '/download': '/catalog',
    '/category/orientation': '/case-studies',
    '/author/adm_petromac': '/case-studies',
    '/success-stories': '/case-studies',
    '/success-stories/flipbook': '/case-studies',
  };

  for (const [from, to] of Object.entries(expected)) assertSingleHop(from, to);
  // Guard against a rule being dropped from the table without the test noticing.
  assert.deepEqual(Object.keys(LEGACY_PATHS).sort(), Object.keys(expected).sort());
});

test('legacy paths are matched case-insensitively', () => {
  assertSingleHop('/Contacts', '/contact');
  assertSingleHop('/Privacy-Policy', '/privacy');
});

test('no redirect destination is itself redirected (no chains)', () => {
  const destinations = [
    ...Object.values(LEGACY_PATHS),
    ...LEGACY_CASE_STUDY_SLUGS.map((slug) => `/case-studies/${slug}`),
    ...Object.values(PATENT_PDF_RENAMES).map((file) => `/patent_pdfs/${file}`),
  ];
  for (const destination of destinations) {
    assert.equal(
      resolveLegacyRequest(destination),
      null,
      `${destination} is a redirect destination and must resolve directly`
    );
  }
});

test('WP-era root-level case studies land on their /case-studies page', () => {
  for (const slug of LEGACY_CASE_STUDY_SLUGS) {
    assertSingleHop(`/${slug}`, `/case-studies/${slug}`);
  }
});

test('every legacy case-study slug still exists in the content set', () => {
  const known = new Set(caseStudies.map((cs) => cs.slug));
  for (const slug of LEGACY_CASE_STUDY_SLUGS) {
    assert.ok(known.has(slug), `${slug} redirects to a page that no longer exists`);
  }
});

test('dead WordPress feed URLs are 410 Gone', () => {
  for (const path of [
    '/feed',
    '/feed/',
    '/comments/feed',
    '/comments/feed/',
    '/stick-slip/feed/',
    '/tlc-unable-to-pass-ledge/feed',
  ]) {
    assert.deepEqual(resolveLegacyRequest(path), { type: 'gone' }, `${path} should be 410`);
  }
});

test('patent PDFs fold the /pdf move and the rename into one hop', () => {
  // WP path + old filename → new path + new filename, in a single 301.
  assertSingleHop('/pdf/MY-169945 B.pdf', '/patent_pdfs/MY-169945-B.pdf');
  assertSingleHop('/patent_pdfs/MY-169945 B.pdf', '/patent_pdfs/MY-169945-B.pdf');
  assertSingleHop('/patent_pdfs/US12,281,525.pdf', '/patent_pdfs/US12281525.pdf');
  assertSingleHop('/patent_pdfs/CA3085434 Granted specification.pdf', '/patent_pdfs/CA3085434.pdf');
  // Percent-encoded form — how Google actually has them indexed.
  assert.deepEqual(resolveLegacyRequest('/patent_pdfs/MY-169945%20B.pdf'), {
    type: 'redirect',
    location: '/patent_pdfs/MY-169945-B.pdf',
    status: 301,
  });
  // Files that never needed renaming keep working from the old /pdf path.
  assertSingleHop('/pdf/US9863198B2.pdf', '/patent_pdfs/US9863198B2.pdf');
  assert.equal(resolveLegacyRequest('/patent_pdfs/US9863198B2.pdf'), null);
});

test('renamed patent PDFs exist on disk and no filename needs escaping', () => {
  const files = readdirSync(join(process.cwd(), 'public/patent_pdfs'));
  for (const [oldName, newName] of Object.entries(PATENT_PDF_RENAMES)) {
    assert.ok(files.includes(newName), `${newName} is missing from public/patent_pdfs`);
    assert.ok(!files.includes(oldName), `${oldName} should have been renamed`);
  }
  for (const file of files) {
    assert.match(file, /^[A-Za-z0-9._-]+$/, `${file} needs percent-encoding in a URL`);
  }
});

test('ordinary pages still 308 to their slashless form', () => {
  assert.deepEqual(resolveLegacyRequest('/track-record/'), {
    type: 'redirect',
    location: '/track-record',
    status: 308,
  });
  assert.deepEqual(resolveLegacyRequest('/catalog/tool-taxis/'), {
    type: 'redirect',
    location: '/catalog/tool-taxis',
    status: 308,
  });
  // The query string survives normalisation.
  assert.deepEqual(resolveLegacyRequest('/contact/', '?utm_source=linkedin'), {
    type: 'redirect',
    location: '/contact?utm_source=linkedin',
    status: 308,
  });
  // Root is already canonical.
  assert.equal(resolveLegacyRequest('/'), null);
});

test('repeated slashes collapse to one canonical URL', () => {
  assert.deepEqual(resolveLegacyRequest('/catalog//1000'), {
    type: 'redirect',
    location: '/catalog/1000',
    status: 308,
  });
  assert.deepEqual(resolveLegacyRequest('//contacts//'), {
    type: 'redirect',
    location: '/contacts/',
    status: 308,
  });
});

test('legacy query-shaped views still redirect', () => {
  assert.deepEqual(resolveLegacyRequest('/catalog', '?category=tool-taxis'), {
    type: 'redirect',
    location: '/catalog/tool-taxis',
    status: 301,
  });
  assert.deepEqual(resolveLegacyRequest('/catalog/', '?category=focus-centralisers'), {
    type: 'redirect',
    location: '/catalog/focus-centralisers',
    status: 301,
  });
  assert.deepEqual(resolveLegacyRequest('/track-record', '?stories=1'), {
    type: 'redirect',
    location: '/case-studies',
    status: 307,
  });
  assertSingleHop('/catalogtest/tool-taxis', '/catalog/tool-taxis');
});

test('unrecognised query strings 404 instead of serving a 200 homepage', () => {
  // The four junk URLs Google crawled as separate pages, plus /?entry/.
  for (const search of [
    '?11667727895.html',
    '?89088374982.html',
    '?41225632642.html',
    '?53399458226.html',
    '?entry/',
  ]) {
    assert.deepEqual(
      resolveLegacyRequest('/', search),
      { type: 'notFound' },
      `/${search} should 404`
    );
  }
  // A legacy param with a value that was never a real family is noise too.
  assert.deepEqual(resolveLegacyRequest('/catalog', '?category=not-a-family'), {
    type: 'notFound',
  });
  assert.deepEqual(resolveLegacyRequest('/track-record', '?stories=99'), { type: 'notFound' });
});

test('campaign and app query params are never 404ed', () => {
  for (const search of [
    '?utm_source=linkedin&utm_medium=social&utm_campaign=launch',
    '?gclid=abc123',
    '?fbclid=xyz',
    '?ref=partner',
  ]) {
    assert.equal(resolveLegacyRequest('/', search), null, `/${search} must stay a 200`);
  }
  // Kiosk, API and OAuth params are out of scope entirely.
  assert.equal(resolveLegacyRequest('/intranet/kiosk/lane', '?lane=oh&sd=1&tv=0'), null);
  assert.equal(resolveLegacyRequest('/api/pdf/send-pdf', '?anything=1'), null);
  assert.equal(resolveLegacyRequest('/auth/microsoft/callback', '?code=x&state=y'), null);
  // Service-worker and asset requests can carry cache-busting params.
  assert.equal(resolveLegacyRequest('/kiosk-sw.js', '?v=42'), null);
  assert.equal(resolveLegacyRequest('/data/operations_data.json', '?v=42'), null);
});

test('malformed percent-encoding does not throw', () => {
  assert.doesNotThrow(() => resolveLegacyRequest('/%E0%A4%A', '?x=1'));
  assert.doesNotThrow(() => resolveLegacyRequest('/100%'));
});
