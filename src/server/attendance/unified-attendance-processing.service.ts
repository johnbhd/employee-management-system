import "server-only";

import { Prisma } from "@prisma/client";

import { writeAdminAuditEvent } from "@/server/repositories/admin-audit/admin-audit.repository";
import { processUnifiedAttendanceForEmployeeDate } from "@/server/attendance/unified-attendance-processor";
import {
  getRepositoryPrisma,
  findUserIdByFirebaseUid,
  toActorSnapshot,
  toDateKey,
  toJson,
  toJsonObject,
  toUtcDate,
} from "@/server/repositories/prisma/prisma-repository-helpers";
import type { SessionUser } from "@/types/auth";
import type {
  UnifiedAttendanceProcessingItemView,
  UnifiedAttendanceProcessingRunResult,
  UnifiedAttendanceProcessingRunView,
} from "@/types/unified-attendance-processing";
import {
  buildUnifiedAttendanceWorkPlan,
  dateKeyIsValid,
  listDateKeys,
  type UnifiedAttendanceWorkPlanEmployee,
} from "./unified-attendance-work-plan";

export const UNIFIED_ATTENDANCE_MAX_RANGE_DAYS = 31;
export const UNIFIED_ATTENDANCE_MAX_ITEMS = 10000;
export const UNIFIED_ATTENDANCE_INTERRUPTION_GRACE_MS = 5 * 60 * 1000;
// Deliberately deferred: this run writes technical/business processing state
// only. A later HR workflow can add the approval guard without changing the
// source-evidence or processing-run boundary.
export const UNIFIED_ATTENDANCE_VERIFICATION_POLICY = "DEFERRED_TO_HR_WORKFLOW" as const;

const processingLockKey = 2147483001;

export class UnifiedAttendanceProcessingServiceError extends Error {
  readonly code: string;
  readonly status: 400 | 404 | 409 | 503;

  constructor(code: string, message: string, status: 400 | 404 | 409 | 503 = 400) {
    super(message);
    this.name = "UnifiedAttendanceProcessingServiceError";
    this.code = code;
    this.status = status;
  }
}
type ProcessingAction = "start" | "reprocess" | "retry";

function validateDateRange(dateFrom: string, dateTo: string) {
  if (!dateKeyIsValid(dateFrom) || !dateKeyIsValid(dateTo)) {
    throw new UnifiedAttendanceProcessingServiceError(
      "INVALID_DATE_RANGE",
      "dateFrom and dateTo must use valid YYYY-MM-DD values.",
    );
  }
  const dateKeys = listDateKeys(dateFrom, dateTo);
  if (dateKeys.length === 0 || dateFrom > dateTo) {
    throw new UnifiedAttendanceProcessingServiceError(
      "INVALID_DATE_RANGE",
      "dateFrom must be on or before dateTo.",
    );
  }
  if (dateKeys.length > UNIFIED_ATTENDANCE_MAX_RANGE_DAYS) {
    throw new UnifiedAttendanceProcessingServiceError(
      "DATE_RANGE_TOO_LARGE",
      `Choose a date range of ${UNIFIED_ATTENDANCE_MAX_RANGE_DAYS} days or fewer per run.`,
    );
  }
  return dateKeys;
}

function stringsFromJson(value: Prisma.JsonValue) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

async function listScheduledEmployees(): Promise<UnifiedAttendanceWorkPlanEmployee[]> {
  const rows = await getRepositoryPrisma().employee.findMany({
    where: { employmentStatus: "active" },
    select: {
      id: true,
      employeeId: true,
      displayName: true,
      schedules: {
        select: {
          id: true,
          scheduleId: true,
          workDays: true,
          effectiveFrom: true,
          effectiveTo: true,
        },
        orderBy: [{ effectiveFrom: "desc" }, { updatedAt: "desc" }],
      },
    },
    orderBy: [{ employeeId: "asc" }, { id: "asc" }],
  });

  return rows.map((employee) => ({
    internalId: employee.id,
    employeeId: employee.employeeId,
    displayName: employee.displayName,
    schedules: employee.schedules.map((schedule) => ({
      internalId: schedule.id,
      scheduleId: schedule.scheduleId,
      workDays: stringsFromJson(schedule.workDays),
      effectiveFrom: schedule.effectiveFrom ? toDateKey(schedule.effectiveFrom) : null,
      effectiveTo: schedule.effectiveTo ? toDateKey(schedule.effectiveTo) : null,
    })),
  }));
}

function safeError(error: unknown) {
  if (error instanceof UnifiedAttendanceProcessingServiceError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error && error.name === "UnifiedAttendanceProcessingError") {
    const code = "code" in error && typeof error.code === "string"
      ? error.code
      : "ATTENDANCE_PROCESSING_FAILED";
    return { code, message: error.message.slice(0, 500) };
  }
  return {
    code: "ATTENDANCE_PROCESSING_FAILED",
    message: "The employee/date item could not be processed safely.",
  };
}
function mapRun(row: {
  id: string;
  runType: string;
  dateFrom: Date;
  dateTo: Date;
  status: string;
  initiatedBySnapshot: Prisma.JsonValue;
  initiatedByUserId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  needsReviewCount: number;
  errorSummary: string | null;
}): UnifiedAttendanceProcessingRunView {
  const actor = toJsonObject(row.initiatedBySnapshot);
  return {
    id: row.id,
    runType: row.runType as UnifiedAttendanceProcessingRunView["runType"],
    dateFrom: toDateKey(row.dateFrom),
    dateTo: toDateKey(row.dateTo),
    status: row.status as UnifiedAttendanceProcessingRunView["status"],
    initiatedBy: {
      uid: typeof actor.uid === "string" ? actor.uid : row.initiatedByUserId,
      displayName: typeof actor.displayName === "string" ? actor.displayName : "System",
      role: typeof actor.role === "string" ? actor.role : null,
    },
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    totalItems: row.totalItems,
    pendingItems: row.pendingItems,
    processingItems: row.processingItems,
    completedItems: row.completedItems,
    failedItems: row.failedItems,
    createdCount: row.createdCount,
    updatedCount: row.updatedCount,
    unchangedCount: row.unchangedCount,
    needsReviewCount: row.needsReviewCount,
    errorSummary: row.errorSummary,
  };
}

function mapItem(row: {
  id: string;
  runId: string;
  employeeReference: string;
  employeeName: string;
  attendanceDate: Date;
  attendanceRecordId: string | null;
  status: string;
  operation: string | null;
  technicalState: string | null;
  businessStatus: string | null;
  requiresReview: boolean;
  attemptCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}): UnifiedAttendanceProcessingItemView {
  return {
    id: row.id,
    runId: row.runId,
    employeeId: row.employeeReference,
    employeeName: row.employeeName,
    attendanceDate: toDateKey(row.attendanceDate),
    attendanceRecordId: row.attendanceRecordId,
    status: row.status as UnifiedAttendanceProcessingItemView["status"],
    operation: row.operation as UnifiedAttendanceProcessingItemView["operation"],
    technicalState: row.technicalState,
    businessStatus: row.businessStatus,
    requiresReview: row.requiresReview,
    attemptCount: row.attemptCount,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

const runSelect = {
  id: true,
  runType: true,
  dateFrom: true,
  dateTo: true,
  status: true,
  initiatedBySnapshot: true,
  initiatedByUserId: true,
  startedAt: true,
  completedAt: true,
  totalItems: true,
  pendingItems: true,
  processingItems: true,
  completedItems: true,
  failedItems: true,
  createdCount: true,
  updatedCount: true,
  unchangedCount: true,
  needsReviewCount: true,
  errorSummary: true,
} satisfies Prisma.UnifiedAttendanceProcessingRunSelect;

const itemSelect = {
  id: true,
  runId: true,
  employeeReference: true,
  employeeName: true,
  attendanceDate: true,
  attendanceRecordId: true,
  status: true,
  operation: true,
  technicalState: true,
  businessStatus: true,
  requiresReview: true,
  attemptCount: true,
  errorCode: true,
  errorMessage: true,
  startedAt: true,
  completedAt: true,
} satisfies Prisma.UnifiedAttendanceProcessingItemSelect;

async function getRunOrThrow(runId: string) {
  const row = await getRepositoryPrisma().unifiedAttendanceProcessingRun.findUnique({
    where: { id: runId },
    select: runSelect,
  });
  if (!row) {
    throw new UnifiedAttendanceProcessingServiceError("RUN_NOT_FOUND", "The processing run was not found.", 404);
  }
  return row;
}

async function refreshRunCounters(runId: string) {
  const prisma = getRepositoryPrisma();
  const [run, pendingItems, processingItems, completedItems, failedItems, createdCount, updatedCount, unchangedCount, needsReviewCount] = await Promise.all([
    prisma.unifiedAttendanceProcessingRun.findUnique({ where: { id: runId }, select: { totalItems: true } }),
    prisma.unifiedAttendanceProcessingItem.count({ where: { runId, status: "PENDING" } }),
    prisma.unifiedAttendanceProcessingItem.count({ where: { runId, status: "PROCESSING" } }),
    prisma.unifiedAttendanceProcessingItem.count({ where: { runId, status: "COMPLETED" } }),
    prisma.unifiedAttendanceProcessingItem.count({ where: { runId, status: "FAILED" } }),
    prisma.unifiedAttendanceProcessingItem.count({ where: { runId, operation: "CREATED" } }),
    prisma.unifiedAttendanceProcessingItem.count({ where: { runId, operation: "UPDATED" } }),
    prisma.unifiedAttendanceProcessingItem.count({ where: { runId, operation: "UNCHANGED" } }),
    prisma.unifiedAttendanceProcessingItem.count({ where: { runId, requiresReview: true } }),
  ]);
  if (!run) return;
  await prisma.unifiedAttendanceProcessingRun.update({
    where: { id: runId },
    data: {
      totalItems: run.totalItems,
      pendingItems,
      processingItems,
      completedItems,
      failedItems,
      createdCount,
      updatedCount,
      unchangedCount,
      needsReviewCount,
    },
  });
}

async function finalizeRun(runId: string) {
  const prisma = getRepositoryPrisma();
  await refreshRunCounters(runId);
  const counts = await prisma.unifiedAttendanceProcessingItem.groupBy({
    by: ["status"],
    where: { runId },
    _count: { _all: true },
  });
  const failed = counts.find((item) => item.status === "FAILED")?._count._all ?? 0;
  const pending = counts.find((item) => item.status === "PENDING")?._count._all ?? 0;
  const processing = counts.find((item) => item.status === "PROCESSING")?._count._all ?? 0;
  const status = failed > 0
    ? "COMPLETED_WITH_ERRORS"
    : pending > 0 || processing > 0
      ? "FAILED"
      : "COMPLETED";
  await prisma.unifiedAttendanceProcessingRun.update({
    where: { id: runId },
    data: {
      status,
      completedAt: new Date(),
      errorSummary: failed > 0
        ? `${failed} employee/date item${failed === 1 ? "" : "s"} failed and can be retried.`
        : null,
    },
  });
  return getRunOrThrow(runId);
}

async function writeRunAudit(action: string, actor: SessionUser, run: UnifiedAttendanceProcessingRunView) {
  await writeAdminAuditEvent({
    action,
    module: "unified-attendance",
    actor: { uid: actor.uid, displayName: actor.displayName, role: actor.role },
    target: { type: "unified_attendance_processing_run", id: run.id, label: `${run.dateFrom} to ${run.dateTo}` },
    metadata: {
      runType: run.runType,
      status: run.status,
      totalItems: run.totalItems,
      completedItems: run.completedItems,
      failedItems: run.failedItems,
    },
  });
}

async function createRun(input: {
  dateFrom: string;
  dateTo: string;
  runType: "INITIAL" | "REPROCESS";
  actor: SessionUser;
}) {
  validateDateRange(input.dateFrom, input.dateTo);
  const employees = await listScheduledEmployees();
  const plan = buildUnifiedAttendanceWorkPlan({ dateFrom: input.dateFrom, dateTo: input.dateTo, employees });
  if (plan.length > UNIFIED_ATTENDANCE_MAX_ITEMS) {
    throw new UnifiedAttendanceProcessingServiceError(
      "WORK_PLAN_TOO_LARGE",
      `The selected range produces more than ${UNIFIED_ATTENDANCE_MAX_ITEMS} employee/date items. Narrow the range and try again.`,
    );
  }
  const initiatedByUserId = await findUserIdByFirebaseUid(input.actor.uid);
  const now = new Date();
  const prisma = getRepositoryPrisma();
  const run = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(${processingLockKey})`);
    const active = await tx.unifiedAttendanceProcessingRun.findFirst({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      select: { id: true },
    });
    if (active) {
      throw new UnifiedAttendanceProcessingServiceError(
        "RUN_IN_PROGRESS",
        "Another Unified Attendance processing run is already in progress.",
        409,
      );
    }
    const created = await tx.unifiedAttendanceProcessingRun.create({
      data: {
        runType: input.runType,
        dateFrom: toUtcDate(input.dateFrom),
        dateTo: toUtcDate(input.dateTo),
        status: "PENDING",
        initiatedByUserId,
        initiatedBySnapshot: toJson(toActorSnapshot(input.actor)),
        startedAt: now,
        totalItems: plan.length,
        pendingItems: plan.length,
        completedItems: 0,
        failedItems: 0,
      },
      select: runSelect,
    });
    if (plan.length) {
      await tx.unifiedAttendanceProcessingItem.createMany({
        data: plan.map((item) => ({
          runId: created.id,
          employeeId: item.employeeRecordId,
          employeeReference: item.employeeId,
          employeeName: item.employeeName,
          attendanceDate: toUtcDate(item.attendanceDate),
          status: "PENDING" as const,
        })),
      });
    }
    return created;
  });
  return mapRun(run);
}

async function claimNextItem(runId: string) {
  const prisma = getRepositoryPrisma();
  const next = await prisma.unifiedAttendanceProcessingItem.findFirst({
    where: { runId, status: "PENDING" },
    orderBy: [{ attendanceDate: "asc" }, { employeeReference: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (!next) return null;
  const claimed = await prisma.unifiedAttendanceProcessingItem.updateMany({
    where: { id: next.id, status: "PENDING" },
    data: { status: "PROCESSING", attemptCount: { increment: 1 }, startedAt: new Date(), errorCode: null, errorMessage: null },
  });
  if (claimed.count !== 1) return claimNextItem(runId);
  return prisma.unifiedAttendanceProcessingItem.findUnique({ where: { id: next.id }, select: itemSelect });
}

async function executeRun(runId: string, actor: SessionUser, action: ProcessingAction) {
  const prisma = getRepositoryPrisma();
  const existing = await getRunOrThrow(runId);
  if (existing.status === "PROCESSING") {
    throw new UnifiedAttendanceProcessingServiceError("RUN_IN_PROGRESS", "This processing run is already in progress.", 409);
  }
  if (action === "retry" && existing.failedItems === 0 && existing.pendingItems === 0) {
    throw new UnifiedAttendanceProcessingServiceError("NO_FAILED_ITEMS", "This processing run has no failed items to retry.", 400);
  }
  if (action !== "retry" && existing.status !== "PENDING") {
    throw new UnifiedAttendanceProcessingServiceError("RUN_NOT_PENDING", "This processing run is no longer pending.", 409);
  }
  if (action === "retry" && !["COMPLETED_WITH_ERRORS", "FAILED"].includes(existing.status)) {
    throw new UnifiedAttendanceProcessingServiceError("RUN_NOT_RETRYABLE", "Only a completed run with failures can be retried.", 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(${processingLockKey})`);
    const current = await tx.unifiedAttendanceProcessingRun.findUnique({ where: { id: runId }, select: { status: true } });
    if (!current || (current.status !== "PENDING" && current.status !== "COMPLETED_WITH_ERRORS" && current.status !== "FAILED")) {
      throw new UnifiedAttendanceProcessingServiceError("RUN_IN_PROGRESS", "This processing run cannot be started twice.", 409);
    }
    if (action === "retry") {
      await tx.unifiedAttendanceProcessingItem.updateMany({
        where: { runId, status: "FAILED" },
        data: { status: "PENDING", errorCode: null, errorMessage: null, completedAt: null },
      });
    }
    await tx.unifiedAttendanceProcessingRun.update({ where: { id: runId }, data: { status: "PROCESSING", completedAt: null, errorSummary: null } });
  });

  try {
    while (true) {
      const item = await claimNextItem(runId);
      if (!item) break;
      try {
        const result = await processUnifiedAttendanceForEmployeeDate({
          employeeId: item.employeeReference,
          attendanceDate: toDateKey(item.attendanceDate),
        });
        await prisma.unifiedAttendanceProcessingItem.update({
          where: { id: item.id },
          data: {
            status: "COMPLETED",
            attendanceRecordId: result.attendanceRecordId,
            operation: result.operation,
            technicalState: result.technicalState,
            businessStatus: result.businessStatus,
            requiresReview: result.requiresReview,
            completedAt: new Date(),
            errorCode: null,
            errorMessage: null,
          },
        });
      } catch (error) {
        const details = safeError(error);
        await prisma.unifiedAttendanceProcessingItem.update({
          where: { id: item.id },
          data: { status: "FAILED", errorCode: details.code, errorMessage: details.message, completedAt: new Date() },
        });
      }
      await refreshRunCounters(runId);
    }
    const completed = await finalizeRun(runId);
    await writeRunAudit(
      completed.status === "COMPLETED"
        ? action === "retry" ? "unified_attendance_run_retry_completed" : "unified_attendance_run_completed"
        : "unified_attendance_run_completed_with_errors",
      actor,
      mapRun(completed),
    );
    return mapRun(completed);
  } catch (error) {
    const details = safeError(error);
    await prisma.unifiedAttendanceProcessingRun.update({
      where: { id: runId },
      data: { status: "FAILED", completedAt: new Date(), errorSummary: details.message },
    }).catch(() => undefined);
    const failedRun = await getRunOrThrow(runId).catch(() => null);
    if (failedRun) {
      await writeRunAudit("unified_attendance_run_failed", actor, mapRun(failedRun)).catch(() => undefined);
    }
    throw error;
  }
}

async function recoverInterruptedRun(runId: string) {
  const prisma = getRepositoryPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(${processingLockKey})`);
    const current = await tx.unifiedAttendanceProcessingRun.findUnique({
      where: { id: runId },
      select: { status: true, updatedAt: true },
    });
    if (!current || current.status !== "PROCESSING") return;
    if (Date.now() - current.updatedAt.getTime() < UNIFIED_ATTENDANCE_INTERRUPTION_GRACE_MS) {
      throw new UnifiedAttendanceProcessingServiceError(
        "RUN_IN_PROGRESS",
        "This processing run is still active. Retry it after the interruption recovery window.",
        409,
      );
    }
    const interrupted = await tx.unifiedAttendanceProcessingItem.updateMany({
      where: { runId, status: "PROCESSING" },
      data: {
        status: "FAILED",
        errorCode: "RUN_INTERRUPTED",
        errorMessage: "Processing stopped before this item completed; it is eligible for retry.",
        completedAt: new Date(),
      },
    });
    await tx.unifiedAttendanceProcessingRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED_WITH_ERRORS",
        completedAt: new Date(),
        errorSummary: interrupted.count > 0
          ? `${interrupted.count} interrupted item${interrupted.count === 1 ? " was" : "s were"} marked retryable.`
          : "The processing run was interrupted and is eligible for retry.",
      },
    });
  });
}

export async function startUnifiedAttendanceProcessing(input: {
  dateFrom: string;
  dateTo: string;
  actor: SessionUser;
  runType?: "INITIAL" | "REPROCESS";
}): Promise<UnifiedAttendanceProcessingRunResult> {
  const run = await createRun({ ...input, runType: input.runType ?? "INITIAL" });
  await writeRunAudit(
    input.runType === "REPROCESS" ? "unified_attendance_reprocess_started" : "unified_attendance_run_started",
    input.actor,
    run,
  );
  const finalRun = await executeRun(run.id, input.actor, input.runType === "REPROCESS" ? "reprocess" : "start");
  return { run: finalRun };
}

export async function retryUnifiedAttendanceProcessing(input: {
  runId: string;
  actor: SessionUser;
}): Promise<UnifiedAttendanceProcessingRunResult> {
  await recoverInterruptedRun(input.runId);
  const current = mapRun(await getRunOrThrow(input.runId));
  await writeRunAudit("unified_attendance_run_retry_started", input.actor, current);
  const run = await executeRun(input.runId, input.actor, "retry");
  return { run };
}

export async function reprocessUnifiedAttendance(input: {
  dateFrom: string;
  dateTo: string;
  actor: SessionUser;
}): Promise<UnifiedAttendanceProcessingRunResult> {
  return startUnifiedAttendanceProcessing({ ...input, runType: "REPROCESS" });
}

export async function getUnifiedAttendanceProcessingRun(runId: string) {
  return { run: mapRun(await getRunOrThrow(runId)) };
}

export async function listUnifiedAttendanceProcessingRuns(input: { page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const prisma = getRepositoryPrisma();
  const [rows, total] = await Promise.all([
    prisma.unifiedAttendanceProcessingRun.findMany({
      select: runSelect,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.unifiedAttendanceProcessingRun.count(),
  ]);
  return { items: rows.map(mapRun), page, pageSize, total };
}

export async function listUnifiedAttendanceProcessingItems(input: { runId: string; page?: number; pageSize?: number; status?: string }) {
  await getRunOrThrow(input.runId);
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, input.pageSize ?? 50));
  const status = input.status && ["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(input.status)
    ? input.status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
    : undefined;
  const where = { runId: input.runId, ...(status ? { status } : {}) };
  const prisma = getRepositoryPrisma();
  const [rows, total] = await Promise.all([
    prisma.unifiedAttendanceProcessingItem.findMany({
      where,
      select: itemSelect,
      orderBy: [{ attendanceDate: "asc" }, { employeeReference: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.unifiedAttendanceProcessingItem.count({ where }),
  ]);
  return { items: rows.map(mapItem), page, pageSize, total };
}

export async function getUnifiedAttendanceProcessingMonitoringSnapshot() {
  const prisma = getRepositoryPrisma();
  const [activeRun, latestRun, latestSuccessful, latestFailedRun, failedItems] = await Promise.all([
    prisma.unifiedAttendanceProcessingRun.findFirst({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      select: runSelect,
    }),
    prisma.unifiedAttendanceProcessingRun.findFirst({ orderBy: [{ startedAt: "desc" }, { id: "desc" }], select: runSelect }),
    prisma.unifiedAttendanceProcessingRun.findFirst({ where: { status: "COMPLETED" }, orderBy: [{ completedAt: "desc" }, { id: "desc" }], select: { completedAt: true } }),
    prisma.unifiedAttendanceProcessingRun.findFirst({ where: { status: "FAILED" }, orderBy: [{ completedAt: "desc" }, { id: "desc" }], select: { id: true, completedAt: true, startedAt: true, errorSummary: true } }),
    prisma.unifiedAttendanceProcessingItem.findMany({
      where: { status: "FAILED" },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 50,
      select: { id: true, runId: true, employeeReference: true, employeeName: true, attendanceDate: true, errorMessage: true, updatedAt: true },
    }),
  ]);
  return {
    activeRun: activeRun ? mapRun(activeRun) : null,
    latestRun: latestRun ? mapRun(latestRun) : null,
    latestSuccessfulAt: latestSuccessful?.completedAt?.toISOString() ?? null,
    latestFailure: latestFailedRun
      ? {
        id: latestFailedRun.id,
        detectedAt: (latestFailedRun.completedAt ?? latestFailedRun.startedAt).toISOString(),
        summary: latestFailedRun.errorSummary,
      }
      : null,
    failedItems: failedItems.map((item) => ({
      id: item.id,
      runId: item.runId,
      employeeReference: item.employeeReference,
      employeeName: item.employeeName,
      attendanceDate: toDateKey(item.attendanceDate),
      errorMessage: item.errorMessage,
      detectedAt: item.updatedAt.toISOString(),
    })),
  };
}
