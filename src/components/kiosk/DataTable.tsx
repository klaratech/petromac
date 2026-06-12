'use client';

import { useMemo, useState } from 'react';
import useOperationsData, { Operation } from '@/hooks/useOperationsData';

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/* Operation type imported from useOperationsData hook */

function formatCellValue(value: string | number | undefined) {
  return typeof value === 'string' || typeof value === 'number' ? value.toString() : '';
}

export default function DataTableFull() {
  // Staff diagnostic — wants every column from the source xlsx, so points at
  // the full artifact. The public map surfaces and the kiosk dashboard read
  // the 6-column slim file (default URL on the hook).
  const { data: rawData } = useOperationsData<Operation>({
    url: '/data/operations_full.json',
  });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const data = useMemo<Operation[]>(
    () =>
      rawData
        ? rawData.map((row: Operation) => ({
            ...row,
            Month:
              typeof row.Month === 'number' && row.Month >= 1 && row.Month <= 12
                ? monthNames[row.Month - 1]
                : row.Month,
          }))
        : [],
    [rawData]
  );

  const columns = useMemo(() => {
    if (!data[0]) return [];

    return Object.keys(data[0]).map((key, index) => ({
      key,
      canFilter: index !== 7 && key !== 'Remarks',
    }));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.entries(columnFilters).every(([key, filterValue]) =>
        row[key]
          ?.toString()
          .toLowerCase()
          .includes((filterValue as string).toLowerCase())
      )
    );
  }, [data, columnFilters]);

  const totalRows = filteredData.length;
  const successfulJobs = filteredData.filter((row) => row.Successful === 1).length;

  return (
    <div className="p-4 overflow-auto max-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Operations Data Diagnostic</h1>

      <div className="mb-4 text-sm text-gray-600">
        {totalRows} rows, {successfulJobs} successful
      </div>

      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="border p-2 bg-gray-100 text-left align-top">
                <div className="flex flex-col">
                  <span>{column.key}</span>
                  {column.canFilter && (
                    <input
                      type="text"
                      placeholder="Filter"
                      className="border mt-1 px-2 py-1 text-xs rounded"
                      value={columnFilters[column.key] || ''}
                      onChange={(e) =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          [column.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={column.key} className="border p-2">
                  {formatCellValue(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
