// @ts-expect-error Node's native TypeScript runner requires the source extension.
import { HrpsCsvError, normalizeHeader, parseCsv, type ParsedCsv } from "../hrps/hrps-csv.ts";
import type { BundyEventType } from "../../types/bundy-import";

export class BundyCsvError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BundyCsvError";
    this.code = code;
  }
}

export type BundyCanonicalField =
  | "bundyLogId"
  | "deviceEmployeeId"
  | "timestamp"
  | "event"
  | "deviceId"
  | "importBatch"
  | "processingStatus"
  | "matchedHrpsEmployeeId";

export type BundyCanonicalHeaders = {
  columns: Map<BundyCanonicalField, number>;
  headerCount: number;
  supported: string[];
  ignored: string[];
};

export type ParsedBundyRow = {
  rowNumber: number;
  bundyLogId: string | null;
  deviceEmployeeId: string | null;
  sourceTimestamp: string | null;
  occurredAt: Date | null;
  event: BundyEventType | null;
  deviceId: string | null;
  sourceBatch: string | null;
  sourceProcessingStatus: string | null;
  sourceMatchedHrpsEmployeeId: string | null;
  errors: string[];
};

const aliases: Record<string, BundyCanonicalField> = {
  bundylogid: "bundyLogId",
  deviceemployeeid: "deviceEmployeeId",
  timestamp: "timestamp",
  event: "event",
  deviceid: "deviceId",
  importbatch: "importBatch",
  processingstatus: "processingStatus",
  matchedhrpsemployeeid: "matchedHrpsEmployeeId",
};

const requiredFields: BundyCanonicalField[] = [
  "bundyLogId",
  "deviceEmployeeId",
  "timestamp",
  "event",
  "deviceId",
];

function clean(value: string | undefined, maxLength: number): string | null {
  const result = value?.trim() ?? "";
  if (!result || result.length > maxLength || result.includes("\u0000")) return null;
  return result;
}

function valueAt(
  row: string[],
  columns: Map<BundyCanonicalField, number>,
  key: BundyCanonicalField,
): string {
  const index = columns.get(key);
  return index === undefined ? "" : row[index] ?? "";
}

export function parseBundyTimestamp(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return null;
  const [date, time] = value.split(" ");
  const parsed = new Date(`${date}T${time}+08:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second] = time.split(":").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    check.getUTCFullYear() !== year
    || check.getUTCMonth() !== month - 1
    || check.getUTCDate() !== day
    || check.getUTCHours() !== hour
    || check.getUTCMinutes() !== minute
    || check.getUTCSeconds() !== second
  ) return null;
  return parsed;
}

export function parseBundyEvent(value: string): BundyEventType | null {
  const normalized = value.trim().toUpperCase();
  return normalized === "IN" || normalized === "OUT" ? normalized : null;
}

export function canonicalizeBundyHeaders(headers: string[]): BundyCanonicalHeaders {
  const columns = new Map<BundyCanonicalField, number>();
  const supported: string[] = [];
  const ignored: string[] = [];

  headers.forEach((header, index) => {
    const canonical = aliases[normalizeHeader(header)];
    if (!canonical) {
      ignored.push(header);
      return;
    }
    if (columns.has(canonical)) {
      throw new BundyCsvError("DUPLICATE_HEADERS", `The CSV maps more than one header to ${canonical}.`);
    }
    columns.set(canonical, index);
    supported.push(header);
  });

  const missing = requiredFields.filter((field) => !columns.has(field));
  if (missing.length) {
    const labels = missing.map((field) => field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`));
    throw new BundyCsvError("MISSING_REQUIRED_HEADERS", `Missing required CSV columns: ${labels.join(", ")}.`);
  }

  return { columns, headerCount: headers.length, supported, ignored };
}

export function parseBundyRows(
  canonical: BundyCanonicalHeaders,
  rows: string[][],
): ParsedBundyRow[] {
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];
    if (row.length > canonical.headerCount) {
      errors.push("The row contains more values than the header row.");
    }

    const bundyLogId = clean(valueAt(row, canonical.columns, "bundyLogId"), 160);
    const deviceEmployeeId = clean(valueAt(row, canonical.columns, "deviceEmployeeId"), 64);
    const sourceTimestamp = clean(valueAt(row, canonical.columns, "timestamp"), 40);
    const eventValue = clean(valueAt(row, canonical.columns, "event"), 20);
    const deviceId = clean(valueAt(row, canonical.columns, "deviceId"), 120);
    const sourceBatch = clean(valueAt(row, canonical.columns, "importBatch"), 160);
    const sourceProcessingStatus = clean(valueAt(row, canonical.columns, "processingStatus"), 80);
    const sourceMatchedHrpsEmployeeId = clean(valueAt(row, canonical.columns, "matchedHrpsEmployeeId"), 64);

    if (!bundyLogId) errors.push("bundy_log_id is required.");
    if (!deviceEmployeeId) errors.push("device_employee_id is required.");
    if (!sourceTimestamp) {
      errors.push("timestamp is required.");
    } else if (!parseBundyTimestamp(sourceTimestamp)) {
      errors.push("timestamp must use a valid YYYY-MM-DD HH:mm:ss value.");
    }
    if (!eventValue) {
      errors.push("event is required.");
    } else if (!parseBundyEvent(eventValue)) {
      errors.push(`event '${eventValue}' is not supported; use IN or OUT.`);
    }
    if (!deviceId) errors.push("device_id is required.");

    return {
      rowNumber,
      bundyLogId,
      deviceEmployeeId,
      sourceTimestamp,
      occurredAt: sourceTimestamp ? parseBundyTimestamp(sourceTimestamp) : null,
      event: eventValue ? parseBundyEvent(eventValue) : null,
      deviceId,
      sourceBatch,
      sourceProcessingStatus,
      sourceMatchedHrpsEmployeeId,
      errors,
    };
  });
}

export function parseBundyCsv(content: string, maxRows = 25000) {
  let parsed: ParsedCsv;
  try {
    parsed = parseCsv(content, maxRows);
  } catch (error) {
    if (error instanceof HrpsCsvError) {
      throw new BundyCsvError(error.code, error.message);
    }
    throw error;
  }
  const canonical = canonicalizeBundyHeaders(parsed.headers);
  return { canonical, rows: parseBundyRows(canonical, parsed.rows) };
}

export const BUNDY_DUPLICATE_SCAN_WINDOW_SECONDS = 60;
