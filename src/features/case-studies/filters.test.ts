import assert from 'node:assert/strict';
import test from 'node:test';
import { caseStudies } from './content';
import {
  actionButtonLabel,
  SHOW_FILTERED_COUNT_ON_ACTIONS,
  buildCaseStudyOptions,
  buildFacetedCaseStudyOptions,
  filterCaseStudies,
  isMajorServiceCompany,
  isQueryActive,
  categoryLabel,
  normalizeCategory,
  OTHER_COMPANY,
  pageNumbersFor,
  SERVICE_COMPANIES,
  deviceCatalogLink,
  relatedCaseStudies,
  relatedCaseStudyMap,
} from './filters';

// ── category normalisation (the tags.csv typo) ──────────────────────────

test('normalizeCategory repairs the missing-space variant', () => {
  assert.equal(normalizeCategory('Well Access:Deviation'), 'Well Access: Deviation');
  assert.equal(normalizeCategory('Well Access: Deviation'), 'Well Access: Deviation');
  assert.equal(normalizeCategory('  Sticking  Prevention '), 'Sticking Prevention');
});

test('the two Well Access: Deviation spellings collapse into one option', () => {
  const { categories } = buildCaseStudyOptions(caseStudies);
  const variants = categories.filter((c) => c.value.replace(/\s/g, '') === 'WellAccess:Deviation');
  assert.equal(variants.length, 1, 'expected a single merged option');
  // 21 stories, all now spelled with the space since the tags.csv fix.
  assert.equal(variants[0]?.count, 21);
});

// ── display labels ─────────────────────────────────────────────────────

test('categoryLabel drops the Well Access: prefix but keeps the bare value', () => {
  assert.equal(categoryLabel('Well Access: Deviation'), 'Deviation');
  assert.equal(categoryLabel('Well Access: Ledges'), 'Ledges');
  // The one story tagged with no sub-category must still read as something.
  assert.equal(categoryLabel('Well Access'), 'Well Access');
  // Repairs the typo on the way through, so a regressed CSV can't leak a
  // "Deviation" that fails to match its sibling's label.
  assert.equal(categoryLabel('Well Access:Deviation'), 'Deviation');
  // Unprefixed categories pass through untouched.
  assert.equal(categoryLabel('Sticking Prevention'), 'Sticking Prevention');
});

test('categoryLabel never yields an empty badge', () => {
  assert.equal(categoryLabel('Well Access:'), 'Well Access:');
  assert.equal(categoryLabel('Well Access: '), 'Well Access:');
});

test('labels stay unique, so no two filter options read the same', () => {
  const { categories } = buildCaseStudyOptions(caseStudies);
  const labels = categories.map((c) => categoryLabel(c.value));
  assert.equal(new Set(labels).size, labels.length, `duplicate labels: ${labels.join(', ')}`);
});

// ── options ────────────────────────────────────────────────────────────

test('options are tallied, sorted by count, and exclude blanks', () => {
  const { regions, devices } = buildCaseStudyOptions(caseStudies);
  assert.ok(regions.length > 0);
  assert.equal(regions[0]?.value, 'MENA'); // most common region in the data
  for (let i = 1; i < regions.length; i++) {
    assert.ok(regions[i - 1]!.count >= regions[i]!.count, 'counts must descend');
  }
  // Two stories have an empty device string — it must not become an option.
  assert.ok(!devices.some((d) => d.value === ''));
});

// ── filtering ──────────────────────────────────────────────────────────

test('no query returns everything', () => {
  assert.equal(filterCaseStudies(caseStudies, {}).length, caseStudies.length);
});

test('region and device filters narrow correctly', () => {
  const mena = filterCaseStudies(caseStudies, { region: 'MENA' });
  assert.ok(mena.length > 0 && mena.length < caseStudies.length);
  assert.ok(mena.every((cs) => cs.region === 'MENA'));

  const pathfinder = filterCaseStudies(caseStudies, { device: 'Pathfinder' });
  assert.ok(pathfinder.every((cs) => cs.device === 'Pathfinder'));
});

test('category filter matches across both source spellings', () => {
  const hits = filterCaseStudies(caseStudies, { category: 'Well Access: Deviation' });
  assert.equal(hits.length, 21);
});

test('free text needs 2+ chars and requires every term', () => {
  // A single character is ignored rather than matching everything noisily.
  assert.equal(filterCaseStudies(caseStudies, { text: 'a' }).length, caseStudies.length);

  const saudi = filterCaseStudies(caseStudies, { text: 'saudi' });
  assert.ok(saudi.length > 0);
  assert.ok(saudi.every((cs) => JSON.stringify(cs).toLowerCase().includes('saudi')));

  // Both terms must appear — so this is a subset of the single-term result.
  const both = filterCaseStudies(caseStudies, { text: 'saudi arabia' });
  assert.ok(both.length <= saudi.length);

  assert.equal(filterCaseStudies(caseStudies, { text: 'zzzznotathing' }).length, 0);
});

test('filters combine (AND, not OR)', () => {
  const region = 'MENA';
  const combined = filterCaseStudies(caseStudies, { region, category: 'Sticking Prevention' });
  assert.ok(combined.every((cs) => cs.region === region));
  assert.ok(combined.length <= filterCaseStudies(caseStudies, { region }).length);
});

test('isQueryActive ignores blank text', () => {
  assert.equal(isQueryActive({}), false);
  assert.equal(isQueryActive({ text: '   ' }), false);
  assert.equal(isQueryActive({ text: 'ledge' }), true);
  assert.equal(isQueryActive({ region: 'APAC' }), true);
  assert.equal(isQueryActive({ company: 'SLB' }), true);
});

// ── service company (majors + Other) ───────────────────────────────────

test('company options name the majors and bucket the rest as Other', () => {
  const { companies } = buildCaseStudyOptions(caseStudies);
  assert.deepEqual(
    companies.map((c) => c.label),
    ['SLB', 'Halliburton', 'Baker Hughes', 'Other']
  );
  // Every story is accounted for exactly once across the four buckets.
  assert.equal(
    companies.reduce((sum, c) => sum + c.count, 0),
    caseStudies.length
  );
});

test('major company filter matches only that company', () => {
  const slb = filterCaseStudies(caseStudies, { company: 'SLB' });
  assert.ok(slb.length > 0);
  assert.ok(slb.every((cs) => cs.wirelineCompany.toUpperCase() === 'SLB'));

  // "hal" as free text over-matches ("challenging", "shallow"); the filter
  // must not — that's the whole reason it exists.
  const hal = filterCaseStudies(caseStudies, { company: 'HAL' });
  assert.ok(hal.every((cs) => cs.wirelineCompany.toUpperCase() === 'HAL'));
  assert.ok(hal.length < filterCaseStudies(caseStudies, { text: 'hal' }).length);
});

test('Other excludes all three majors and is non-empty', () => {
  const other = filterCaseStudies(caseStudies, { company: OTHER_COMPANY });
  assert.ok(other.length > 0, 'expected at least one non-major operator');
  assert.ok(other.every((cs) => !isMajorServiceCompany(cs.wirelineCompany)));
  assert.ok(other.every((cs) => cs.wirelineCompany.trim() !== ''));
});

test('the four company buckets partition the set with no overlap', () => {
  const seen = new Set<string>();
  for (const value of [...SERVICE_COMPANIES.map((c) => c.code), OTHER_COMPANY]) {
    for (const cs of filterCaseStudies(caseStudies, { company: value })) {
      assert.ok(!seen.has(cs.slug), `${cs.slug} matched two company buckets`);
      seen.add(cs.slug);
    }
  }
  assert.equal(seen.size, caseStudies.length);
});

// ── page numbers for the filtered PDF ──────────────────────────────────

test('pageNumbersFor is ascending, deduped, and covers every story', () => {
  const all = pageNumbersFor(caseStudies);
  assert.equal(all.length, caseStudies.length);
  assert.deepEqual(
    all,
    [...all].sort((a, b) => a - b)
  );

  const subset = pageNumbersFor(filterCaseStudies(caseStudies, { region: 'EUR' }));
  assert.ok(subset.length > 0 && subset.length < all.length);
  assert.ok(subset.every((p) => Number.isInteger(p) && p > 0));
});

// ── faceted option counts (Martin's review, Aug 2026) ──────────────────

test('faceted counts never exceed the current result count', () => {
  // The complaint: picking MENA (16) still showed Challenges (21) / SLB (36).
  const query = { region: 'MENA' };
  const results = filterCaseStudies(caseStudies, query);
  const opts = buildFacetedCaseStudyOptions(caseStudies, query);

  assert.ok(results.length > 0, 'MENA should match something');
  for (const facet of [opts.categories, opts.devices, opts.companies]) {
    for (const o of facet) {
      assert.ok(
        o.count <= results.length,
        `${o.value} counted ${o.count} inside a ${results.length}-story subset`
      );
    }
  }
});

test('a facet does not count its own selection, so siblings stay reachable', () => {
  const query = { region: 'MENA' };
  const opts = buildFacetedCaseStudyOptions(caseStudies, query);
  const unfiltered = buildCaseStudyOptions(caseStudies);

  // Region counts ignore the region filter: every region keeps its full count,
  // otherwise the dropdown would read 0 everywhere except MENA and you could
  // never switch away.
  assert.deepEqual(
    opts.regions.map((o) => [o.value, o.count]),
    unfiltered.regions.map((o) => [o.value, o.count])
  );
  assert.ok(opts.regions.filter((o) => o.count > 0).length > 1);
});

test('option order and membership are stable as filters change', () => {
  const unfiltered = buildCaseStudyOptions(caseStudies);
  const narrow = buildFacetedCaseStudyOptions(caseStudies, {
    region: 'MENA',
    text: 'ledge',
  });
  // Same options, same order — only the numbers move. Zero-count entries are
  // kept (the UI disables them) so the list never reshuffles under the cursor.
  assert.deepEqual(
    narrow.categories.map((o) => o.value),
    unfiltered.categories.map((o) => o.value)
  );
  assert.deepEqual(
    narrow.devices.map((o) => o.value),
    unfiltered.devices.map((o) => o.value)
  );
});

test('free text feeds the counts, so dropdowns agree with the cards', () => {
  const query = { text: 'ledge' };
  const results = filterCaseStudies(caseStudies, query);
  const opts = buildFacetedCaseStudyOptions(caseStudies, query);

  assert.ok(results.length > 0 && results.length < caseStudies.length);
  // Region is a facet of its own, but text is not — so region counts DO narrow.
  const regionTotal = opts.regions.reduce((n, o) => n + o.count, 0);
  assert.equal(regionTotal, results.length);
});

test('an empty combination reports 0 rather than disappearing', () => {
  const opts = buildFacetedCaseStudyOptions(caseStudies, {
    text: 'zzzzz-no-such-story',
  });
  const all = buildCaseStudyOptions(caseStudies);
  assert.equal(opts.devices.length, all.devices.length);
  assert.ok(opts.devices.every((o) => o.count === 0));
});

// ── action button labels (one switch, both buttons) ────────────────────

test('Download and Email always carry the SAME label rule', () => {
  // The original bug: Download said "Download 16", Email just said "Email".
  // Whatever the switch is set to, the two must agree.
  for (const [active, count] of [
    [false, 46],
    [true, 16],
    [true, 0],
  ] as [boolean, number][]) {
    const d = actionButtonLabel('Download', active, count);
    const e = actionButtonLabel('Email', active, count);
    assert.equal(
      d.replace(/^Download/, ''),
      e.replace(/^Email/, ''),
      `Download/Email disagree at active=${active} count=${count}`
    );
  }
});

test('"all" marks the unfiltered set regardless of the count switch', () => {
  assert.equal(actionButtonLabel('Download', false, 46), 'Download all');
  assert.equal(actionButtonLabel('Email', false, 46), 'Email all');
});

test('the filtered label follows SHOW_FILTERED_COUNT_ON_ACTIONS', () => {
  const label = actionButtonLabel('Download', true, 16);
  assert.equal(
    label,
    SHOW_FILTERED_COUNT_ON_ACTIONS ? 'Download 16' : 'Download',
    'filtered label must track the switch'
  );
  // Both positions are reachable — this is a flag, not dead code.
  assert.ok(['Download', 'Download 16'].includes(label));
});

// ── internal linking (Search Console audit, 9 Aug 2026) ─────────────────

test('every story with a device resolves to a catalog family', () => {
  const unmapped = caseStudies.filter((cs) => cs.device && !deviceCatalogLink(cs.device));
  assert.deepEqual(
    unmapped.map((cs) => cs.device),
    [],
    'a device value with no catalog family leaves that story without a product link'
  );
});

test('a device naming two lines resolves to the more specific one', () => {
  // "Pathfinder + Wireline Express" is a Pathfinder story first.
  assert.equal(
    deviceCatalogLink('Pathfinder + Wireline Express')?.href,
    '/catalog/guides-holefinders'
  );
  assert.equal(deviceCatalogLink('Wireline Express - FT')?.href, '/catalog/tool-taxis');
  assert.equal(deviceCatalogLink('Focus - CH')?.href, '/catalog/focus-centralisers');
});

test('a device-less story gets no product link rather than a guessed one', () => {
  assert.equal(deviceCatalogLink(''), null);
});

test('every story gets related stories, and never itself', () => {
  for (const cs of caseStudies) {
    const related = relatedCaseStudies(cs, caseStudies);
    assert.ok(related.length > 0, `${cs.slug} has no related stories — it stays a dead end`);
    assert.ok(related.length <= 3, `${cs.slug} returned ${related.length}`);
    assert.ok(!related.some((r) => r.slug === cs.slug), `${cs.slug} links to itself`);
    assert.equal(
      new Set(related.map((r) => r.slug)).size,
      related.length,
      'duplicate related story'
    );
  }
});

test('related stories prefer the same product line', () => {
  const cs = caseStudies.find((c) => c.device === 'Focus - CH');
  assert.ok(cs);
  const top = relatedCaseStudies(cs, caseStudies)[0];
  assert.ok(top);
  assert.equal(deviceCatalogLink(top.device)?.href, '/catalog/focus-centralisers');
});

test('related ordering is stable across runs', () => {
  const cs = caseStudies[0];
  assert.ok(cs);
  assert.deepEqual(
    relatedCaseStudies(cs, caseStudies).map((r) => r.slug),
    relatedCaseStudies(cs, [...caseStudies].reverse()).map((r) => r.slug),
    'related stories must not depend on input order — the static build would churn'
  );
});

test('no story is left with only the hub linking to it', () => {
  const lists = relatedCaseStudyMap(caseStudies);
  const inbound = new Map(caseStudies.map((cs) => [cs.slug, 0]));
  for (const list of lists.values()) {
    for (const other of list) inbound.set(other.slug, (inbound.get(other.slug) ?? 0) + 1);
  }
  const orphans = [...inbound].filter(([, n]) => n === 0).map(([s]) => s);
  assert.deepEqual(
    orphans,
    [],
    "these stories are nobody's neighbour — the crawl dead end is back"
  );
});

test('the coverage pass keeps every list at the limit and self-free', () => {
  const lists = relatedCaseStudyMap(caseStudies);
  assert.equal(lists.size, caseStudies.length);
  for (const [slug, list] of lists) {
    assert.equal(list.length, 3, `${slug} has ${list.length} related stories`);
    assert.ok(!list.some((r) => r.slug === slug), `${slug} links to itself`);
    assert.equal(new Set(list.map((r) => r.slug)).size, list.length, `${slug} has a duplicate`);
  }
});
