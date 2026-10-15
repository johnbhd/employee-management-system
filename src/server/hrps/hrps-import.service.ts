import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { checkPostgresHealth, getPrismaClient } from "@/lib/prisma/server";
import { findUserIdByFirebaseUid, toJson, toActorSnapshot } from "@/server/repositories/prisma/prisma-repository-helpers";
import {
  canonicalizeHrpsHeaders,
  HrpsCsvError,
  parseCsv,
  parseHrpsRows,
  type ParsedHrpsRow,
} from "./hrps-csv";
import {
  HrpsAccountProvisioningError,
  provisionHrpsEmployeeAccount,
} from "./hrps-account-provisioning.service";
import type { SessionUser } from "@/types/auth";
import type {
  HrpsEmployeeInput,
  HrpsImportChange,
  HrpsImportClassification,
  HrpsImportHistoryData,
  HrpsImportHistoryItem,
  HrpsImportPreview,
  HrpsImportPreviewRow,
  HrpsImportResult,
  HrpsImportSummary,
  HrpsRollbackSummary,
  HrpsScheduleInput,
} from "@/types/hrps-import";

export const HRPS_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const HRPS_MAX_ROWS = 10000;

type ExistingEmployee = Prisma.EmployeeGetPayload<{
  include: {
    users: { select: { id: true; username: true; status: true; role: { select: { code: true } } } };
    schedules: { orderBy: { effectiveFrom: "desc" }; select: {
      id: true;
      scheduleId: true;
      workStart: true;
      workEnd: true;
      breakStart: true;
      breakEnd: true;
      shiftLabel: true;
      workDays: true;
      restDays: true;
      workLocation: true;
      effectiveFrom: true;
      effectiveTo: true;
    } };
  };
}>;

type HrpsEmployeeOwnershipSnapshot = {
  displayName: string;
  department: string;
  position: string | null;
  employmentStatus: "active" | "inactive";
  sourceSystem: "HRPS";
  dataSource: string | null;
  sourceUpdatedAt: string | null;
  syncedAt: string | null;
};

type HrpsScheduleOwnershipSnapshot = {
  id: string;
  sourceSystem: "HRPS";
  dataSource: string | null;
  schedule: HrpsScheduleInput;
};

type HrpsScheduleOwnership = {
  createdSchedules: HrpsScheduleOwnershipSnapshot[];
  updatedSchedules: Array<{
    before: HrpsScheduleOwnershipSnapshot;
    after: HrpsScheduleOwnershipSnapshot;
  }>;
};

export class HrpsImportError extends Error {
  readonly code: string;
  readonly status: 400 | 409 | 503;

  constructor(code: string, message: string, status: 400 | 409 | 503 = 400) {
    super(message);
    this.name = "HrpsImportError";
    this.code = code;
    this.status = status;
  }
}

function safeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "hrps-import.csv";
  return base.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 255) || "hrps-import.csv";
}

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function dateKey(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function timeKey(value: Date | null): string | null {
  return value ? value.toISOString().slice(11, 16) : null;
}

function jsonStrings(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function scheduleSnapshot(schedule: ExistingEmployee["schedules"][number]): HrpsScheduleInput {
  return {
    scheduleId: schedule.scheduleId,
    workStart: timeKey(schedule.workStart) ?? "",
    workEnd: timeKey(schedule.workEnd) ?? "",
    breakStart: timeKey(schedule.breakStart),
    breakEnd: timeKey(schedule.breakEnd),
    shiftLabel: schedule.shiftLabel,
    workDays: jsonStrings(schedule.workDays),
    restDays: jsonStrings(schedule.restDays),
    workLocation: schedule.workLocation,
    effectiveFrom: dateKey(schedule.effectiveFrom),
    effectiveTo: dateKey(schedule.effectiveTo),
  };
}

function employeeOwnershipSnapshot(employee: {
  displayName: string;
  department: string;
  position: string | null;
  employmentStatus: "active" | "inactive";
  sourceSystem: "HRPS";
  dataSource: string | null;
  sourceUpdatedAt: Date | null;
  syncedAt: Date | null;
}): HrpsEmployeeOwnershipSnapshot {
  return {
    displayName: employee.displayName,
    department: employee.department,
    position: employee.position,
    employmentStatus: employee.employmentStatus,
    sourceSystem: employee.sourceSystem,
    dataSource: employee.dataSource,
    sourceUpdatedAt: employee.sourceUpdatedAt?.toISOString() ?? null,
    syncedAt: employee.syncedAt?.toISOString() ?? null,
  };
}

function scheduleOwnershipSnapshot(schedule: {
  id: string;
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
}): HrpsScheduleOwnershipSnapshot {
  return {
    id: schedule.id,
    sourceSystem: schedule.sourceSystem,
    dataSource: schedule.dataSource,
    schedule: scheduleSnapshot(schedule),
  };
}

function emptyScheduleOwnership(): HrpsScheduleOwnership {
  return { createdSchedules: [], updatedSchedules: [] };
}

function scheduleEqual(left: HrpsScheduleInput, right: HrpsScheduleInput): boolean {
  return left.scheduleId === right.scheduleId
    && left.workStart === right.workStart
    && left.workEnd === right.workEnd
    && left.breakStart === right.breakStart
    && left.breakEnd === right.breakEnd
    && left.shiftLabel === right.shiftLabel
    && left.workLocation === right.workLocation
    && left.effectiveFrom === right.effectiveFrom
    && left.effectiveTo === right.effectiveTo
    && left.workDays.join("|") === right.workDays.join("|")
    && left.restDays.join("|") === right.restDays.join("|");
}

function findComparableSchedule(
  schedules: ExistingEmployee["schedules"],
  input: HrpsScheduleInput,
) {
  return schedules.find((schedule) => (
    schedule.scheduleId === input.scheduleId
    && dateKey(schedule.effectiveFrom) === input.effectiveFrom
  ))
    ?? schedules.find((schedule) => schedule.scheduleId === input.scheduleId)
    ?? schedules.find((schedule) => (
      schedule.scheduleId.startsWith(`${input.scheduleId}:`)
      && dateKey(schedule.effectiveFrom) === input.effectiveFrom
    ));
}

function employeeChanges(existing: ExistingEmployee, input: HrpsEmployeeInput): HrpsImportChange[] {
  const changes: HrpsImportChange[] = [];
  const fields: Array<[keyof HrpsEmployeeInput, string, string | null, string | null]> = [
    ["displayName", "Name", existing.displayName, input.displayName],
    ["department", "Department", existing.department, input.department],
    ["position", "Position", existing.position, input.position],
    ["employmentStatus", "Employment status", existing.employmentStatus, input.employmentStatus],
  ];
  for (const [, label, from, to] of fields) {
    if (from !== to) changes.push({ field: label, from, to });
  }
  if (input.schedule) {
    const existingSchedule = input.schedule
      ? findComparableSchedule(existing.schedules, input.schedule)
      : undefined;
    if (!existingSchedule || !scheduleEqual(scheduleSnapshot(existingSchedule), input.schedule)) {
      changes.push({ field: "Work schedule", from: existingSchedule ? existingSchedule.scheduleId : null, to: input.schedule.scheduleId });
    }
  }
  return changes;
}

function accountStatus(existing: ExistingEmployee | null): HrpsImportPreviewRow["accountStatus"] {
  if (!existing) return "will_create";
  if (existing.users.some((user) => user.username === "aujsc.admin" || user.role.code === "admin") || existing.users.length > 1) {
    return "needs_review";
  }
  return existing.users.length === 1 ? "existing" : "will_create";
}

async function getExistingEmployees(employeeIds: string[]): Promise<Map<string, ExistingEmployee>> {
  const result = new Map<string, ExistingEmployee>();
  const prisma = getPrismaClient();
  for (let index = 0; index < employeeIds.length; index += 500) {
    const chunk = employeeIds.slice(index, index + 500);
    const employees = await prisma.employee.findMany({
      where: { employeeId: { in: chunk } },
      include: {
        users: { select: { id: true, username: true, status: true, role: { select: { code: true } } } },
        schedules: {
          orderBy: { effectiveFrom: "desc" },
          select: {
            id: true,
            scheduleId: true,
            workStart: true,
            workEnd: true,
            breakStart: true,
            breakEnd: true,
            shiftLabel: true,
            workDays: true,
            restDays: true,
            workLocation: true,
            effectiveFrom: true,
            effectiveTo: true,
          },
        },
      },
    });
    employees.forEach((employee) => result.set(employee.employeeId, employee));
  }
  return result;
}

function summaryForRows(rows: HrpsImportPreviewRow[]): HrpsImportSummary {
  const summary: HrpsImportSummary = {
    totalRows: rows.length,
    newCount: 0,
    updatedCount: 0,
    unchangedCount: 0,
    invalidCount: 0,
    duplicateCount: 0,
    needsReviewCount: 0,
    createdEmployees: 0,
    updatedEmployees: 0,
    schedulesCreated: 0,
    schedulesUpdated: 0,
    accountsProvisioned: 0,
    accountsPending: 0,
    accountsFailed: 0,
  };
  rows.forEach((row) => {
    if (row.classification === "NEW") summary.newCount += 1;
    if (row.classification === "UPDATED") summary.updatedCount += 1;
    if (row.classification === "UNCHANGED") summary.unchangedCount += 1;
    if (row.classification === "INVALID") summary.invalidCount += 1;
    if (row.classification === "DUPLICATE") summary.duplicateCount += 1;
    if (row.classification === "NEEDS_REVIEW") summary.needsReviewCount += 1;
    if (row.accountStatus === "existing") summary.accountsProvisioned += 1;
  });
  return summary;
}

export async function buildHrpsImportPreview(content: string, filename: string): Promise<HrpsImportPreview> {
  if (Buffer.byteLength(content, "utf8") > HRPS_MAX_FILE_BYTES) {
    throw new HrpsImportError("FILE_TOO_LARGE", "The CSV must be 5 MB or smaller.");
  }
  let parsed;
  let canonical;
  let parsedRows: ParsedHrpsRow[];
  try {
    parsed = parseCsv(content, HRPS_MAX_ROWS);
    canonical = canonicalizeHrpsHeaders(parsed.headers);
    parsedRows = parseHrpsRows(canonical, parsed.rows);
  } catch (error) {
    if (error instanceof HrpsImportError) throw error;
    if (error instanceof HrpsCsvError) throw new HrpsImportError(error.code, error.message);
    throw new HrpsImportError("CSV_INVALID", "The CSV could not be read safely.");
  }

  const ids = [...new Set(parsedRows.map((row) => row.employeeId).filter((id): id is string => Boolean(id)))];
  const existing = await getExistingEmployees(ids);
  const duplicateIds = new Set<string>();
  const seen = new Set<string>();
  parsedRows.forEach((row) => {
    if (!row.employeeId) return;
    if (seen.has(row.employeeId)) duplicateIds.add(row.employeeId);
    seen.add(row.employeeId);
  });

  const rows: HrpsImportPreviewRow[] = parsedRows.map((row) => {
    if (row.errors.length) {
      return { ...row, classification: "INVALID", changes: [], accountStatus: "not_applicable" };
    }
    if (row.employeeId && duplicateIds.has(row.employeeId)) {
      return {
        ...row,
        classification: "DUPLICATE",
        errors: [...row.errors, "The Employee ID appears more than once in this file."],
        changes: [],
        accountStatus: "not_applicable",
      };
    }

    const employee = existing.get(row.employeeId!) ?? null;
    const changes = employee ? employeeChanges(employee, row.input!) : [];
    const currentAccountStatus = accountStatus(employee);
    const warnings = [...row.warnings];
    if (currentAccountStatus === "will_create") {
      warnings.push("A Firebase Employee account will be created with the approved AU-JSC username and mandatory first-login password change.");
    }
    if (currentAccountStatus === "needs_review") {
      warnings.push("The employee has an ambiguous or privileged application-account link and requires Admin review.");
    }
    const classification: HrpsImportClassification = currentAccountStatus === "needs_review"
      ? "NEEDS_REVIEW"
      : employee && changes.length
        ? "UPDATED"
        : employee
          ? "UNCHANGED"
          : "NEW";
    return {
      ...row,
      warnings,
      classification,
      changes,
      accountStatus: currentAccountStatus,
    };
  });

  return {
    previewToken: hashContent(content),
    filename: safeFilename(filename),
    supportedHeaders: canonical.supported,
    ignoredHeaders: canonical.ignored,
    rows,
    summary: summaryForRows(rows),
  };
}

function timeDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function dateValue(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function scheduleWriteData(schedule: HrpsScheduleInput, scheduleId = schedule.scheduleId) {
  return {
    scheduleId,
    workStart: timeDate(schedule.workStart),
    workEnd: timeDate(schedule.workEnd),
    breakStart: schedule.breakStart ? timeDate(schedule.breakStart) : null,
    breakEnd: schedule.breakEnd ? timeDate(schedule.breakEnd) : null,
    shiftLabel: schedule.shiftLabel,
    workDays: toJson(schedule.workDays),
    restDays: toJson(schedule.restDays),
    workLocation: schedule.workLocation,
    sourceSystem: "HRPS" as const,
    dataSource: "hrps-csv-import",
    effectiveFrom: dateValue(schedule.effectiveFrom),
    effectiveTo: dateValue(schedule.effectiveTo),
  };
}

function previousDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date;
}

function versionedScheduleId(scheduleId: string, effectiveFrom: string): string {
  const suffix = `:${effectiveFrom}`;
  return `${scheduleId.slice(0, 120 - suffix.length)}${suffix}`;
}

function safeFailureMessage(error: unknown): string {
  if (error instanceof HrpsImportError || error instanceof HrpsAccountProvisioningError) return error.message;
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return `Database operation failed (${error.code}).`;
  }
  return "The row could not be synchronized.";
}

export async function synchronizeHrpsImport(input: {
  content: string;
  filename: string;
  previewToken: string;
  actor: SessionUser;
}): Promise<HrpsImportResult> {
  const preview = await buildHrpsImportPreview(input.content, input.filename);
  if (preview.previewToken !== input.previewToken) {
    throw new HrpsImportError("PREVIEW_CHANGED", "The uploaded file changed after preview. Upload it again before confirming.", 409);
  }

  const health = await checkPostgresHealth();
  if (!health.connected) {
    throw new HrpsImportError("DATABASE_UNAVAILABLE", "PostgreSQL is temporarily unavailable. No HRPS rows were changed.", 503);
  }

  const prisma = getPrismaClient();
  const actorUserId = await findUserIdByFirebaseUid(input.actor.uid);
  const startedAt = new Date();
  const history = await prisma.hrpsImport.create({
    data: {
      sourceSystem: "HRPS",
      filename: preview.filename,
      contentHash: preview.previewToken,
      initiatedByUserId: actorUserId,
      initiatedBySnapshot: toJson(toActorSnapshot(input.actor)),
      startedAt,
      status: "PROCESSING",
      totalRows: preview.summary.totalRows,
      newCount: preview.summary.newCount,
      updatedCount: preview.summary.updatedCount,
      unchangedCount: preview.summary.unchangedCount,
      invalidCount: preview.summary.invalidCount,
      duplicateCount: preview.summary.duplicateCount,
      needsReviewCount: preview.summary.needsReviewCount,
    },
  });

  await prisma.hrpsImportRow.createMany({
    data: preview.rows.map((row) => ({
      importId: history.id,
      rowNumber: row.rowNumber,
      employeeId: row.employeeId,
      classification: row.classification,
    })),
  });

  let createdEmployees = 0;
  let updatedEmployees = 0;
  let schedulesCreated = 0;
  let schedulesUpdated = 0;
  let accountsProvisioned = 0;
  const accountsPending = 0;
  let accountsFailed = 0;
  const failures: string[] = [];

  for (const row of preview.rows) {
    const needsAccountProvisioning = row.accountStatus === "will_create";
    if (row.classification !== "NEW" && row.classification !== "UPDATED" && !needsAccountProvisioning) continue;
    if (!row.input || !row.employeeId) continue;

    try {
      const result = await prisma.$transaction(async (transaction) => {
        const existingEmployee = await transaction.employee.findUnique({
          where: { employeeId: row.employeeId! },
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
        const employee = existingEmployee
          ? await transaction.employee.update({
            where: { id: existingEmployee.id },
            data: {
              displayName: row.input!.displayName,
              department: row.input!.department,
              position: row.input!.position,
              employmentStatus: row.input!.employmentStatus,
              sourceSystem: "HRPS",
              dataSource: "hrps-csv-import",
              sourceUpdatedAt: new Date(),
              syncedAt: new Date(),
            },
          })
          : await transaction.employee.create({
            data: {
              employeeId: row.input!.employeeId,
              displayName: row.input!.displayName,
              department: row.input!.department,
              position: row.input!.position,
              employmentStatus: row.input!.employmentStatus,
              sourceSystem: "HRPS",
              dataSource: "hrps-csv-import",
              sourceUpdatedAt: new Date(),
              syncedAt: new Date(),
            },
          });

        const scheduleOwnership = emptyScheduleOwnership();
        let scheduleAction: "created" | "updated" | "unchanged" = "unchanged";
        if (row.input!.schedule) {
          const schedule = row.input!.schedule;
          const schedules = await transaction.employeeSchedule.findMany({
            where: {
              employeeId: employee.id,
              OR: [
                { scheduleId: schedule.scheduleId },
                { scheduleId: { startsWith: `${schedule.scheduleId}:` } },
              ],
            },
            orderBy: { effectiveFrom: "desc" },
          });
          const existingSchedule = schedules.find((item) => (
            dateKey(item.effectiveFrom) === schedule.effectiveFrom
          )) ?? schedules.find((item) => item.scheduleId === schedule.scheduleId);
          const data = scheduleWriteData(schedule);
          if (!existingSchedule) {
            const createdSchedule = await transaction.employeeSchedule.create({ data: { ...data, employee: { connect: { id: employee.id } } } });
            scheduleOwnership.createdSchedules.push(scheduleOwnershipSnapshot(createdSchedule));
            scheduleAction = "created";
          } else if (!scheduleEqual(scheduleSnapshot(existingSchedule), schedule)) {
            const hasNewEffectivePeriod = Boolean(
              schedule.effectiveFrom
              && (!existingSchedule.effectiveFrom || schedule.effectiveFrom > dateKey(existingSchedule.effectiveFrom)!),
            );
            if (hasNewEffectivePeriod) {
              const closeAt = previousDate(schedule.effectiveFrom!);
              const before = scheduleOwnershipSnapshot(existingSchedule);
              let closedSchedule = existingSchedule;
              if (!existingSchedule.effectiveTo || existingSchedule.effectiveTo > closeAt) {
                closedSchedule = await transaction.employeeSchedule.update({
                  where: { id: existingSchedule.id },
                  data: { effectiveTo: closeAt },
                });
              }
              const createdSchedule = await transaction.employeeSchedule.create({
                data: {
                  ...scheduleWriteData(schedule, versionedScheduleId(schedule.scheduleId, schedule.effectiveFrom!)),
                  employee: { connect: { id: employee.id } },
                },
              });
              scheduleOwnership.createdSchedules.push(scheduleOwnershipSnapshot(createdSchedule));
              scheduleOwnership.updatedSchedules.push({ before, after: scheduleOwnershipSnapshot(closedSchedule) });
              scheduleAction = "created";
            } else {
              const before = scheduleOwnershipSnapshot(existingSchedule);
              const updatedSchedule = await transaction.employeeSchedule.update({ where: { id: existingSchedule.id }, data });
              scheduleOwnership.updatedSchedules.push({ before, after: scheduleOwnershipSnapshot(updatedSchedule) });
              scheduleAction = "updated";
            }
          }
        }

        const linkedUsers = await transaction.user.findMany({
          where: { employeeId: employee.id },
          select: { id: true, firebaseUid: true },
        });
        const accountAction = linkedUsers.length === 1 ? "existing" : "provision";

        await transaction.hrpsImportRow.update({
          where: { importId_rowNumber: { importId: history.id, rowNumber: row.rowNumber } },
          data: {
            employeeRecordId: employee.id,
            employeeCreated: !existingEmployee,
            employeeBefore: existingEmployee ? toJson(employeeOwnershipSnapshot(existingEmployee)) : undefined,
            employeeAfter: toJson(employeeOwnershipSnapshot(employee)),
            scheduleOwnership: toJson(scheduleOwnership),
            applicationUserId: linkedUsers.length === 1 ? linkedUsers[0].id : null,
            applicationUserCreated: false,
            firebaseUid: linkedUsers.length === 1 ? linkedUsers[0].firebaseUid : null,
            firebaseCreated: false,
          },
        });

        await transaction.auditEvent.create({
          data: {
            eventType: existingEmployee ? "hrps.employee.updated" : "hrps.employee.created",
            action: existingEmployee ? "Employee Updated From HRPS" : "Employee Created From HRPS",
            module: "HRPS Integration",
            actorType: "user",
            actorUserId,
            actorUid: input.actor.uid,
            actorSnapshot: toJson(toActorSnapshot(input.actor)),
            targetType: "employee",
            targetId: employee.id,
            targetReference: employee.employeeId,
            targetLabel: employee.displayName,
            outcome: "Successful",
            summary: existingEmployee ? "HRPS employee fields were synchronized." : "An employee was created from an HRPS CSV import.",
            metadata: toJson({ importId: history.id, rowNumber: row.rowNumber, scheduleAction, accountAction }),
            occurredAt: new Date(),
          },
        });

        return {
          created: !existingEmployee,
          scheduleAction,
          accountAction,
          employee: {
            id: employee.id,
            employeeId: employee.employeeId,
            department: employee.department,
            displayName: employee.displayName,
          },
        };
      });

      if (result.created) createdEmployees += 1;
      else updatedEmployees += 1;
      if (result.scheduleAction === "created") schedulesCreated += 1;
      if (result.scheduleAction === "updated") schedulesUpdated += 1;

      if (result.accountAction === "existing") {
        accountsProvisioned += 1;
        continue;
      }

      let account;
      try {
        account = await provisionHrpsEmployeeAccount(result.employee);
      } catch (error) {
        const provisioningError = error instanceof HrpsAccountProvisioningError
          ? error
          : new HrpsAccountProvisioningError("ACCOUNT_PROVISIONING_FAILED", safeFailureMessage(error));
        accountsFailed += 1;
        failures.push(`Row ${row.rowNumber} (${row.employeeId}): ${provisioningError.message}`);

        await prisma.$transaction(async (transaction) => {
          await transaction.hrpsImportRow.update({
            where: { importId_rowNumber: { importId: history.id, rowNumber: row.rowNumber } },
            data: {
              firebaseUid: provisioningError.firebaseUid,
              firebaseCreated: provisioningError.firebaseCreated,
            },
          });
          await transaction.auditEvent.create({
            data: {
              eventType: "hrps.employee.account_provisioning_failed",
              action: "Employee Account Provisioning Failed",
              module: "HRPS Integration",
              actorType: "user",
              actorUserId,
              actorUid: input.actor.uid,
              actorSnapshot: toJson(toActorSnapshot(input.actor)),
              targetType: "employee",
              targetId: result.employee.id,
              targetReference: result.employee.employeeId,
              targetLabel: result.employee.displayName,
              outcome: "Failed",
              summary: provisioningError.message,
              metadata: toJson({ importId: history.id, rowNumber: row.rowNumber, code: provisioningError.code }),
              occurredAt: new Date(),
            },
          });
        });
        continue;
      }

      accountsProvisioned += 1;
      await prisma.$transaction(async (transaction) => {
        await transaction.hrpsImportRow.update({
          where: { importId_rowNumber: { importId: history.id, rowNumber: row.rowNumber } },
          data: {
            applicationUserId: account.applicationUserId,
            applicationUserCreated: account.applicationUserCreated,
            firebaseUid: account.firebaseUid,
            firebaseCreated: account.firebaseCreated,
          },
        });
        await transaction.auditEvent.create({
          data: {
            eventType: "hrps.employee.account_provisioned",
            action: "Employee Account Provisioned",
            module: "HRPS Integration",
            actorType: "user",
            actorUserId,
            actorUid: input.actor.uid,
            actorSnapshot: toJson(toActorSnapshot(input.actor)),
            targetType: "employee",
            targetId: result.employee.id,
            targetReference: result.employee.employeeId,
            targetLabel: result.employee.displayName,
            outcome: "Successful",
            summary: account.action === "created"
              ? "A Firebase Employee account was created with mandatory first-login password change."
              : "The existing Employee application account was reused.",
            metadata: toJson({
              importId: history.id,
              rowNumber: row.rowNumber,
              applicationUserId: account.applicationUserId,
              firebaseUid: account.firebaseUid,
              accountAction: account.action,
              mustChangePassword: account.action === "created",
            }),
            occurredAt: new Date(),
          },
        });
      });
    } catch (error) {
      failures.push(`Row ${row.rowNumber} (${row.employeeId}): ${safeFailureMessage(error)}`);
    }
  }

  const summary: HrpsImportSummary = {
    ...preview.summary,
    createdEmployees,
    updatedEmployees,
    schedulesCreated,
    schedulesUpdated,
    accountsProvisioned,
    accountsPending,
    accountsFailed,
  };
  const status = failures.length || summary.invalidCount || summary.duplicateCount || summary.needsReviewCount || accountsFailed
    ? "COMPLETED_WITH_ERRORS"
    : "COMPLETED";
  const errorSummary = failures.length ? failures.slice(0, 10).join(" ") : null;

  await prisma.hrpsImport.update({
    where: { id: history.id },
    data: {
      completedAt: new Date(),
      status,
      createdEmployees,
      updatedEmployees,
      schedulesCreated,
      schedulesUpdated,
      accountsProvisioned,
      accountsPending,
      accountsFailed,
      errorSummary,
    },
  });

  await prisma.auditEvent.create({
    data: {
      eventType: failures.length ? "hrps.import.completed_with_errors" : "hrps.import.completed",
      action: failures.length ? "HRPS Import Completed With Errors" : "HRPS Import Completed",
      module: "HRPS Integration",
      actorType: "user",
      actorUserId,
      actorUid: input.actor.uid,
      actorSnapshot: toJson(toActorSnapshot(input.actor)),
      targetType: "hrps_import",
      targetId: history.id,
      targetReference: preview.filename,
      targetLabel: preview.filename,
      outcome: failures.length ? "Failed" : "Successful",
      summary: "An HRPS CSV synchronization was processed.",
      metadata: toJson({ importId: history.id, ...summary, failureCount: failures.length }),
      occurredAt: new Date(),
    },
  });

  const completedPreview = await buildHrpsImportPreview(input.content, input.filename);

  return {
    importId: history.id,
    status,
    preview: completedPreview,
    summary,
    accountPolicy: "New HRPS Employees receive a Firebase account using aujsc.<department>.<employee_id>, the temporary aujsc.<employee_id> onboarding credential, the Employee role, and mandatory first-login password change. Credentials are never stored or returned.",
  };
}

function mapHistory(row: {
  id: string;
  filename: string;
  status: "PROCESSING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "FAILED" | "ROLLING_BACK" | "ROLLED_BACK" | "ROLLBACK_FAILED";
  startedAt: Date;
  completedAt: Date | null;
  rollbackStartedAt: Date | null;
  rolledBackAt: Date | null;
  totalRows: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  invalidCount: number;
  duplicateCount: number;
  needsReviewCount: number;
  createdEmployees: number;
  updatedEmployees: number;
  schedulesCreated: number;
  schedulesUpdated: number;
  accountsProvisioned: number;
  accountsPending: number;
  accountsFailed: number;
  errorSummary: string | null;
  rollbackErrorSummary: string | null;
  rollbackSummary: Prisma.JsonValue | null;
  rolledBackBySnapshot: Prisma.JsonValue | null;
  initiatedBy: { displayName: string; username: string } | null;
}): HrpsImportHistoryItem {
  const rolledBackBy = row.rolledBackBySnapshot && typeof row.rolledBackBySnapshot === "object" && !Array.isArray(row.rolledBackBySnapshot)
    ? row.rolledBackBySnapshot as { displayName?: unknown; username?: unknown; role?: unknown }
    : null;
  return {
    id: row.id,
    filename: row.filename,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    rollbackStartedAt: row.rollbackStartedAt?.toISOString() ?? null,
    rolledBackAt: row.rolledBackAt?.toISOString() ?? null,
    initiatedBy: row.initiatedBy,
    rolledBackBy: rolledBackBy && typeof rolledBackBy.displayName === "string" && typeof rolledBackBy.username === "string" && typeof rolledBackBy.role === "string"
      ? { displayName: rolledBackBy.displayName, username: rolledBackBy.username, role: rolledBackBy.role }
      : null,
    errorSummary: row.errorSummary,
    rollbackErrorSummary: row.rollbackErrorSummary,
    rollbackSummary: row.rollbackSummary as HrpsRollbackSummary | null,
    summary: {
      totalRows: row.totalRows,
      newCount: row.newCount,
      updatedCount: row.updatedCount,
      unchangedCount: row.unchangedCount,
      invalidCount: row.invalidCount,
      duplicateCount: row.duplicateCount,
      needsReviewCount: row.needsReviewCount,
      createdEmployees: row.createdEmployees,
      updatedEmployees: row.updatedEmployees,
      schedulesCreated: row.schedulesCreated,
      schedulesUpdated: row.schedulesUpdated,
      accountsProvisioned: row.accountsProvisioned,
      accountsPending: row.accountsPending,
      accountsFailed: row.accountsFailed,
    },
  };
}

const historySelect = {
  id: true,
  filename: true,
  status: true,
  startedAt: true,
  completedAt: true,
  rollbackStartedAt: true,
  rolledBackAt: true,
  totalRows: true,
  newCount: true,
  updatedCount: true,
  unchangedCount: true,
  invalidCount: true,
  duplicateCount: true,
  needsReviewCount: true,
  createdEmployees: true,
  updatedEmployees: true,
  schedulesCreated: true,
  schedulesUpdated: true,
  accountsProvisioned: true,
  accountsPending: true,
  accountsFailed: true,
  errorSummary: true,
  rollbackErrorSummary: true,
  rollbackSummary: true,
  rolledBackBySnapshot: true,
  initiatedBy: { select: { displayName: true, username: true } },
} satisfies Prisma.HrpsImportSelect;

export async function listHrpsImportHistory(page = 1, pageSize = 10): Promise<HrpsImportHistoryData> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const where: Prisma.HrpsImportWhereInput = {};
  const [rows, total] = await Promise.all([
    getPrismaClient().hrpsImport.findMany({
      where,
      select: historySelect,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      skip: (safePage - 1) * safePageSize,
      take: safePageSize + 1,
    }),
    getPrismaClient().hrpsImport.count({ where }),
  ]);
  return {
    items: rows.slice(0, safePageSize).map(mapHistory),
    total,
    page: safePage,
    pageSize: safePageSize,
    hasNext: rows.length > safePageSize,
  };
}

export async function getHrpsImportHistory(id: string): Promise<HrpsImportHistoryItem | null> {
  const row = await getPrismaClient().hrpsImport.findUnique({ where: { id }, select: historySelect });
  return row ? mapHistory(row) : null;
}
