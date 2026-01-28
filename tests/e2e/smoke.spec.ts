import { test, expect } from '@playwright/test';

const intranetUser = process.env.INTRANET_USER;
const intranetPass = process.env.INTRANET_PASS;

test('public home loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Petromac/i);
  await expect(page.getByRole('banner')).toBeVisible();
});

test('success stories loads', async ({ page }) => {
  await page.goto('/success-stories/flipbook');
  await expect(page.getByRole('heading', { name: /success stories/i })).toBeVisible();
});

test.describe('kiosk', () => {
  test.skip(!intranetUser || !intranetPass, 'INTRANET_USER/INTRANET_PASS not configured');

  test.use({ httpCredentials: { username: intranetUser || '', password: intranetPass || '' } });

  test('kiosk entry loads', async ({ page }) => {
    await page.goto('/intranet/kiosk');
    await expect(page.getByText(/Petromac/i)).toBeVisible();
  });
});
