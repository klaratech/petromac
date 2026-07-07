import { test, expect } from '@playwright/test';

test('public home loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Petromac/i);
  await expect(page.getByRole('banner')).toBeVisible();
});

test('catalog flipbook loads', async ({ page }) => {
  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: /product catalog/i })).toBeVisible();
});

test('success stories loads', async ({ page }) => {
  await page.goto('/success-stories/flipbook');
  await expect(page.getByRole('heading', { name: /success stories/i })).toBeVisible();
});

test('success stories filters update results', async ({ page }) => {
  await page.goto('/success-stories/flipbook');
  // The default-state subtitle was removed (Jul 2026); the filter panel
  // being interactive is the readiness signal instead.
  await expect(page.getByLabel('Area multiselect')).toBeVisible();

  await page.getByLabel('Area multiselect').click();
  const firstOption = page.getByRole('option').first();
  await firstOption.click();
  await page.keyboard.press('Escape');

  await expect(
    page.getByText(/^Showing \d+ of \d+ stories that match your filters\.$/)
  ).toBeVisible();
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
