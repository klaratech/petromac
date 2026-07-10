import type { SpecTable } from '@/features/catalog/content/types';

/**
 * Renders a spec table from the content model as a real HTML table.
 * Merged cells from the print catalog arrive as trailing empty values —
 * those are collapsed into a colSpan so "26 lbs" spans both model columns,
 * matching the printed layout.
 */
export default function SpecTableView({ table }: { table: SpecTable }) {
  const cols = Math.max(...table.rows.map((r) => r.values.length)) + 1;
  const notes: string[] = [];

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {table.title && (
            <caption className="bg-brand text-white font-heading font-semibold text-left px-4 py-2.5">
              {table.title}
            </caption>
          )}
          <tbody>
            {table.rows.map((row, ri) => {
              const isModelRow = row.label === 'Model';
              let noteMark: number | null = null;
              if (row.note) {
                notes.push(row.note);
                noteMark = notes.length;
              }
              // Collapse trailing empty values into a colSpan on the last
              // non-empty cell (merged cells in the print layout).
              const cells: { value: string; span: number }[] = [];
              row.values.forEach((v) => {
                if (v === '' && cells.length > 0) {
                  cells[cells.length - 1].span += 1;
                } else {
                  cells.push({ value: v, span: 1 });
                }
              });
              const usedCols = cells.reduce((n, c) => n + c.span, 0);
              if (cells.length > 0) cells[cells.length - 1].span += cols - 1 - usedCols;

              const ValueCell = isModelRow ? 'th' : 'td';
              return (
                <tr
                  key={ri}
                  className={
                    isModelRow ? 'bg-slate-100' : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }
                >
                  <th
                    scope="row"
                    className="text-left align-top font-semibold text-slate-800 px-4 py-2 border-t border-slate-200 w-[45%]"
                  >
                    {row.label}
                    {noteMark && <sup className="text-brand font-bold ml-0.5">{noteMark}</sup>}
                  </th>
                  {cells.map((c, ci) => (
                    <ValueCell
                      key={ci}
                      scope={isModelRow ? 'col' : undefined}
                      colSpan={c.span > 1 ? c.span : undefined}
                      className={`align-top px-4 py-2 border-t border-l border-slate-200 text-slate-600 ${
                        isModelRow ? 'font-semibold text-slate-800 text-center' : ''
                      } ${c.span > 1 ? 'text-center' : ''}`}
                    >
                      {c.value}
                    </ValueCell>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {notes.length > 0 && (
        <ol className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 space-y-1">
          {notes.map((n, i) => (
            <li key={i}>
              <sup className="text-brand font-bold mr-1">{i + 1}</sup>
              {n}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
