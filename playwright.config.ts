import { defineConfig } from '@playwright/test';

/**
 * The suite drives a PRODUCTION build, not `next dev`. That is deliberate: the
 * URL-migration rules live in `src/proxy.ts`, and middleware, redirect status
 * codes and the 404 rewrite are exactly the things that can differ between dev
 * and a real build — so dev is the wrong thing to assert against.
 *
 * `webServer` means `pnpm test:e2e` just works, with no "start a server first"
 * step. That missing step is part of why this suite rotted unnoticed for a
 * month while it pointed at routes that had been deleted: nothing ran it.
 *
 * Set PLAYWRIGHT_BASE_URL to test a deployed environment instead (e.g.
 * https://test.petromac.co.nz); the local server is then not started at all.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  // One retry in CI only: these cross a real socket, and a cold-start blip
  // should not redden a PR. Locally a failure stays a failure.
  retries: process.env.CI ? 1 : 0,
  // `github` annotates the failing assertion inline on the PR diff; `html`
  // leaves a report behind to upload as an artifact.
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: process.env.CI ? 'retain-on-failure' : 'off',
  },
  // Spread rather than `webServer: undefined`: this repo runs tsc with
  // `exactOptionalPropertyTypes`, under which an explicit undefined is a type
  // error even where the property is optional. The key has to be absent.
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          // `next start` serves the build from `pnpm build` — run that first.
          command: 'pnpm start',
          url: 'http://localhost:3000',
          // Locally, reuse a dev server that is already up rather than fighting
          // it for the port. In CI always start clean.
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          stdout: 'ignore' as const,
          stderr: 'pipe' as const,
        },
      }),
});
