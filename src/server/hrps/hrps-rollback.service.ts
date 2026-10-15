import "server-only";

import type { Prisma } from "@prisma/client";

import { getFirebaseAdminAuth } from "@/lib/firebase/server";
import { getPrismaClient } from "@/lib/prisma/server";
import { findUserIdByFirebaseUid, toJson, toActorSnapshot } from "@/server/repositories/prisma/prisma-repository-helpers";
import type { SessionUser } from "@/types/auth";
import type {
  HrpsImportHistoryItem,
  HrpsRollbackBlockedRecord,
  HrpsRollbackPreview,
  HrpsRollbackResult,
  HrpsRollbackSummary,
  HrpsScheduleInput,
} from "@/types/hrps-import";

type EmployeeSnapshot = {
  displayName: string;
  department: string;
  position: string | null;
  employmentStatus: "active" | "inactive";
  sourceSystem: "HRPS";
  dataSource: string | null;
  sourceUpdatedAt: string | null;
  syncedAt: string | null;
};

type ScheduleSnapshot = {
  id: string;
  sourceSystem?: "HRPS";
  dataSource?: string | null;
  schedule: HrpsScheduleInput;
};

type ScheduleOwnership = {
  createdSchedules?: ScheduleSnapshot[];
  createdScheduleIds?: string[];
  updatedSchedules?: Array<{ before: ScheduleSnapshot; after: ScheduleSnapshot }>;
};

type RollbackPlan = {
  preview: HrpsRollbackPreview;
  importRecord: {
    id: string;
    filename: string;
    status: HrpsImportHistoryItem["status"];
    startedAt: Date;
    rows: RollbackRow[];
  };
  firebaseUids: string[];
};

type RollbackRow = {
  id: string;
  rowNumber: number;
  employeeId: string | null;
  classification: string;
  employeeRecordId: string | null;
  employeeCreated: boolean;
  employeeBefore: Prisma.JsonValue | null;
  employeeAfter: Prisma.JsonValue | null;
  scheduleOwnership: Prisma.JsonValue;
  applicationUserId: string | null;
  applicationUserCreated: boolean;
  firebaseUid: string | null;
  firebaseCreated: boolean;
};

export class HrpsRollbackError extends Error {
  readonly code: string;
  readonly status: 400 | 404 | 409 | 503;

  constructor(code: string, message: string, status: 400 | 404 | 409 | 503 = 409) {
    super(message);
    this.name = "HrpsRollbackError";
    this.code = code;
    this.status = status;
  }
}

const rollbackRowSelect = {
  id: true,
  rowNumber: true,
  employeeId: true,
  classification: true,
  employeeRecordId: true,
  employeeCreated: true,
  employeeBefore: true,
  employeeAfter: true,
  scheduleOwnership: true,
  applicationUserId: true,
  applicationUserCreated: true,
  firebaseUid: true,
  firebaseCreated: true,
} satisfies Prisma.HrpsImportRowSelect;

function objectValue(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function employeeSnapshot(value: Prisma.JsonValue | null): EmployeeSnapshot | null {
  const item = objectValue(value);
  if (typeof item.displayName !== "string" || typeof item.department !== "string") return null;
  if (item.employmentStatus !== "active" && item.employmentStatus !== "inactive") return null;
  return {
    displayName: item.displayName,
    department: item.department,
    position: stringValue(item.position),
    employmentStatus: item.employmentStatus,
    sourceSystem: "HRPS",
    dataSource: stringValue(item.dataSource),
    sourceUpdatedAt: stringValue(item.sourceUpdatedAt),
    syncedAt: stringValue(item.syncedAt),
  };
}

function scheduleOwnership(value: Prisma.JsonValue): ScheduleOwnership {
  const item = objectValue(value);
  return {
    createdSchedules: Array.isArray(item.createdSchedules) ? item.createdSchedules as ScheduleSnapshot[] : undefined,
    createdScheduleIds: Array.isArray(item.createdScheduleIds)
      ? item.createdScheduleIds.filter((id): id is string => typeof id === "string")
      : undefined,
    updatedSchedules: Array.isArray(item.updatedSchedules) ? item.updatedSchedules as ScheduleOwnership["updatedSchedules"] : undefined,
  };
}

function dateKey(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function timeKey(value: Date | null): string | null {
  return value ? value.toISOString().slice(11, 16) : null;
}

function employeeMatches(employee: {
  displayName: string;
  department: string;
  position: string | null;
  employmentStatus: "active" | "inactive";
  sourceSystem: "HRPS";
  dataSource: string | null;
  sourceUpdatedAt: Date | null;
  syncedAt: Date | null;
}, expected: EmployeeSnapshot): boolean {
  return employee.displayName === expected.displayName
    && employee.department === expected.department
    && employee.position === expected.position
    && employee.employmentStatus === expected.employmentStatus
    && employee.sourceSystem === expected.sourceSystem
    && employee.dataSource === expected.dataSource
    && (employee.sourceUpdatedAt?.toISOString() ?? null) === expected.sourceUpdatedAt
    && (employee.syncedAt?.toISOString() ?? null) === expected.syncedAt;
}

function scheduleMatches(schedule: {
  scheduleId: string;
  workStart: Date | null;
  workEnd: Date | null;
  breakStart: Date | null;
  breakEnd: Date | null;
  shiftLabel: string | null;
  workDays: Prisma.JsonValue;
  restDays: Prisma.JsonValue;
  workLocation: string | null;
  sourceSystem: "HRPS";
  dataSource: string | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
}, expected: ScheduleSnapshot): boolean {
  const value = expected.schedule;
  const jsonDays = (input: Prisma.JsonValue) => Array.isArray(input) ? input.join("|") : "";
  return schedule.scheduleId === value.scheduleId
    && timeKey(schedule.workStart) === value.workStart
    && timeKey(schedule.workEnd) === value.workEnd
    && timeKey(schedule.breakStart) === value.breakStart
    && timeKey(schedule.breakEnd) === value.breakEnd
    && schedule.shiftLabel === value.shiftLabel
    && schedule.workLocation === value.workLocation
    && (expected.dataSource === undefined || schedule.dataSource === expected.dataSource)
    && dateKey(schedule.effectiveFrom) === value.effectiveFrom
    && dateKey(schedule.effectiveTo) === value.effectiveTo
    && jsonDays(schedule.workDays) === value.workDays.join("|")
    && jsonDays(schedule.restDays) === value.restDays.join("|");
}

function timeDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function dateValue(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function instantValue(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

function scheduleData(snapshot: ScheduleSnapshot) {
  const value = snapshot.schedule;
  return {
    scheduleId: value.scheduleId,
    workStart: timeDate(value.workStart),
    workEnd: timeDate(value.workEnd),
    breakStart: value.breakStart ? timeDate(value.breakStart) : null,
    breakEnd: value.breakEnd ? timeDate(value.breakEnd) : null,
    shiftLabel: value.shiftLabel,
    workDays: toJson(value.workDays),
    restDays: toJson(value.restDays),
    workLocation: value.workLocation,
    sourceSystem: snapshot.sourceSystem ?? "HRPS",
    dataSource: snapshot.dataSource,
    effectiveFrom: dateValue(value.effectiveFrom),
    effectiveTo: dateValue(value.effectiveTo),
  };
}

function summaryFromPreview(preview: HrpsRollbackPreview): HrpsRollbackSummary {
  return {
    employeesDeleted: preview.employeesToDelete,
    employeesRestored: preview.employeesToRestore,
    schedulesDeleted: preview.schedulesToDelete,
    schedulesRestored: preview.schedulesToRestore,
    applicationUsersDeleted: preview.applicationUsersToDelete,
    firebaseAccountsDeleted: preview.firebaseUsersToDelete,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof HrpsRollbackError) return error.message;
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return `Rollback operation failed (${error.code}).`;
  }
  return "The HRPS rollback could not be completed safely.";
}

async function recordRollbackFailure(input: {
  importId: string;
  actor: SessionUser;
  actorUserId: string | null;
  message: string;
}) {
  const prisma = getPrismaClient();
  await prisma.hrpsImport.update({
    where: { id: input.importId },
    data: { status: "ROLLBACK_FAILED", rollbackErrorSummary: input.message },
  }).catch(() => undefined);
  await prisma.auditEvent.create({
    data: {
      eventType: "hrps.import.rollback_failed",
      action: "HRPS Import Rollback Failed",
      module: "HRPS Integration",
      actorType: "user",
      actorUserId: input.actorUserId,
      actorUid: input.actor.uid,
      actorSnapshot: toJson(toActorSnapshot(input.actor)),
      targetType: "hrps_import",
      targetId: input.importId,
      targetReference: input.importId,
      targetLabel: input.importId,
      outcome: "Failed",
      summary: input.message,
      metadata: toJson({ importId: input.importId }),
      occurredAt: new Date(),
    },
  }).catch(() => undefined);
}

async function buildRollbackPlan(importId: string, allowRollingBack = false): Promise<RollbackPlan> {
  const prisma = getPrismaClient();
  const record = await prisma.hrpsImport.findUnique({
    where: { id: importId },
    select: {
      id: true,
      filename: true,
      status: true,
      startedAt: true,
      createdEmployees: true,
      updatedEmployees: true,
      schedulesCreated: true,
      schedulesUpdated: true,
      rollbackSummary: true,
      rows: { select: rollbackRowSelect, orderBy: { rowNumber: "asc" } },
    },
  });
  if (!record) throw new HrpsRollbackError("HRPS_IMPORT_NOT_FOUND", "The HRPS import record was not found.", 404);

  if (record.status === "ROLLED_BACK") {
    return {
      importRecord: record,
      firebaseUids: [],
      preview: {
        importId: record.id,
        filename: record.filename,
        status: record.status,
        employeesToDelete: 0,
        employeesToRestore: 0,
        schedulesToDelete: 0,
        schedulesToRestore: 0,
        applicationUsersToDelete: 0,
        firebaseUsersToDelete: 0,
        blockedRecords: [],
        warnings: ["This import has already been rolled back. No additional changes are required."],
        rollbackAllowed: false,
        alreadyRolledBack: true,
      },
    };
  }

  const allowedStatuses = allowRollingBack
    ? ["COMPLETED", "COMPLETED_WITH_ERRORS", "ROLLING_BACK", "ROLLBACK_FAILED"]
    : ["COMPLETED", "COMPLETED_WITH_ERRORS", "ROLLBACK_FAILED"];
  if (!allowedStatuses.includes(record.status)) {
    throw new HrpsRollbackError("HRPS_ROLLBACK_STATUS", `Imports with status ${record.status} cannot be rolled back.`);
  }

  const changedRows = record.rows.filter((row) => row.employeeRecordId && (row.employeeCreated || row.employeeBefore || row.scheduleOwnership));
  const employeeIds = [...new Set(changedRows.map((row) => row.employeeId).filter((value): value is string => Boolean(value)))];
  const laterRows = employeeIds.length
    ? await prisma.hrpsImportRow.findMany({
      where: {
        employeeId: { in: employeeIds },
        importId: { not: record.id },
        classification: { in: ["NEW", "UPDATED"] },
        import: {
          startedAt: { gt: record.startedAt },
          status: { in: ["PROCESSING", "COMPLETED", "COMPLETED_WITH_ERRORS", "ROLLING_BACK", "ROLLBACK_FAILED"] },
        },
        rollbackStatus: { not: "ROLLED_BACK" },
      },
      select: { employeeId: true, rowNumber: true, importId: true },
    })
    : [];
  const laterByEmployee = new Set(laterRows.map((row) => row.employeeId).filter((value): value is string => Boolean(value)));

  const blockedRecords: HrpsRollbackBlockedRecord[] = [];
  const warnings: string[] = [];
  const addBlocked = (row: RollbackRow, reason: string) => blockedRecords.push({ employeeId: row.employeeId, rowNumber: row.rowNumber, reason });
  if (!changedRows.length && (record.createdEmployees > 0 || record.updatedEmployees > 0 || record.schedulesCreated > 0 || record.schedulesUpdated > 0)) {
    blockedRecords.push({
      employeeId: null,
      rowNumber: null,
      reason: "This import predates row-level rollback ownership metadata; no business records will be guessed or deleted.",
    });
  }
  let employeesToDelete = 0;
  let employeesToRestore = 0;
  let schedulesToDelete = 0;
  let schedulesToRestore = 0;
  let applicationUsersToDelete = 0;
  const firebaseUids: string[] = [];

  for (const row of changedRows) {
    if (row.employeeId && laterByEmployee.has(row.employeeId)) {
      addBlocked(row, "A later HRPS import modified this Employee; restoring this import would overwrite newer source data.");
    }

    const employee = await prisma.employee.findUnique({
      where: { id: row.employeeRecordId! },
      select: {
        id: true,
        employeeId: true,
        displayName: true,
        department: true,
        position: true,
        employmentStatus: true,
        sourceSystem: true,
        dataSource: true,
        sourceUpdatedAt: true,
        syncedAt: true,
        users: { select: { id: true, username: true, role: { select: { code: true } } } },
        _count: { select: { attendanceRecords: true, corrections: true, payrollBatchItems: true, payrollResultItems: true, payslips: true } },
      },
    });
    if (!employee) {
      addBlocked(row, "The owned Employee record is missing; rollback ownership cannot be verified safely.");
      continue;
    }

    const after = employeeSnapshot(row.employeeAfter);
    const before = employeeSnapshot(row.employeeBefore);
    if (!after) {
      addBlocked(row, "The import does not contain a valid after-state snapshot for this Employee.");
    } else if (!employeeMatches(employee, after)) {
      addBlocked(row, "The Employee's HRPS-owned fields changed after this import; rollback is blocked.");
    }

    const ownership = scheduleOwnership(row.scheduleOwnership);
    const createdSchedules = ownership.createdSchedules ?? [];
    const legacyCreatedIds = ownership.createdScheduleIds ?? [];
    schedulesToDelete += createdSchedules.length + legacyCreatedIds.length;
    schedulesToRestore += ownership.updatedSchedules?.length ?? 0;
    for (const schedule of createdSchedules) {
      const current = await prisma.employeeSchedule.findUnique({ where: { id: schedule.id } });
      if (!current || current.employeeId !== employee.id) addBlocked(row, "An import-owned schedule is missing or no longer belongs to the owned Employee.");
      else if (!scheduleMatches(current, schedule)) addBlocked(row, "An import-owned schedule changed after this import.");
    }
    if (legacyCreatedIds.length) {
      addBlocked(row, "This import has schedule ownership IDs without after-state snapshots; deploy the rollback metadata migration before retrying.");
    }
    for (const update of ownership.updatedSchedules ?? []) {
      const current = await prisma.employeeSchedule.findUnique({ where: { id: update.after.id } });
      if (!current || current.employeeId !== employee.id) addBlocked(row, "An updated schedule is missing or no longer belongs to the owned Employee.");
      else if (!scheduleMatches(current, update.after)) addBlocked(row, "An updated schedule changed after this import.");
    }

    if (row.employeeCreated) {
      const protectedUsers = employee.users.filter((user) => !(row.applicationUserCreated && user.id === row.applicationUserId));
      if (protectedUsers.length) addBlocked(row, "The imported Employee has a pre-existing application account; it will not be deleted automatically.");
      const dependencyCount = employee._count.attendanceRecords
        + employee._count.corrections
        + employee._count.payrollBatchItems
        + employee._count.payrollResultItems
        + employee._count.payslips;
      if (dependencyCount) addBlocked(row, "Attendance, correction, Payroll, or payslip records exist for this Employee.");
      employeesToDelete += 1;
    } else if (before) {
      employeesToRestore += 1;
    } else {
      addBlocked(row, "The updated Employee before-state snapshot is missing.");
    }

    if (row.applicationUserCreated && row.applicationUserId) {
      const user = await prisma.user.findUnique({
        where: { id: row.applicationUserId },
        select: { id: true, username: true, role: { select: { code: true } }, _count: { select: { auditEvents: true } } },
      });
      if (!user) addBlocked(row, "The import-owned application account is missing; ownership cannot be verified.");
      else if (user.username === "aujsc.admin" || user.role.code === "admin") addBlocked(row, "Privileged application accounts are protected from HRPS rollback.");
      else if (user._count.auditEvents) addBlocked(row, "The import-owned application account has audit history and cannot be deleted automatically.");
      else applicationUsersToDelete += 1;
    }

    if (row.firebaseCreated && row.firebaseUid) firebaseUids.push(row.firebaseUid);
  }

  if (!changedRows.length) warnings.push("This import has no persisted Employee or schedule changes eligible for rollback.");
  if (!firebaseUids.length) warnings.push("No Firebase identities were created by the current HRPS importer; Firebase cleanup is not required.");

  const preview: HrpsRollbackPreview = {
    importId: record.id,
    filename: record.filename,
    status: record.status,
    employeesToDelete,
    employeesToRestore,
    schedulesToDelete,
    schedulesToRestore,
    applicationUsersToDelete,
    firebaseUsersToDelete: firebaseUids.length,
    blockedRecords,
    warnings,
    rollbackAllowed: blockedRecords.length === 0,
    alreadyRolledBack: false,
  };
  return { importRecord: record, firebaseUids: [...new Set(firebaseUids)], preview };
}

export async function getHrpsRollbackPreview(importId: string): Promise<HrpsRollbackPreview> {
  return (await buildRollbackPlan(importId)).preview;
}

async function deleteOwnedFirebaseAccounts(uids: string[]): Promise<"not_required" | "completed"> {
  if (!uids.length) return "not_required";
  const auth = getFirebaseAdminAuth();
  for (const uid of uids) {
    try {
      await auth.deleteUser(uid);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") continue;
      throw error;
    }
  }
  return "completed";
}

export async function rollbackHrpsImport(input: {
  importId: string;
  actor: SessionUser;
}): Promise<HrpsRollbackResult> {
  const prisma = getPrismaClient();
  const actorUserId = await findUserIdByFirebaseUid(input.actor.uid);
  const initialPlan = await buildRollbackPlan(input.importId);
  if (initialPlan.preview.alreadyRolledBack) {
    const summary = summaryFromPreview(initialPlan.preview);
    return { importId: input.importId, status: "ROLLED_BACK", summary, firebaseCleanup: "not_required" };
  }
  if (!initialPlan.preview.rollbackAllowed) {
    throw new HrpsRollbackError("HRPS_ROLLBACK_BLOCKED", initialPlan.preview.blockedRecords[0]?.reason ?? "Rollback is blocked by a safety check.");
  }

  const claim = await prisma.hrpsImport.updateMany({
    where: { id: input.importId, status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS", "ROLLBACK_FAILED"] } },
    data: { status: "ROLLING_BACK", rollbackStartedAt: new Date(), rollbackErrorSummary: null },
  });
  if (claim.count !== 1) {
    const current = await prisma.hrpsImport.findUnique({ where: { id: input.importId }, select: { status: true } });
    if (current?.status === "ROLLED_BACK") return { importId: input.importId, status: "ROLLED_BACK", summary: summaryFromPreview(initialPlan.preview), firebaseCleanup: "not_required" };
    throw new HrpsRollbackError("HRPS_ROLLBACK_CONCURRENT", "Another rollback is already processing this import.");
  }

  let plan: RollbackPlan;
  try {
    plan = await buildRollbackPlan(input.importId, true);
    if (!plan.preview.rollbackAllowed) {
      throw new HrpsRollbackError("HRPS_ROLLBACK_BLOCKED", plan.preview.blockedRecords[0]?.reason ?? "Rollback is blocked by a safety check.");
    }
  } catch (error) {
    const message = errorMessage(error);
    await recordRollbackFailure({ importId: input.importId, actor: input.actor, actorUserId, message });
    throw error;
  }

  let firebaseCleanup: "not_required" | "completed";
  try {
    firebaseCleanup = await deleteOwnedFirebaseAccounts(plan.firebaseUids);
  } catch (error) {
    const message = `Firebase cleanup failed before PostgreSQL rollback: ${errorMessage(error)}`;
    await recordRollbackFailure({ importId: input.importId, actor: input.actor, actorUserId, message });
    throw new HrpsRollbackError("HRPS_FIREBASE_ROLLBACK_FAILED", message, 503);
  }

  const summary = summaryFromPreview(plan.preview);
  try {
    await prisma.$transaction(async (transaction) => {
      for (const row of plan.importRecord.rows) {
        if (!row.employeeRecordId) continue;
        const ownership = scheduleOwnership(row.scheduleOwnership);
        const before = employeeSnapshot(row.employeeBefore);
        const after = employeeSnapshot(row.employeeAfter);
        const currentEmployee = await transaction.employee.findUnique({
          where: { id: row.employeeRecordId },
          select: {
            id: true,
            displayName: true,
            department: true,
            position: true,
            employmentStatus: true,
            sourceSystem: true,
            dataSource: true,
            sourceUpdatedAt: true,
            syncedAt: true,
          },
        });
        if (!currentEmployee || !after || !employeeMatches(currentEmployee, after)) {
          throw new HrpsRollbackError("HRPS_ROLLBACK_STALE", "A targeted Employee changed after the rollback checks; no business changes were committed.");
        }
        if (row.employeeCreated) {
          if (row.applicationUserCreated && row.applicationUserId) {
            const user = await transaction.user.findUnique({
              where: { id: row.applicationUserId },
              select: { username: true, role: { select: { code: true } }, _count: { select: { auditEvents: true } } },
            });
            if (!user || user.username === "aujsc.admin" || user.role.code === "admin" || user._count.auditEvents) {
              throw new HrpsRollbackError("HRPS_ROLLBACK_USER_CHANGED", "An import-owned application account is now protected; no business changes were committed.");
            }
            await transaction.user.delete({ where: { id: row.applicationUserId } });
          }
          for (const schedule of ownership.createdSchedules ?? []) {
            const currentSchedule = await transaction.employeeSchedule.findUnique({ where: { id: schedule.id } });
            if (!currentSchedule || currentSchedule.employeeId !== row.employeeRecordId || !scheduleMatches(currentSchedule, schedule)) {
              throw new HrpsRollbackError("HRPS_ROLLBACK_STALE", "An import-owned schedule changed after the rollback checks; no business changes were committed.");
            }
            await transaction.employeeSchedule.delete({ where: { id: schedule.id } });
          }
          await transaction.employee.delete({ where: { id: row.employeeRecordId } });
        } else {
          for (const schedule of ownership.createdSchedules ?? []) {
            const currentSchedule = await transaction.employeeSchedule.findUnique({ where: { id: schedule.id } });
            if (!currentSchedule || currentSchedule.employeeId !== row.employeeRecordId || !scheduleMatches(currentSchedule, schedule)) {
              throw new HrpsRollbackError("HRPS_ROLLBACK_STALE", "An import-owned schedule changed after the rollback checks; no business changes were committed.");
            }
            await transaction.employeeSchedule.delete({ where: { id: schedule.id } });
          }
          for (const update of ownership.updatedSchedules ?? []) {
            const currentSchedule = await transaction.employeeSchedule.findUnique({ where: { id: update.after.id } });
            if (!currentSchedule || currentSchedule.employeeId !== row.employeeRecordId || !scheduleMatches(currentSchedule, update.after)) {
              throw new HrpsRollbackError("HRPS_ROLLBACK_STALE", "An updated schedule changed after the rollback checks; no business changes were committed.");
            }
            await transaction.employeeSchedule.update({ where: { id: update.before.id }, data: scheduleData(update.before) });
          }
          if (before) {
            await transaction.employee.update({
              where: { id: row.employeeRecordId },
              data: {
                displayName: before.displayName,
                department: before.department,
                position: before.position,
                employmentStatus: before.employmentStatus,
                sourceSystem: before.sourceSystem,
                dataSource: before.dataSource,
                sourceUpdatedAt: instantValue(before.sourceUpdatedAt),
                syncedAt: instantValue(before.syncedAt),
              },
            });
          }
        }
      }
      await transaction.hrpsImportRow.updateMany({
        where: { importId: input.importId },
        data: { rollbackStatus: "ROLLED_BACK", rollbackMessage: "Reversed by the confirmed HRPS rollback." },
      });
      await transaction.hrpsImport.update({
        where: { id: input.importId },
        data: {
          status: "ROLLED_BACK",
          rolledBackAt: new Date(),
          rolledBackByUserId: actorUserId,
          rolledBackBySnapshot: toJson(toActorSnapshot(input.actor)),
          rollbackSummary: toJson(summary),
          rollbackErrorSummary: null,
        },
      });
      await transaction.auditEvent.create({
        data: {
          eventType: "hrps.import.rolled_back",
          action: "HRPS Import Rolled Back",
          module: "HRPS Integration",
          actorType: "user",
          actorUserId,
          actorUid: input.actor.uid,
          actorSnapshot: toJson(toActorSnapshot(input.actor)),
          targetType: "hrps_import",
          targetId: input.importId,
          targetReference: plan.importRecord.filename,
          targetLabel: plan.importRecord.filename,
          outcome: "Successful",
          summary: "An HRPS import was safely rolled back after dependency and ownership checks passed.",
          metadata: toJson({ importId: input.importId, ...summary, firebaseCleanup }),
          occurredAt: new Date(),
        },
      });
    });
  } catch (error) {
    const message = `PostgreSQL rollback failed after Firebase cleanup: ${errorMessage(error)}`;
    await recordRollbackFailure({ importId: input.importId, actor: input.actor, actorUserId, message });
    throw new HrpsRollbackError("HRPS_POSTGRES_ROLLBACK_FAILED", message, 503);
  }

  return { importId: input.importId, status: "ROLLED_BACK", summary, firebaseCleanup };
}
