'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailLogEntry } from '@/lib/emailLog';
import { updateEventTag, clearEventTag } from './actions';

interface Props {
  entries: EmailLogEntry[];
  currentEvent: string | null;
}

function formatFilters(f?: EmailLogEntry['filtersApplied']): string {
  if (!f) return '';
  const parts: string[] = [];
  if (f.areas?.length) parts.push(`Areas: ${f.areas.join(', ')}`);
  if (f.companies?.length) parts.push(`Companies: ${f.companies.join(', ')}`);
  if (f.techs?.length) parts.push(`Techs: ${f.techs.join(', ')}`);
  return parts.join('; ');
}

function toLocalDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function toLocalTimeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}

export function EmailLogClient({ entries, currentEvent }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<string>('');

  // Event tag input
  const [eventInput, setEventInput] = useState('');

  const uniqueEvents = useMemo(
    () => [...new Set(entries.map((e) => e.eventTag).filter(Boolean))] as string[],
    [entries]
  );

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (typeFilter && entry.emailType !== typeFilter) return false;
      if (eventFilter && entry.eventTag !== eventFilter) return false;
      if (dateFrom) {
        const entryDate = entry.timestamp.slice(0, 10);
        if (entryDate < dateFrom) return false;
      }
      if (dateTo) {
        const entryDate = entry.timestamp.slice(0, 10);
        if (entryDate > dateTo) return false;
      }
      return true;
    });
  }, [entries, typeFilter, eventFilter, dateFrom, dateTo]);

  const sortedFiltered = useMemo(
    () => [...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [filtered]
  );

  function exportCsv() {
    const header = 'Date,Time,Recipient Email,Type,Filters Applied,Event,Name,Company,Regional Manager';
    const rows = sortedFiltered.map((e) => {
      const date = toLocalDateStr(e.timestamp);
      const time = toLocalTimeStr(e.timestamp);
      const filters = formatFilters(e.filtersApplied);
      return [
        date,
        time,
        e.recipientEmail,
        e.emailType,
        `"${filters}"`,
        e.eventTag || '',
        '', // Name — blank for manual fill
        '', // Company — blank for manual fill
        '', // Regional Manager — blank for manual fill
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSetEvent(formData: FormData) {
    startTransition(async () => {
      await updateEventTag(formData);
      setEventInput('');
      router.refresh();
    });
  }

  function handleClearEvent() {
    startTransition(async () => {
      await clearEventTag();
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Email Log</h1>

        {/* Event Tag Configuration */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Tag</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600">
              Current:{' '}
              <strong className="text-gray-900">
                {currentEvent || 'No event set'}
              </strong>
            </span>
            <form action={handleSetEvent} className="flex items-center gap-2">
              <input
                type="text"
                name="event"
                placeholder="e.g. SPE 2025"
                value={eventInput}
                onChange={(e) => setEventInput(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48"
              />
              <button
                type="submit"
                disabled={isPending || !eventInput.trim()}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Set
              </button>
            </form>
            {currentEvent && (
              <button
                onClick={handleClearEvent}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Filters + Export */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              >
                <option value="">All</option>
                <option value="catalog">Catalog</option>
                <option value="success-stories">Success Stories</option>
                <option value="contact">Contact</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Event</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              >
                <option value="">All</option>
                {uniqueEvents.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={exportCsv}
              disabled={sortedFiltered.length === 0}
              className="ml-auto bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Date/Time</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Filters</th>
                  <th className="px-4 py-3">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No email log entries found.
                    </td>
                  </tr>
                ) : (
                  sortedFiltered.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>{toLocalDateStr(entry.timestamp)}</div>
                        <div className="text-xs text-gray-400">{toLocalTimeStr(entry.timestamp)}</div>
                      </td>
                      <td className="px-4 py-3">{entry.recipientEmail}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            entry.emailType === 'catalog'
                              ? 'bg-blue-100 text-blue-700'
                              : entry.emailType === 'success-stories'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {entry.emailType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                        {formatFilters(entry.filtersApplied) || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">{entry.eventTag || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-gray-400 text-right">
            Showing {sortedFiltered.length} of {entries.length} entries
          </div>
        </section>
      </div>
    </main>
  );
}
