import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  LEGACY_CASE_STUDY_SLUGS,
  LEGACY_PATHS,
  MERGED_PRODUCT_PATHS,
  PATENT_PDF_RENAMES,
  resolveLegacyRequest,
} from './redirects';
import { caseStudies } from '@/features/case-studies/content';
import { allProducts } from '@/features/catalog/content';

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
    '/category/orientation': '/success-stories',
    '/author/adm_petromac': '/success-stories',
    '/success-stories/flipbook': '/success-stories',
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
    ...LEGACY_CASE_STUDY_SLUGS.map((slug) => `/success-stories/${slug}`),
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

test('WP-era root-level case studies land on their /success-stories page', () => {
  for (const slug of LEGACY_CASE_STUDY_SLUGS) {
    assertSingleHop(`/${slug}`, `/success-stories/${slug}`);
  }
});

test('the Jul-2026 /case-studies tree 301s to /success-stories, slugs intact', () => {
  assertSingleHop('/case-studies', '/success-stories');
  assertSingleHop('/case-studies/stick-slip', '/success-stories/stick-slip');
  // Query strings survive the hop (e.g. a shared campaign link).
  assert.deepEqual(resolveLegacyRequest('/case-studies', '?utm_source=linkedin'), {
    type: 'redirect',
    location: '/success-stories?utm_source=linkedin',
    status: 301,
  });
  // The orphan preview route is NOT part of the renamed tree.
  assert.equal(resolveLegacyRequest('/case-studies-preview'), null);
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
    location: '/success-stories',
    status: 307,
  });
  assertSingleHop('/catalogtest/tool-taxis', '/catalog/tool-taxis');
});

test('merged product pages 301 to their survivor, which still exists', () => {
  const slugs = new Set(allProducts.map((p) => `/catalog/${p.category}/${p.slug}`));
  for (const [from, to] of Object.entries(MERGED_PRODUCT_PATHS)) {
    // The retired page must be GONE — a redirect to a page that is still
    // generated would mean the merge silently did not happen.
    assert.ok(!slugs.has(from), `${from} still generates a page; the merge did not apply`);
    // ...and the survivor must exist, or the 301 lands on a 404.
    assert.ok(slugs.has(to), `${from} redirects to ${to}, which is not a product page`);
    assertSingleHop(from, to);
  }
});

test('a merged product keeps its model names searchable on the survivor', () => {
  // TTB-S75U lost its page but not its existence: buildSearchIndex puts
  // `models` in the haystack, so a search for it must still reach the page
  // that now documents it.
  const survivor = allProducts.find((p) => p.slug === 'ttb-s75-ttb-s85');
  assert.ok(survivor, 'ttb-s75-ttb-s85 should exist');
  assert.deepEqual(survivor.models, ['TTB-S75', 'TTB-S75U', 'TTB-S85']);
});

test('valueless junk query strings 404 instead of serving a 200 homepage', () => {
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
});

test('an unknown param WITH a value is left alone, not 404ed', () => {
  // Deliberate: only valueless params are junk. Policing values needs a list of
  // every tracking param in the industry, which is stale the day it is written
  // — see the note on rule 10. These serve their page as they did before.
  assert.equal(resolveLegacyRequest('/catalog', '?category=not-a-family'), null);
  assert.equal(resolveLegacyRequest('/track-record', '?stories=99'), null);
  assert.equal(resolveLegacyRequest('/catalog/tool-taxis', '?tab=specs'), null);
});

test('tracking params outside the allowlist still resolve', () => {
  // Regression guard. The first cut of rule 10 404ed anything not explicitly
  // allowlisted, which broke real inbound traffic: srsltid is appended by
  // GOOGLE, igshid by Instagram, mkt_tok by Marketo, _hsenc by HubSpot.
  for (const param of [
    'srsltid',
    'igshid',
    'dclid',
    'twclid',
    'yclid',
    'mkt_tok',
    '_hsenc',
    'epik',
    'si',
  ]) {
    assert.equal(
      resolveLegacyRequest('/', `?${param}=abc123`),
      null,
      `?${param}= must not 404 — it is real inbound traffic`
    );
  }
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

test('dead WordPress machinery is 410, not 404', () => {
  for (const path of [
    '/wp-includes/js/wp-emoji-release.min.js',
    '/wp-includes/js/wp-emoji-release.min.js?ver=7.0.2',
    '/wp-includes',
    '/wp-content/uploads/2019/07/something.png',
    '/wp-admin/',
    '/wp-json/wp/v2/posts',
  ]) {
    const [pathname, search] = path.split('?');
    assert.deepEqual(
      resolveLegacyRequest(pathname as string, search ? `?${search}` : ''),
      { type: 'gone' },
      `${path} should be 410`
    );
  }
});

test('the 410 sweep never swallows a legacy CONTENT path', () => {
  // These carry the site's most valuable inbound links — /contacts/ alone was
  // 59 clicks against a site total of ~250 a quarter. They must still redirect.
  for (const path of ['/contacts', '/contacts/', '/patents/', '/origins/']) {
    const result = resolveLegacyRequest(path);
    assert.equal(result?.type, 'redirect', `${path} must redirect, not 410`);
  }
  // A path merely CONTAINING "wp" is not WordPress machinery.
  assert.notDeepEqual(resolveLegacyRequest('/wpsomething'), { type: 'gone' });
});
