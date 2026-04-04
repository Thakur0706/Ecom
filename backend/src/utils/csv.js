function escapeValue(value) {
  const safeValue = value ?? '';
  const text = String(safeValue);

  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(rows) {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeValue).join(',');
  const lines = rows.map((row) => headers.map((header) => escapeValue(row[header])).join(','));

  return [headerLine, ...lines].join('\n');
}
