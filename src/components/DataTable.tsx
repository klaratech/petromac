'use client';

import { useEffect, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  HeaderGroup,
  Row,
  Cell
} from '@tanstack/react-table';

interface Operation {
  Region: string;
  Country: string;
  Successful: number;
  Job_Status: string;
  [key: string]: unknown;
}

// Replace with your actual canonical country list
const knownCountries = new Set([
  'United States', 'India', 'Mexico', 'Nigeria', 'New Zealand',
  'Australia', 'China', 'KSA', 'Kuwait', 'Gulf of Mexico', 'Azerbaijan'
]);

export default function DataTable() {
  const [data, setData] = useState<Operation[]>([]);

  useEffect(() => {
    fetch('/data/operations_data.json')
      .then((res) => res.json())
      .then((json: Operation[]) => setData(json));
  }, []);

  const columns: ColumnDef<Operation>[] = [
    {
      header: 'Region',
      accessorKey: 'Region',
      cell: ({ getValue }) => {
        const value = getValue<string>();
        return value || <span className="text-red-500">Missing</span>;
      }
    },
    {
      header: 'Country',
      accessorKey: 'Country',
      cell: ({ getValue }) => {
        const value = getValue<string>();
        if (!value) return <span className="text-red-500">Missing</span>;
        return knownCountries.has(value)
          ? value
          : <span className="text-orange-600">{value} ⚠</span>;
      }
    },
    {
      header: 'Successful',
      accessorKey: 'Successful',
      cell: ({ getValue }) => {
        const val = getValue<unknown>();
        return typeof val === 'number'
          ? val
          : <span className="text-red-500">Invalid</span>;
      }
    },
    {
      header: 'Job Status',
      accessorKey: 'Job_Status'
    }
  ];

  const table = useReactTable<Operation>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="p-4 overflow-auto max-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Country Mapping Diagnostic</h1>
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<Operation>) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border p-2 bg-gray-100 text-left">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: Row<Operation>) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell: Cell<Operation, unknown>) => (
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