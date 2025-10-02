'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Operation {
  [key: string]: string | number;
}

export default function DataTableFull() {
  const [data, setData] = useState<Operation[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/data/operations_data.json', { cache: 'force-cache' })
      .then((res) => res.json())
      .then((json: Operation[]) => {
        const withMonthNames = json.map((row) => ({
          ...row,
          Month:
            typeof row.Month === 'number' && row.Month >= 1 && row.Month <= 12
              ? monthNames[row.Month - 1]
              : row.Month,
        }));
        setData(withMonthNames);
      });
  }, []);

  const columns = useMemo<ColumnDef<Operation>[]>(() => {
    if (!data[0]) return [];

    return Object.keys(data[0]).map((key, index) => {
      const skipFilter = index === 7 || key === 'Remarks';

      return {
        accessorKey: key,
        header: () => (
          <div className="flex flex-col">
            <span>{key}</span>
            {!skipFilter && (
              <input
                type="text"
                placeholder="Filter"
                className="border mt-1 px-2 py-1 text-xs rounded"
                value={columnFilters[key] || ''}
                onChange={(e) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
              />
            )}
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return typeof value === 'string' || typeof value === 'number'
            ? value.toString()
            : '';
        },
      };
    });
  }, [data, columnFilters]);

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.entries(columnFilters).every(([key, filterValue]) =>
        row[key]?.toString().toLowerCase().includes(filterValue.toLowerCase())
      )
    );
  }, [data, columnFilters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

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
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border p-2 bg-gray-100 text-left align-top">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
