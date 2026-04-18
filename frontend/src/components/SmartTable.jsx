import { useMemo, useState } from 'react';

function downloadCsv(filename, rows) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? '';
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SmartTable({
  title,
  rows,
  columns,
  searchPlaceholder = 'Search',
  exportName = 'export.csv',
  pageSize = 8,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(columns[0]?.key || '');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const baseRows = normalizedSearch
      ? rows.filter((row) =>
          columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(normalizedSearch)),
        )
      : rows;

    const sorted = [...baseRows].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
      }

      return sortDirection === 'asc'
        ? String(leftValue ?? '').localeCompare(String(rightValue ?? ''))
        : String(rightValue ?? '').localeCompare(String(leftValue ?? ''));
    });

    return sorted;
  }, [columns, rows, search, sortDirection, sortKey]);

  const totalPages = Math.max(Math.ceil(filteredRows.length / pageSize), 1);
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredRows.length} result{filteredRows.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                exportName,
                filteredRows.map((row) =>
                  columns.reduce((accumulator, column) => {
                    accumulator[column.label] = row[column.key];
                    return accumulator;
                  }, {}),
                ),
              )
            }
            className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="pb-4 font-semibold">
                  <button type="button" onClick={() => handleSort(column.key)} className="inline-flex items-center gap-2">
                    {column.label}
                    {sortKey === column.key ? (sortDirection === 'asc' ? 'A' : 'D') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedRows.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((column) => (
                  <td key={column.key} className="py-4 text-slate-700">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page === 1}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default SmartTable;
