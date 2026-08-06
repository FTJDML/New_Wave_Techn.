// Minimal RFC4180-ish CSV parser — quoted fields, embedded commas/newlines, "" escaping.
// No dependency: import volumes here are small (evidence sources, claims), not worth a package.
export interface ParsedCsv {
  readonly headers: readonly string[];
  readonly rows: readonly Record<string, string>[];
}

export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim().length > 0));
  if (nonEmptyRows.length === 0) return { headers: [], rows: [] };

  const headers = nonEmptyRows[0].map((h) => h.trim());
  const dataRows = nonEmptyRows.slice(1).map((r) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (r[index] ?? '').trim();
    });
    return record;
  });

  return { headers, rows: dataRows };
}
