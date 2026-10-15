import "server-only";

import type {
  BundyDuplicateStatus,
  BundyEventType,
  BundyImportStatus,
  BundyMatchStatus,
  BundyValidationStatus,
  Prisma,
} from "@prisma/client";

import { getRepositoryPrisma, toJson, toJsonArray } from "@/server/repositories/prisma/prisma-repository-helpers";
import type {
  BundyEmployeeMatch,
  BundyImportHistoryData,
  BundyImportHistoryItem,
  BundyImportSummary,
  BundyRawEventData,
  BundyRawEventItem,
} from "@/types/bundy-import";

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
  event: BundyEventType;
  deviceId: string;
};

const employeeSelect = {
  id: true,
  employeeId: true,
  displayName: true,
  department: true,
  employmentStatus: true,
} satisfies Prisma.EmployeeSelect;

function asSummary(row: {
  totalRows: number;
  inCount: number;
  outCount: number;
  matchedCount: number;
  unmatchedCount: number;
  inactiveCount: number;
  duplicateScanCount: number;
  alreadyImportedCount: number;
  invalidCount: number;
  sourceConflictCount: number;
  importedCount: number;
}): BundyImportSummary {
  return {
    totalRows: row.totalRows,
    inCount: row.inCount,
    outCount: row.outCount,
    matchedCount: row.matchedCount,
    unmatchedCount: row.unmatchedCount,
    inactiveCount: row.inactiveCount,
    duplicateScanCount: row.duplicateScanCount,
    alreadyImportedCount: row.alreadyImportedCount,
    invalidCount: row.invalidCount,
    sourceConflictCount: row.sourceConflictCount,
    importedCount: row.importedCount,
  };
}

function mapEmployee(employee: BundyEmployeeRecord): BundyEmployeeMatch {
  return {
    employeeId: employee.employeeId,
    displayName: employee.displayName,
    department: employee.department,
    employmentStatus: employee.employmentStatus,
  };
}

function mapHistory(row: {
  id: string;
  filename: string;
  startedAt: Date;
  completedAt: Date | null;
  status: BundyImportStatus;
  initiatedBy: { displayName: string; username: string } | null;
  totalRows: number;
  inCount: number;
  outCount: number;
  matchedCount: number;
  unmatchedCount: number;
  inactiveCount: number;
  duplicateScanCount: number;
  alreadyImportedCount: number;
  invalidCount: number;
  sourceConflictCount: number;
  importedCount: number;
  devices: Prisma.JsonValue;
  sourceBatches: Prisma.JsonValue;
  errorSummary: string | null;
}): BundyImportHistoryItem {
  return {
    id: row.id,
    filename: row.filename,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    status: row.status,
    initiatedBy: row.initiatedBy,
    summary: asSummary(row),
    devices: toJsonArray(row.devices).filter((value): value is string => typeof value === "string"),
    sourceBatches: toJsonArray(row.sourceBatches).filter((value): value is string => typeof value === "string"),
    errorSummary: row.errorSummary,
  };
}

function mapRawEvent(row: {
  id: string;
  sourceLogId: string;
  deviceEmployeeId: string;
  employee: BundyEmployeeRecord | null;
  sourceTimestamp: string;
  occurredAt: Date;
  event: BundyEventType;
  deviceId: string;
  sourceBatch: string | null;
  matchStatus: BundyMatchStatus;
  validationStatus: BundyValidationStatus;
  duplicateStatus: BundyDuplicateStatus;
  anomalyCodes: Prisma.JsonValue;
  importId: string;
}): BundyRawEventItem {
  return {
    id: row.id,
    sourceLogId: row.sourceLogId,
    deviceEmployeeId: row.deviceEmployeeId,
    employee: row.employee ? mapEmployee(row.employee) : null,
    sourceTimestamp: row.sourceTimestamp,
    occurredAt: row.occurredAt.toISOString(),
    event: row.event,
    deviceId: row.deviceId,
    sourceBatch: row.sourceBatch,
    matchStatus: row.matchStatus,
    validationStatus: row.validationStatus,
    duplicateStatus: row.duplicateStatus,
    anomalyCodes: toJsonArray(row.anomalyCodes).filter((value): value is string => typeof value === "string"),
    importId: row.importId,
  };
}

export async function findBundyEmployees(employeeIds: string[]) {
  const result = new Map<string, BundyEmployeeRecord>();
  const prisma = getRepositoryPrisma();
  for (let index = 0; index < employeeIds.length; index += 500) {
    const rows = await prisma.employee.findMany({
      where: { employeeId: { in: employeeIds.slice(index, index + 500) } },
      select: employeeSelect,
    });
    rows.forEach((row) => result.set(row.employeeId, row));
  }
  return result;
}

export async function findBundyEventsBySourceLogIds(sourceLogIds: string[]) {
  const result = new Map<string, BundyExistingEvent>();
  const prisma = getRepositoryPrisma();
  for (let index = 0; index < sourceLogIds.length; index += 500) {
    const rows = await prisma.bundyRawEvent.findMany({
      where: { sourceLogId: { in: sourceLogIds.slice(index, index + 500) } },
      select: {
        sourceLogId: true,
        deviceEmployeeId: true,
        sourceTimestamp: true,
        event: true,
        deviceId: true,
      },
    });
    rows.forEach((row) => result.set(row.sourceLogId, row));
  }
  return result;
}

export async function countBundyEmployees() {
  return getRepositoryPrisma().employee.count();
}

export async function createBundyImport(input: {
  filename: string;
  contentHash: string;
  initiatedByUserId: string | null;
  initiatedBySnapshot: Prisma.InputJsonValue;
  startedAt: Date;
  status: BundyImportStatus;
  summary: BundyImportSummary;
  devices: string[];
  sourceBatches: string[];
}) {
  return getRepositoryPrisma().bundyImport.create({
    data: {
      filename: input.filename,
      contentHash: input.contentHash,
      initiatedByUserId: input.initiatedByUserId,
      initiatedBySnapshot: input.initiatedBySnapshot,
      startedAt: input.startedAt,
      status: input.status,
      totalRows: input.summary.totalRows,
      inCount: input.summary.inCount,
      outCount: input.summary.outCount,
      matchedCount: input.summary.matchedCount,
      unmatchedCount: input.summary.unmatchedCount,
      inactiveCount: input.summary.inactiveCount,
      duplicateScanCount: input.summary.duplicateScanCount,
      alreadyImportedCount: input.summary.alreadyImportedCount,
      invalidCount: input.summary.invalidCount,
      sourceConflictCount: input.summary.sourceConflictCount,
      importedCount: input.summary.importedCount,
      devices: toJson(input.devices),
      sourceBatches: toJson(input.sourceBatches),
    },
    select: { id: true },
  });
}

export async function createBundyRawEvents(
  rows: Prisma.BundyRawEventCreateManyInput[],
) {
  if (!rows.length) return { count: 0 };
  return getRepositoryPrisma().bundyRawEvent.createMany({
    data: rows,
    skipDuplicates: true,
  });
}

export async function updateBundyImport(
  id: string,
  input: {
    status: BundyImportStatus;
    completedAt: Date;
    summary?: BundyImportSummary;
    errorSummary?: string | null;
  },
) {
  return getRepositoryPrisma().bundyImport.update({
    where: { id },
    data: {
      status: input.status,
      completedAt: input.completedAt,
      ...(input.summary
        ? {
          totalRows: input.summary.totalRows,
          inCount: input.summary.inCount,
          outCount: input.summary.outCount,
          matchedCount: input.summary.matchedCount,
          unmatchedCount: input.summary.unmatchedCount,
          inactiveCount: input.summary.inactiveCount,
          duplicateScanCount: input.summary.duplicateScanCount,
          alreadyImportedCount: input.summary.alreadyImportedCount,
          invalidCount: input.summary.invalidCount,
          sourceConflictCount: input.summary.sourceConflictCount,
          importedCount: input.summary.importedCount,
        }
        : {}),
      errorSummary: input.errorSummary ?? null,
    },
    select: { id: true },
  });
}

export async function listBundyImports(
  page = 1,
  pageSize = 10,
): Promise<BundyImportHistoryData> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const where: Prisma.BundyImportWhereInput = {};
  const [rows, total] = await Promise.all([
    getRepositoryPrisma().bundyImport.findMany({
      where,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      skip: (safePage - 1) * safePageSize,
      take: safePageSize + 1,
      select: {
        id: true,
        filename: true,
        startedAt: true,
        completedAt: true,
        status: true,
        initiatedBy: { select: { displayName: true, username: true } },
        totalRows: true,
        inCount: true,
        outCount: true,
        matchedCount: true,
        unmatchedCount: true,
        inactiveCount: true,
        duplicateScanCount: true,
        alreadyImportedCount: true,
        invalidCount: true,
        sourceConflictCount: true,
        importedCount: true,
        devices: true,
        sourceBatches: true,
        errorSummary: true,
      },
    }),
    getRepositoryPrisma().bundyImport.count({ where }),
  ]);
  return {
    items: rows.slice(0, safePageSize).map(mapHistory),
    page: safePage,
    pageSize: safePageSize,
    total,
    hasNext: rows.length > safePageSize,
  };
}

export async function listBundyRawEvents(
  page = 1,
  pageSize = 50,
): Promise<BundyRawEventData> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const rows = await getRepositoryPrisma().bundyRawEvent.findMany({
    orderBy: [{ occurredAt: "desc" }, { sourceLogId: "desc" }],
    skip: (safePage - 1) * safePageSize,
    take: safePageSize + 1,
    select: {
      id: true,
      sourceLogId: true,
      deviceEmployeeId: true,
      employee: { select: employeeSelect },
      sourceTimestamp: true,
      occurredAt: true,
      event: true,
      deviceId: true,
      sourceBatch: true,
      matchStatus: true,
      validationStatus: true,
      duplicateStatus: true,
      anomalyCodes: true,
      importId: true,
    },
  });
  const total = await getRepositoryPrisma().bundyRawEvent.count();
  return {
    items: rows.slice(0, safePageSize).map(mapRawEvent),
    page: safePage,
    pageSize: safePageSize,
    total,
    hasNext: rows.length > safePageSize,
  };
}
