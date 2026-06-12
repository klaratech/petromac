const FORMULA_PREFIX = /^[=+\-@]/;

function normalizeCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return FORMULA_PREFIX.test(text) ? `'${text}` : text;
}

export function escapeCsvCell(value: unknown): string {
  const safeValue = normalizeCell(value);
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function toCsvRow(cells: readonly unknown[]): string {
  return cells.map(escapeCsvCell).join(',');
}
