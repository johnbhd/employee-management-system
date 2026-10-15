import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { checkPostgresHealth } from "@/lib/prisma/server";
import { recordAuditEvent } from "@/server/repositories/audit/audit.repository";
import {
  countBundyEmployees,
  createBundyImport,
  createBundyRawEvents,
  findBundyEmployees,
  findBundyEventsBySourceLogIds,
  listBundyImports,
  listBundyRawEvents,
  updateBundyImport,
} from "@/server/repositories/bundy/bundy.repository";
import { classifyBundyRows } from "./bundy-classification";
import { findUserIdByFirebaseUid, toJson, toActorSnapshot } from "@/server/repositories/prisma/prisma-repository-helpers";
import type { SessionUser } from "@/types/auth";
import type {
  BundyImportHistoryData,
  BundyImportPreview,
  BundyImportResult,
  BundyImportSummary,
  BundyPageData,
  BundyPreviewRow,
  BundyRawEventData,
} from "@/types/bundy-import";
import {
  BundyCsvError,
  parseBundyCsv,
} from "./bundy-csv";

export const BUNDY_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const BUNDY_MAX_ROWS = 25000;

export class BundyImportError extends Error {
  readonly code: string;
  readonly status: 400 | 409 | 503;

  constructor(code: string, message: string, status: 400 | 409 | 503 = 400) {
    super(message);
    this.name = "BundyImportError";
    this.code = code;
    this.status = status;
  }
}

function safeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() ?? "bundy-import.csv";
  return base.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 255) || "bundy-import.csv";
}

function hashContent(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function emptySummary(): BundyImportSummary {
  return {
    totalRows: 0,
    inCount: 0,
    outCount: 0,
    matchedCount: 0,
    unmatchedCount: 0,
    inactiveCount: 0,
    duplicateScanCount: 0,
    alreadyImportedCount: 0,
    invalidCount: 0,
    sourceConflictCount: 0,
    importedCount: 0,
  };
}

function summarizeRows(rows: BundyPreviewRow[]): BundyImportSummary {
  const summary = emptySummary();
  summary.totalRows = rows.length;
  for (const row of rows) {
    if (row.event === "IN") summary.inCount += 1;
    if (row.event === "OUT") summary.outCount += 1;
    if (row.validationStatus === "INVALID") summary.invalidCount += 1;
    if (row.matchStatus === "MATCHED") summary.matchedCount += 1;
    if (row.matchStatus === "UNMATCHED") summary.unmatchedCount += 1;
    if (row.matchStatus === "EMPLOYEE_INACTIVE") summary.inactiveCount += 1;
    if (row.duplicateStatus === "DUPLICATE_SCAN") summary.duplicateScanCount += 1;
    if (row.importAction === "ALREADY_IMPORTED") summary.alreadyImportedCount += 1;
    if (row.importAction === "SOURCE_CONFLICT") summary.sourceConflictCount += 1;
    if (row.importAction === "IMPORT") summary.importedCount += 1;
  }
  return summary;
}

async function preparePreview(content: string, filename: string): Promise<BundyImportPreview> {
  if (Buffer.byteLength(content, "utf8") > BUNDY_MAX_FILE_BYTES) {
    throw new BundyImportError("FILE_TOO_LARGE", "The Bundy CSV must be 5 MB or smaller.");
  }

  let parsed;
  try {
    parsed = parseBundyCsv(content, BUNDY_MAX_ROWS);
  } catch (error) {
    if (error instanceof BundyCsvError) throw new BundyImportError(error.code, error.message);
    throw new BundyImportError("CSV_INVALID", "The Bundy CSV could not be read safely.");
  }

  const health = await checkPostgresHealth();
  if (!health.connected) {
    throw new BundyImportError("DATABASE_UNAVAILABLE", "PostgreSQL is temporarily unavailable. No Bundy data was changed.", 503);
  }

  const employeeCount = await countBundyEmployees();
  if (employeeCount === 0) {
    throw new BundyImportError(
      "HRPS_PREREQUISITE_REQUIRED",
      "HRPS employee data must be synchronized before Bundy attendance can be matched.",
      409,
    );
  }

  const employeeIds = [...new Set(parsed.rows.map((row) => row.deviceEmployeeId).filter((value): value is string => Boolean(value)))];
  const sourceLogIds = [...new Set(parsed.rows.map((row) => row.bundyLogId).filter((value): value is string => Boolean(value)))];
  const [employees, existingEvents] = await Promise.all([
    findBundyEmployees(employeeIds),
    findBundyEventsBySourceLogIds(sourceLogIds),
  ]);
  const rows = classifyBundyRows(parsed.rows, employees, existingEvents);
  return {
    previewToken: hashContent(content),
    filename: safeFilename(filename),
    supportedHeaders: parsed.canonical.supported,
    ignoredHeaders: parsed.canonical.ignored,
    devices: [...new Set(rows.map((row) => row.deviceId).filter((value): value is string => Boolean(value)))].sort(),
    sourceBatches: [...new Set(rows.map((row) => row.sourceBatch).filter((value): value is string => Boolean(value)))].sort(),
    employeesAvailable: employeeCount,
    rows,
    summary: summarizeRows(rows),
  };
}

export async function buildBundyImportPreview(content: string, filename: string) {
  return preparePreview(content, filename);
}

function safeFailureMessage(error: unknown) {
  if (error instanceof BundyImportError) return error.message;
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return `Database operation failed (${error.code}).`;
  }
  return "The Bundy import could not be completed safely.";
}

function auditInput(actor: SessionUser, input: {
  eventType: string;
  outcome: "Successful" | "Failed";
  summary: string;
  importId: string;
  filename: string;
  status: string;
  counts: BundyImportSummary;
}) {
  return recordAuditEvent({
    eventType: input.eventType,
    action: input.eventType === "bundy.import.failed" ? "Bundy Import Failed" : "Bundy Import Completed",
    module: "Bundy Integration",
    actor: { type: "user", uid: actor.uid, displayName: actor.displayName, role: actor.role },
    target: { type: "bundy_import", id: input.importId, reference: input.importId, label: input.filename },
    outcome: input.outcome,
    summary: input.summary,
    metadata: {
      importId: input.importId,
      filename: input.filename,
      status: input.status,
      totalRows: input.counts.totalRows,
      importedCount: input.counts.importedCount,
      unmatchedCount: input.counts.unmatchedCount,
      duplicateScanCount: input.counts.duplicateScanCount,
      invalidCount: input.counts.invalidCount,
      sourceConflictCount: input.counts.sourceConflictCount,
    },
  });
}

export async function synchronizeBundyImport(input: {
  content: string;
  filename: string;
  previewToken: string;
  actor: SessionUser;
}): Promise<BundyImportResult> {
  const preview = await preparePreview(input.content, input.filename);
  if (preview.previewToken !== input.previewToken) {
    throw new BundyImportError("PREVIEW_CHANGED", "The uploaded file changed after preview. Upload it again before confirming.", 409);
  }

  const actorUserId = await findUserIdByFirebaseUid(input.actor.uid);
  const startedAt = new Date();
  const history = await createBundyImport({
    filename: preview.filename,
    contentHash: preview.previewToken,
    initiatedByUserId: actorUserId,
    initiatedBySnapshot: toJson(toActorSnapshot(input.actor)),
    startedAt,
    status: "PROCESSING",
    summary: preview.summary,
    devices: preview.devices,
    sourceBatches: preview.sourceBatches,
  });

  try {
    const employeeIds = [...new Set(preview.rows.map((row) => row.deviceEmployeeId).filter((value): value is string => Boolean(value)))];
    const employees = await findBundyEmployees(employeeIds);
    const writes: Prisma.BundyRawEventCreateManyInput[] = preview.rows
      .filter((row) => row.importAction === "IMPORT" && row.validationStatus === "VALID" && row.bundyLogId && row.deviceEmployeeId && row.occurredAt && row.event && row.deviceId && row.matchStatus)
      .map((row) => ({
        importId: history.id,
        sourceLogId: row.bundyLogId!,
        deviceEmployeeId: row.deviceEmployeeId!,
        employeeId: employees.get(row.deviceEmployeeId!)?.id ?? null,
        sourceTimestamp: row.sourceTimestamp!,
        occurredAt: new Date(row.occurredAt!),
        event: row.event!,
        deviceId: row.deviceId!,
        sourceBatch: row.sourceBatch,
        sourceProcessingStatus: row.sourceProcessingStatus,
        sourceMatchedHrpsEmployeeId: row.sourceMatchedHrpsEmployeeId,
        matchStatus: row.matchStatus!,
        validationStatus: "VALID",
        duplicateStatus: row.duplicateStatus,
        anomalyCodes: toJson(row.anomalyCodes),
      }));

    let insertedCount = 0;
    for (let index = 0; index < writes.length; index += 100) {
      const result = await createBundyRawEvents(writes.slice(index, index + 100));
      insertedCount += result.count;
    }

    const summary = { ...preview.summary, importedCount: insertedCount };
    const status = summary.invalidCount > 0 || summary.sourceConflictCount > 0
      ? "COMPLETED_WITH_ERRORS"
      : "COMPLETED";
    await updateBundyImport(history.id, {
      status,
      completedAt: new Date(),
      summary,
    });
    try {
      await auditInput(input.actor, {
        eventType: "bundy.import.completed",
        outcome: "Successful",
        summary: `Bundy CSV import completed with ${insertedCount} raw event${insertedCount === 1 ? "" : "s"} stored.`,
        importId: history.id,
        filename: preview.filename,
        status,
        counts: summary,
      });
    } catch {
      // The raw import remains authoritative; audit failure is visible through
      // the import history and must not cause duplicate source writes.
    }
    return {
      importId: history.id,
      status,
      preview: { ...preview, summary },
      summary,
      accountBoundary: "Bundy rows remain raw device evidence. No Employee, schedule, unified attendance, Payroll, or Accounting record was changed.",
    };
  } catch (error) {
    const message = safeFailureMessage(error);
    await updateBundyImport(history.id, {
      status: "FAILED",
      completedAt: new Date(),
      errorSummary: message,
    });
    try {
      await auditInput(input.actor, {
        eventType: "bundy.import.failed",
        outcome: "Failed",
        summary: message,
        importId: history.id,
        filename: preview.filename,
        status: "FAILED",
        counts: preview.summary,
      });
    } catch {
      // Do not replace the safe import failure with a secondary audit failure.
    }
    if (error instanceof BundyImportError) throw error;
    throw new BundyImportError("IMPORT_FAILED", message, 503);
  }
}

export async function getBundyPageData(): Promise<BundyPageData> {
  const [history, events] = await Promise.all([
    listBundyImports(1, 10),
    listBundyRawEvents(1, 50),
  ]);
  return { history, events };
}

export async function getBundyImportHistory(page = 1, pageSize = 10): Promise<BundyImportHistoryData> {
  return listBundyImports(page, pageSize);
}

export async function getBundyRawEventData(page = 1, pageSize = 50): Promise<BundyRawEventData> {
  return listBundyRawEvents(page, pageSize);
}
