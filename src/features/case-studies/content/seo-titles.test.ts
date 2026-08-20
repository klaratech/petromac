import test from 'node:test';
import assert from 'node:assert/strict';
import { caseStudies } from './index';
import { STORY_TITLES, storyTitle } from './seo-titles';

// The root layout template appends " | Petromac" (11 chars); keeping the
// base at ≤49 keeps the SERP title within the ~60-char display budget.
const BASE_BUDGET = 49;

test('every story has a curated SEO title', () => {
  for (const cs of caseStudies) {
    assert.ok(
      STORY_TITLES[cs.slug],
      `story "${cs.slug}" has no entry in STORY_TITLES — new-edition stories ` +
        `need a short title written before they ship (docs/VOCABULARY_MAP.md)`
    );
  }
});

test('no SEO title exceeds the 49-char base budget', () => {
  for (const cs of caseStudies) {
    const t = storyTitle(cs);
    assert.ok(
      t.length <= BASE_BUDGET,
      `"${cs.slug}" title is ${t.length} chars ("${t}") — with " | Petromac" that breaks 60`
    );
  }
});

test('SEO titles are un-branded — the template brands them once', () => {
  for (const cs of caseStudies) {
    const t = storyTitle(cs);
    assert.ok(!t.includes('™'), `"${cs.slug}" title carries ™ — never in metadata`);
    assert.ok(
      !/petromac/i.test(t),
      `"${cs.slug}" title contains "Petromac" — the root template appends the brand`
    );
  }
});

test('no orphaned map entries after a slug change', () => {
  const slugs = new Set(caseStudies.map((cs) => cs.slug));
  for (const key of Object.keys(STORY_TITLES)) {
    assert.ok(slugs.has(key), `STORY_TITLES key "${key}" matches no story slug`);
  }
});
