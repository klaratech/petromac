import { test, expect } from '@playwright/test';

test('public home loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Petromac/i);
  await expect(page.getByRole('banner')).toBeVisible();
});

test('catalog loads with search, and family pages deep-link to products', async ({ page }) => {
  await page.goto('/catalog');
  // House spelling is "catalog", never "catalogue" — see CLAUDE.md.
  await expect(page.getByRole('heading', { name: 'Product Catalog' })).toBeVisible();
  await expect(page.getByLabel('Search the catalog')).toBeVisible();

  // Categories became their own SSG pages in the Jul 2026 three-level
  // restructure; the old ?category= view is a redirect, covered below.
  await page.goto('/catalog/focus-centralisers');
  await page.getByRole('link', { name: /CX9/i }).first().click();
  await expect(page).toHaveURL(/\/catalog\/focus-centralisers\/cx9/);
  // Spec tables are real HTML tables on the product page.
  await expect(page.getByRole('table').first()).toBeVisible();
});

test('track record links to the case studies', async ({ page }) => {
  await page.goto('/track-record');
  await page.getByRole('link', { name: /read the success stories/i }).click();
  await expect(page).toHaveURL(/\/case-studies$/);
  await expect(page.getByRole('heading', { name: 'Case Studies' })).toBeVisible();
  await expect(page.getByRole('banner')).toBeVisible();
});

test('case studies index filters down to a subset', async ({ page }) => {
  await page.goto('/case-studies');
  // All 46 cards are server-rendered, so they exist before hydration.
  const cards = page.locator('a[href^="/case-studies/"]');
  const total = await cards.count();
  expect(total).toBeGreaterThan(1);

  // Narrowing by challenge must reduce the set. Selected by VALUE, which keeps
  // the "Well Access: " prefix — the visible label drops it via categoryLabel(),
  // so this also pins the value/label split that keeps the bare "Well Access"
  // story from collapsing into a sibling.
  const challenge = page.getByLabel('Challenge');
  await expect(challenge.locator('option', { hasText: /^Deviation \(\d+\)$/ })).toHaveCount(1);
  await challenge.selectOption('Well Access: Deviation');
  await expect(async () => {
    expect(await cards.count()).toBeLessThan(total);
  }).toPass();
});

test('a case study page renders its own content', async ({ page }) => {
  await page.goto('/case-studies/stick-slip');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('banner')).toBeVisible();
});

test.describe('WordPress-migration URLs', () => {
  // The unit tests in src/lib/redirects.test.ts assert the mapping table; these
  // confirm the proxy is actually wired in and the destinations render. The
  // retired routes used to be asserted here as live pages, which is why this
  // file went stale — it navigated to /success-stories/flipbook for months
  // after that route was deleted.
  const cases: [string, RegExp][] = [
    ['/contacts/', /\/contact$/],
    ['/contacts', /\/contact$/],
    ['/patents/', /\/about\/patents$/],
    ['/success-stories/flipbook', /\/case-studies$/],
    ['/stick-slip/', /\/case-studies\/stick-slip$/],
    ['/track-record?stories=1', /\/case-studies$/],
    ['/catalog?category=focus-centralisers', /\/catalog\/focus-centralisers$/],
  ];

  for (const [from, to] of cases) {
    test(`${from} lands on its replacement`, async ({ page }) => {
      const response = await page.goto(from);
      await expect(page).toHaveURL(to);
      expect(response?.status()).toBe(200);
    });
  }

  test('dead WordPress feeds are gone, not merely missing', async ({ request }) => {
    // 410 rather than 404 so Google drops them promptly.
    for (const url of ['/feed/', '/comments/feed/', '/stick-slip/feed/']) {
      expect((await request.get(url)).status(), url).toBe(410);
    }
  });

  test('junk query strings 404 but campaign links do not', async ({ request }) => {
    expect((await request.get('/?11667727895.html')).status()).toBe(404);
    // Valued params are real inbound traffic — srsltid is appended by Google.
    for (const q of ['?utm_source=linkedin', '?gclid=abc', '?srsltid=xyz']) {
      expect((await request.get(`/${q}`)).status(), q).toBe(200);
    }
  });
});

test('success stories PDF endpoint returns 200', async ({ request }) => {
  const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  test.skip(
    !apiBase,
    'Set PLAYWRIGHT_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL to test the FastAPI PDF endpoint.'
  );

  const response = await request.post(`${apiBase}/api/pdf/success-stories`, {
    data: { pageNumbers: [1, 2], mode: 'preview' },
  });
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test.describe('kiosk', () => {
  test('kiosk entry loads', async ({ page }) => {
    await page.goto('/intranet/kiosk');
    await expect(page.getByText(/Petromac/i)).toBeVisible();
  });
});
