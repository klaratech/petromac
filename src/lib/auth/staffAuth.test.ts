import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeReturnTo } from './staffAuth';

test('normalizeReturnTo accepts safe intranet paths', () => {
  assert.equal(normalizeReturnTo('/intranet'), '/intranet');
  assert.equal(normalizeReturnTo('/intranet/kiosk/dashboard'), '/intranet/kiosk/dashboard');
  assert.equal(normalizeReturnTo('/intranet/kiosk?tab=overview#top'), '/intranet/kiosk?tab=overview#top');
});

test('normalizeReturnTo rejects unsafe values', () => {
  assert.equal(normalizeReturnTo('//evil.com'), '/intranet');
  assert.equal(normalizeReturnTo('https://evil.com/path'), '/intranet');
  assert.equal(normalizeReturnTo('/intranet\\kiosk'), '/intranet');
  assert.equal(normalizeReturnTo('\\\\evil.com'), '/intranet');
  assert.equal(normalizeReturnTo('not-a-path'), '/intranet');
});

test('normalizeReturnTo falls back to intranet for invalid or non-intranet paths', () => {
  assert.equal(normalizeReturnTo('/'), '/intranet');
  assert.equal(normalizeReturnTo('/catalog'), '/intranet');
  assert.equal(normalizeReturnTo(null), '/intranet');
  assert.equal(normalizeReturnTo(undefined), '/intranet');
  assert.equal(normalizeReturnTo(''), '/intranet');
});
