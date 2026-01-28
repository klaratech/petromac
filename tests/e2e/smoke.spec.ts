import { test, expect } from '@playwright/test';

const intranetUser = process.env.INTRANET_USER;
const intranetPass = process.env.INTRANET_PASS;

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
  const countLocator = page.getByText(/Showing \d+ of \d+ success stories/i);
  await expect(countLocator).toBeVisible();
  const initialText = await countLocator.textContent();

  await page.getByLabel('Area multiselect').click();
  const firstOption = page.getByRole('option').first();
  await firstOption.click();
  await page.keyboard.press('Escape');

  await expect(countLocator).not.toHaveText(initialText || '');
});

test('success stories PDF endpoint returns 200', async ({ request }) => {
  const response = await request.post('/api/pdf/success-stories', {
    data: { pageNumbers: [1, 2], mode: 'preview' },
  });
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test.describe('kiosk', () => {
  test.skip(!intranetUser || !intranetPass, 'INTRANET_USER/INTRANET_PASS not configured');

  test.use({ httpCredentials: { username: intranetUser || '', password: intranetPass || '' } });

  test('kiosk entry loads', async ({ page }) => {
    await page.goto('/intranet/kiosk');
    await expect(page.getByText(/Petromac/i)).toBeVisible();
  });
});
