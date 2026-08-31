const UTF8_BOM = "\uFEFF";

export function escapeCsvCell(value) {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(headers, rows) {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const bodyLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(","),
  );
  return [headerLine, ...bodyLines].join("\n");
}

export function downloadCsv(filename, headers, rows) {
  const csv = UTF8_BOM + buildCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function csvExportFilename(prefix) {
  return `${prefix}-${new Date().toISOString().split("T")[0]}.csv`;
}
