import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ columns, data, pageSize = 8, onRowClick, emptyMessage = 'No records found.' }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  let sorted = [...data];
  if (sortKey) {
    sorted.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  if (data.length === 0) {
    return <div className="py-14 text-center text-sm text-ink-400">{emptyMessage}</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-100 dark:border-ink-800">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {col.sortable !== false ? (
                    <button className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-100" onClick={() => handleSort(col.key)}>
                      {col.label}
                      {sortKey === col.key ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-ink-50 dark:border-ink-800/60 ${onRowClick ? 'cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-850' : ''} transition-colors`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-3 py-3 text-ink-600 dark:text-ink-200">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
          <span>Page {page} of {totalPages} · {sorted.length} records</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
