import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeCsvCell, toCsvRow } from './csv';

test('escapeCsvCell neutralizes spreadsheet formula prefixes', () => {
  assert.equal(escapeCsvCell('=2+2'), "\"'=2+2\"");
  assert.equal(escapeCsvCell('+SUM(A1:A2)'), "\"'+SUM(A1:A2)\"");
  assert.equal(escapeCsvCell('-10+5'), "\"'-10+5\"");
  assert.equal(escapeCsvCell('@cmd'), "\"'@cmd\"");
});

test('escapeCsvCell escapes quotes, commas and multiline values', () => {
  assert.equal(escapeCsvCell('Hello, "team"'), '"Hello, ""team"""');
  assert.equal(escapeCsvCell('line1\nline2'), '"line1\nline2"');
});

test('toCsvRow escapes all cells and preserves order', () => {
  const row = toCsvRow([
    'user@example.com',
    '=1+1',
    'New York, USA',
    'He said "hi"',
    'row1\nrow2',
  ]);

  assert.equal(
    row,
    '"user@example.com","\'=1+1","New York, USA","He said ""hi""","row1\nrow2"'
  );
});
