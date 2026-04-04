import { useState } from 'react';

function ReportTable({ data, columns }) {
  const sortableColumn = columns.find((column) => column.sortable);
  const [sortKey, setSortKey] = useState(sortableColumn?.key || '');
  const [sortDir, setSortDir] = useState('desc');

  const sortedData = [...data].sort((left, right) => {
    if (!sortKey) {
      return 0;
    }

    const leftValue = left[sortKey];
    const rightValue = right[sortKey];

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return sortDir === 'asc' ? leftValue - rightValue : rightValue - leftValue;
    }

    return sortDir === 'asc'
      ? String(leftValue).localeCompare(String(rightValue))
      : String(rightValue).localeCompare(String(leftValue));
  });

  const handleSort = (key, sortable) => {
    if (!sortable) {
      return;
    }

    if (sortKey === key) {
      setSortDir((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDir('desc');
  };

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-md">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-gray-100 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-4 font-semibold ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                onClick={() => handleSort(column.key, column.sortable)}
              >
                <span className="inline-flex items-center gap-2">
                  {column.label}
                  {sortKey === column.key && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr key={row.id || `${row[columns[0].key]}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-4 text-slate-700">
                  {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportTable;
