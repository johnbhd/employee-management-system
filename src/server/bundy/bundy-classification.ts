import type {
  BundyEmployeeMatch,
  BundyPreviewRow,
} from "../../types/bundy-import";
import type { ParsedBundyRow } from "./bundy-csv";

export type BundyEmployeeRecord = {
  id: string;
  employeeId: string;
  displayName: string;
  department: string;
  employmentStatus: "active" | "inactive";
};

export type BundyExistingEvent = {
  sourceLogId: string;
  deviceEmployeeId: string;
  sourceTimestamp: string;
  event: "IN" | "OUT";
  deviceId: string;
};

export const BUNDY_DUPLICATE_SCAN_WINDOW_SECONDS = 60;

function employeeMatch(employee: BundyEmployeeRecord | null): BundyEmployeeMatch | null {
  if (!employee) return null;
  return {
    employeeId: employee.employeeId,
    displayName: employee.displayName,
    department: employee.department,
    employmentStatus: employee.employmentStatus,
  };
}

function sameSourceEvent(left: ParsedBundyRow, right: BundyExistingEvent) {
  return left.deviceEmployeeId === right.deviceEmployeeId
    && left.sourceTimestamp === right.sourceTimestamp
    && left.event === right.event
    && left.deviceId === right.deviceId;
}

function rowSourceFingerprint(row: ParsedBundyRow) {
  return [row.deviceEmployeeId, row.sourceTimestamp, row.event, row.deviceId].join("|");
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

function addAnomaly(row: BundyPreviewRow, code: string) {
  if (!row.anomalyCodes.includes(code)) row.anomalyCodes.push(code);
}

function applyDayPatternAnomalies(rows: BundyPreviewRow[]) {
  const grouped = new Map<string, BundyPreviewRow[]>();
  for (const row of rows) {
    if (row.validationStatus !== "VALID" || !row.deviceEmployeeId || !row.occurredAt || !row.event) continue;
    const key = `${row.deviceEmployeeId}|${localDateKey(new Date(row.occurredAt))}`;
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  for (const group of grouped.values()) {
    const hasIn = group.some((row) => row.event === "IN");
    const hasOut = group.some((row) => row.event === "OUT");
    if (!hasIn) group.forEach((row) => addAnomaly(row, "MISSING_IN_PATTERN"));
    if (!hasOut) group.forEach((row) => addAnomaly(row, "MISSING_OUT_PATTERN"));
  }
}

export function classifyBundyRows(
  parsedRows: ParsedBundyRow[],
  employees: ReadonlyMap<string, BundyEmployeeRecord>,
  existingEvents: ReadonlyMap<string, BundyExistingEvent> = new Map(),
): BundyPreviewRow[] {
  const rows: BundyPreviewRow[] = [];
  const seenSourceEvents = new Map<string, ParsedBundyRow>();

  for (const parsed of parsedRows) {
    const employee = parsed.deviceEmployeeId ? employees.get(parsed.deviceEmployeeId) ?? null : null;
    const matchStatus = employee
      ? employee.employmentStatus === "inactive" ? "EMPLOYEE_INACTIVE" : "MATCHED"
      : parsed.deviceEmployeeId ? "UNMATCHED" : null;
    const row: BundyPreviewRow = {
      rowNumber: parsed.rowNumber,
      bundyLogId: parsed.bundyLogId,
      deviceEmployeeId: parsed.deviceEmployeeId,
      sourceTimestamp: parsed.sourceTimestamp,
      occurredAt: parsed.occurredAt?.toISOString() ?? null,
      event: parsed.event,
      deviceId: parsed.deviceId,
      sourceBatch: parsed.sourceBatch,
      sourceProcessingStatus: parsed.sourceProcessingStatus,
      sourceMatchedHrpsEmployeeId: parsed.sourceMatchedHrpsEmployeeId,
      employee: employeeMatch(employee),
      matchStatus,
      validationStatus: parsed.errors.length ? "INVALID" : "VALID",
      duplicateStatus: "UNIQUE",
      importAction: parsed.errors.length ? "INVALID" : "IMPORT",
      anomalyCodes: [],
      errors: [...parsed.errors],
      warnings: [],
    };

    if (row.validationStatus === "VALID" && row.bundyLogId) {
      const existing = existingEvents.get(row.bundyLogId);
      if (existing) {
        row.importAction = sameSourceEvent(parsed, existing) ? "ALREADY_IMPORTED" : "SOURCE_CONFLICT";
        if (row.importAction === "SOURCE_CONFLICT") {
          row.errors.push("This bundy_log_id already exists with different source values; the original event was not overwritten.");
        }
      }

      const previousInFile = seenSourceEvents.get(row.bundyLogId);
      if (previousInFile) {
        row.importAction = rowSourceFingerprint(parsed) === rowSourceFingerprint(previousInFile)
          ? "ALREADY_IMPORTED"
          : "SOURCE_CONFLICT";
        if (row.importAction === "SOURCE_CONFLICT") {
          row.errors.push("The same bundy_log_id appears more than once with conflicting source values.");
        }
      } else {
        seenSourceEvents.set(row.bundyLogId, parsed);
      }
    }

    if (
      row.validationStatus === "VALID"
      && row.sourceMatchedHrpsEmployeeId
      && row.sourceMatchedHrpsEmployeeId !== row.employee?.employeeId
    ) {
      addAnomaly(row, "SOURCE_MATCH_CONFLICT");
      row.warnings.push("The source HRPS match differs from the PostgreSQL Employee lookup; the server match is authoritative.");
    }

    if (row.matchStatus === "UNMATCHED") {
      row.warnings.push("No PostgreSQL Employee matched this device_employee_id; the raw event remains unlinked.");
    }
    if (row.matchStatus === "EMPLOYEE_INACTIVE") {
      row.warnings.push("The Employee exists but is inactive; the raw event remains linked with an inactive warning.");
    }

    rows.push(row);
  }

  const latestByDuplicateKey = new Map<string, BundyPreviewRow>();
  const duplicateCandidates = rows
    .filter((row) => row.validationStatus === "VALID" && row.occurredAt && row.event && row.deviceEmployeeId && row.deviceId)
    .sort((left, right) => (
      new Date(left.occurredAt!).getTime() - new Date(right.occurredAt!).getTime()
      || left.rowNumber - right.rowNumber
    ));
  for (const row of duplicateCandidates) {
    const duplicateKey = `${row.deviceEmployeeId}|${row.event}|${row.deviceId}`;
    const previous = latestByDuplicateKey.get(duplicateKey);
    if (previous?.occurredAt) {
      const difference = Math.abs(new Date(row.occurredAt!).getTime() - new Date(previous.occurredAt).getTime()) / 1000;
      if (difference <= BUNDY_DUPLICATE_SCAN_WINDOW_SECONDS) {
        row.duplicateStatus = "DUPLICATE_SCAN";
        addAnomaly(row, "DUPLICATE_SCAN");
        row.warnings.push(`Rapid duplicate scan within ${BUNDY_DUPLICATE_SCAN_WINDOW_SECONDS} seconds of row ${previous.rowNumber}.`);
      }
    }
    latestByDuplicateKey.set(duplicateKey, row);
  }

  applyDayPatternAnomalies(rows);
  return rows;
}
