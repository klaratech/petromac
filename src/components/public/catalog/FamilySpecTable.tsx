import Link from 'next/link';
import type { FamilyTableRow } from '@/features/catalog/content/enrich';

export type FamilyColumn = 'role' | 'bearing' | 'hole' | 'bore' | 'temp' | 'weight';

const COLUMN_HEADERS: Record<FamilyColumn, string> = {
  role: 'Role',
  bearing: 'Bearing',
  hole: 'Hole size',
  bore: 'Bore',
  temp: 'Temp',
  weight: 'Weight',
};

function cellValue(row: FamilyTableRow, col: FamilyColumn): string {
  switch (col) {
    case 'role':
      return row.role ?? '—';
    case 'bearing':
      return row.bearing ?? '—';
    case 'hole':
      return row.holeRange;
    case 'bore':
      return row.bore;
    case 'temp':
      return row.temp;
    case 'weight':
      return row.weight;
  }
}

/**
 * Level-2 family spec table (server-rendered). First column is the model
 * (linked to its page); the rest are parsed-spec display values. Scrolls
 * horizontally on narrow screens.
 */
export default function FamilySpecTable({
  rows,
  columns,
  ariaLabel,
}: {
  rows: FamilyTableRow[];
  columns: FamilyColumn[];
  ariaLabel: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200 bg-white shadow-card">
      <table className="min-w-full divide-y divide-slate-200 text-sm" aria-label={ariaLabel}>
        <thead className="bg-slate-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Model
            </th>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
              >
                {COLUMN_HEADERS[col]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.slug} className="group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <Link
                  href={row.href}
                  className="font-semibold text-slate-900 group-hover:text-brand transition-colors"
                >
                  {row.models}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500 max-w-[280px]">{row.name}</p>
              </td>
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 text-slate-600 whitespace-nowrap tabular-nums">
                  {cellValue(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
