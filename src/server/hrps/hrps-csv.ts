export class HrpsCsvError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HrpsCsvError";
    this.code = code;
  }
}

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

function pushField(row: string[], field: string) {
  row.push(field);
}

export function parseCsv(text: string, maxRows = 10000): ParsedCsv {
  const source = text.replace(/^\uFEFF/, "");

  if (!source.trim()) {
    throw new HrpsCsvError("EMPTY_FILE", "The uploaded CSV is empty.");
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldStarted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      if (fieldStarted || field.length > 0) {
        throw new HrpsCsvError("MALFORMED_CSV", "A quoted field started after other field content.");
      }
      inQuotes = true;
      fieldStarted = true;
      continue;
    }

    if (character === ",") {
      pushField(row, field);
      field = "";
      fieldStarted = false;
      continue;
    }

    if (character === "\n" || character === "\r") {
      pushField(row, field);
      field = "";
      fieldStarted = false;

      if (row.some((value) => value.trim())) {
        rows.push(row);
        if (rows.length > maxRows + 1) {
          throw new HrpsCsvError("TOO_MANY_ROWS", `The CSV cannot contain more than ${maxRows} data rows.`);
        }
      }
      row = [];
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      continue;
    }

    field += character;
    fieldStarted = true;
  }

  if (inQuotes) {
    throw new HrpsCsvError("MALFORMED_CSV", "The CSV contains an unclosed quoted field.");
  }

  if (field.length > 0 || row.length > 0) {
    pushField(row, field);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  if (rows.length === 0) {
    throw new HrpsCsvError("EMPTY_FILE", "The uploaded CSV has no header row.");
  }

  if (rows.length - 1 > maxRows) {
    throw new HrpsCsvError("TOO_MANY_ROWS", `The CSV cannot contain more than ${maxRows} data rows.`);
  }

  const headers = rows.shift()!.map((header) => header.trim());
  if (headers.some((header) => !header)) {
    throw new HrpsCsvError("INVALID_HEADERS", "CSV headers cannot be empty.");
  }

  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
    throw new HrpsCsvError("DUPLICATE_HEADERS", "The CSV contains duplicate headers.");
  }

  return { headers, rows };
}

export function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
