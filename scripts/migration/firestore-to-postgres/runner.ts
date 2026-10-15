import { randomUUID } from "node:crypto";

import { Prisma, type PrismaClient } from "@prisma/client";

import type {
  MigrationContext,
  MigrationDomain,
  MigrationFinding,
  TargetMaps,
  SourceRecord,
} from "./types";
import { recordsFor } from "./source";
import {
  mapAccountingTransfer,
  mapAudit,
  mapAttendance,
  mapBatch,
  mapBatchItem,
  mapCorrection,
  mapEmployee,
  mapHandoff,
  mapPayslip,
  mapResult,
  mapResultItem,
  mapSchedule,
  mapSetting,
  mapUser,
  type MappedCorrection,
  type MappedEmployee,
} from "./mappings";
import { addFinding, compactError, jsonObject, sourceKey } from "./utils";
import { emptyDomainReport, makeManifestEntry, statusDistribution } from "./report";

type Database = PrismaClient | Prisma.TransactionClient;

export async function createTargetMaps(db: Database): Promise<TargetMaps> {
  const [employees, users, attendance, batches, handoffs, results, resultItems] = await Promise.all([
    db.employee.findMany({ select: { id: true, employeeId: true, legacyFirestoreId: true } }),
    db.user.findMany({ select: { id: true, firebaseUid: true, username: true, employee: { select: { employeeId: true } } } }),
    db.attendanceRecord.findMany({ select: { id: true, employee: { select: { employeeId: true } }, attendanceDate: true, legacyFirestoreId: true } }),
    db.payrollBatch.findMany({ select: { id: true, batchReference: true, legacyFirestoreId: true } }),
    db.payrollHandoff.findMany({ select: { id: true, transferReference: true, legacyFirestoreId: true } }),
    db.payrollResult.findMany({ select: { id: true, resultReference: true, legacyFirestoreId: true } }),
    db.payrollResultItem.findMany({ select: { id: true, externalEmployeeReference: true, result: { select: { legacyFirestoreId: true } }, legacyFirestoreId: true } }),
  ]);

  const maps: TargetMaps = {
    employees: new Map(),
    users: new Map(),
    usersByUsername: new Map(),
    attendance: new Map(),
    batches: new Map(),
    handoffs: new Map(),
    results: new Map(),
    resultItems: new Map(),
  };

  for (const employee of employees) {
    maps.employees.set(employee.employeeId, employee.id);
    if (employee.legacyFirestoreId) maps.employees.set(sourceKey("employees", employee.legacyFirestoreId), employee.id);
  }
  for (const user of users) {
    maps.users.set(user.firebaseUid, user.id);
    maps.usersByUsername.set(user.username, user.id);
    if (user.employee?.employeeId) maps.users.set(`employee:${user.employee.employeeId}`, user.id);
  }
  for (const record of attendance) {
    const date = record.attendanceDate.toISOString().slice(0, 10);
    maps.attendance.set(`${record.employee.employeeId}_${date}`, record.id);
    if (record.legacyFirestoreId) maps.attendance.set(sourceKey("attendance", record.legacyFirestoreId), record.id);
  }
  for (const batch of batches) {
    maps.batches.set(batch.batchReference, batch.id);
    if (batch.legacyFirestoreId) maps.batches.set(sourceKey("payrollBatches", batch.legacyFirestoreId), batch.id);
  }
  for (const handoff of handoffs) {
    maps.handoffs.set(handoff.transferReference, handoff.id);
    if (handoff.legacyFirestoreId) maps.handoffs.set(sourceKey("payrollHandoffs", handoff.legacyFirestoreId), handoff.id);
  }
  for (const result of results) {
    maps.results.set(result.resultReference, result.id);
    if (result.legacyFirestoreId) maps.results.set(sourceKey("payrollResults", result.legacyFirestoreId), result.id);
  }
  for (const item of resultItems) {
    if (item.legacyFirestoreId) maps.resultItems.set(sourceKey("payrollResultItems", item.legacyFirestoreId), item.id);
    if (item.result.legacyFirestoreId) maps.resultItems.set(`${item.result.legacyFirestoreId}:${item.externalEmployeeReference}`, item.id);
  }

  return maps;
}

export async function migrateDomain(
  domain: MigrationDomain,
  db: Database,
  context: MigrationContext,
  maps: TargetMaps,
): Promise<void> {
  switch (domain) {
    case "roles":
      await migrateRoles(db, context);
      return;
    case "employees":
      await migrateEmployees(db, context, maps);
      return;
    case "schedules":
      await migrateSchedules(db, context, maps);
      return;
    case "identity":
      await migrateIdentity(db, context, maps);
      return;
    case "attendance":
      await migrateAttendance(db, context, maps);
      return;
    case "corrections":
      await migrateCorrections(db, context, maps);
      return;
    case "payroll":
      await migratePayroll(db, context, maps);
      return;
    case "payslips":
      await migratePayslips(db, context, maps);
      return;
    case "accounting":
      await migrateAccounting(db, context, maps);
      return;
    case "audit":
      await migrateAudit(db, context, maps);
      return;
    case "settings":
      await migrateSettings(db, context, maps);
      return;
  }
}

async function migrateRoles(db: Database, context: MigrationContext): Promise<void> {
  const report = domainReport(context, "roles");
  const rows = recordsFor(context.source, "rolePermissions");
  report.source = rows.length;
  report.targetBefore = await db.applicationRole.count();
  for (const record of rows) {
    const data = record.data as Record<string, unknown>;
    const roleCode = typeof data.role === "string" ? data.role : typeof data.roleCode === "string" ? data.roleCode : record.id;
    const permissionKeys = Array.isArray(data.permissions)
      ? data.permissions.filter((item): item is string => typeof item === "string")
      : Array.isArray(data.permissionKeys) ? data.permissionKeys.filter((item): item is string => typeof item === "string") : null;
    if (!permissionKeys || !["admin", "hr", "employee", "payroll", "accounting"].includes(roleCode)) {
      recordInvalid(context, "roles", record, "Role permissions record has an invalid role or permission list.");
      continue;
    }
    const role = await db.applicationRole.findUnique({ where: { code: roleCode as "admin" | "hr" | "employee" | "payroll" | "accounting" }, include: { rolePermissions: { include: { permission: true } } } });
    if (!role) {
      recordConflict(context, "roles", record, `Target role ${roleCode} does not exist; identity/RBAC must be bootstrapped first.`);
      continue;
    }
    const targetKeys = role.rolePermissions.map((item) => item.permission.key).sort();
    const sourceKeys = [...new Set(permissionKeys)].sort();
    if (targetKeys.join("\n") !== sourceKeys.join("\n")) {
      recordConflict(context, "roles", record, `Role ${roleCode} permissions differ from the PostgreSQL canonical registry; no RBAC overwrite was attempted.`);
      continue;
    }
    report.skipped += 1;
    statusDistribution(report, "unchanged");
    context.manifest.push(makeManifestEntry(record, "unchanged", role.id, { roleCode, permissionKeys: sourceKeys }));
  }
  report.targetAfter = await db.applicationRole.count();
}

async function migrateEmployees(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "employees");
  const rows = recordsFor(context.source, "employees");
  report.source = rows.length;
  report.targetBefore = await db.employee.count();
  for (const record of rows) {
    const mapped = mapEmployee(record);
    if ("failure" in mapped) {
      recordInvalid(context, "employees", record, mapped.failure.message);
      continue;
    }
    const existingByLegacy = await db.employee.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByBusiness = await db.employee.findUnique({ where: { employeeId: mapped.value.employeeId } });
    if (existingByLegacy && existingByLegacy.employeeId !== mapped.value.employeeId) {
      recordConflict(context, "employees", record, `Legacy ID already belongs to employee ${existingByLegacy.employeeId}, not ${mapped.value.employeeId}.`);
      continue;
    }
    if (existingByBusiness && existingByLegacy && existingByBusiness.id !== existingByLegacy.id) {
      recordConflict(context, "employees", record, `Employee ID ${mapped.value.employeeId} resolves to two PostgreSQL rows.`);
      continue;
    }
    const existing = existingByLegacy ?? existingByBusiness;
    const previewId = existing?.id ?? randomUUID();
    const data = employeeData(mapped.value);
    if (existing) {
      if (context.mode === "execute") await db.employee.update({ where: { id: existing.id }, data });
      maps.employees.set(mapped.value.employeeId, existing.id);
      maps.employees.set(sourceKey("employees", record.id), existing.id);
      report.updated += 1;
      statusDistribution(report, "updated");
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      if (context.mode === "execute") {
        const created = await db.employee.create({ data: { ...data, id: previewId } as Prisma.EmployeeUncheckedCreateInput });
        maps.employees.set(mapped.value.employeeId, created.id);
        maps.employees.set(sourceKey("employees", record.id), created.id);
      } else {
        maps.employees.set(mapped.value.employeeId, previewId);
        maps.employees.set(sourceKey("employees", record.id), previewId);
      }
      report.inserted += 1;
      statusDistribution(report, "inserted");
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? previewId : null, data));
    }
  }
  report.targetAfter = await db.employee.count();
  report.verifiedReadCount = await db.employee.count({ where: { legacyFirestoreId: { not: null } } });
}

function employeeData(value: MappedEmployee): Prisma.EmployeeUncheckedUpdateInput {
  return {
    employeeId: value.employeeId,
    displayName: value.displayName,
    department: value.department,
    position: value.position,
    employmentStatus: value.employmentStatus,
    sourceSystem: "HRPS",
    dataSource: value.dataSource,
    sourceUpdatedAt: value.sourceUpdatedAt,
    syncedAt: value.syncedAt,
    legacyFirestoreId: value.legacyFirestoreId,
  };
}

async function migrateSchedules(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "schedules");
  const rows = recordsFor(context.source, "employeeSchedules");
  report.source = rows.length;
  report.targetBefore = await db.employeeSchedule.count();
  for (const record of rows) {
    const mapped = mapSchedule(record);
    if ("failure" in mapped) {
      recordInvalid(context, "schedules", record, mapped.failure.message);
      continue;
    }
    const employeeTargetId = maps.employees.get(mapped.value.employeeId);
    if (!employeeTargetId) {
      recordConflict(context, "schedules", record, `Employee ${mapped.value.employeeId} is not present in the migration ID map.`);
      continue;
    }
    const existingByLegacy = await db.employeeSchedule.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByBusiness = await db.employeeSchedule.findUnique({ where: { employeeId_scheduleId: { employeeId: employeeTargetId, scheduleId: mapped.value.scheduleId } } });
    if (existingByLegacy && existingByLegacy.employeeId !== employeeTargetId) {
      recordConflict(context, "schedules", record, "Legacy schedule ID belongs to a different employee.");
      continue;
    }
    const existing = existingByLegacy ?? existingByBusiness;
    const data: Prisma.EmployeeScheduleUncheckedUpdateInput = {
      employeeId: employeeTargetId,
      scheduleId: mapped.value.scheduleId,
      workStart: mapped.value.workStart,
      workEnd: mapped.value.workEnd,
      breakStart: mapped.value.breakStart,
      breakEnd: mapped.value.breakEnd,
      shiftLabel: mapped.value.shiftLabel,
      workDays: mapped.value.workDays,
      restDays: mapped.value.restDays,
      workLocation: mapped.value.workLocation,
      sourceSystem: "HRPS",
      dataSource: mapped.value.dataSource,
      effectiveFrom: mapped.value.effectiveFrom,
      effectiveTo: mapped.value.effectiveTo,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.employeeSchedule.update({ where: { id: existing.id }, data });
      report.updated += 1;
      statusDistribution(report, "updated");
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.employeeSchedule.create({ data: { ...data, id } as Prisma.EmployeeScheduleUncheckedCreateInput });
      report.inserted += 1;
      statusDistribution(report, "inserted");
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
  report.targetAfter = await db.employeeSchedule.count();
  report.verifiedReadCount = await db.employeeSchedule.count({ where: { legacyFirestoreId: { not: null } } });
}

async function migrateIdentity(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "identity");
  const rows = recordsFor(context.source, "users");
  report.source = rows.length;
  report.targetBefore = await db.user.count();
  for (const record of rows) {
    const mapped = mapUser(record);
    if ("failure" in mapped) {
      recordInvalid(context, "identity", record, mapped.failure.message);
      continue;
    }
    const role = await db.applicationRole.findUnique({ where: { code: mapped.value.role }, select: { id: true } });
    if (!role) {
      recordConflict(context, "identity", record, `Target role ${mapped.value.role} is missing.`);
      continue;
    }
    const employeeTargetId = mapped.value.employeeId ? maps.employees.get(mapped.value.employeeId) : null;
    if (mapped.value.employeeId && !employeeTargetId) {
      recordConflict(context, "identity", record, `User references employee ${mapped.value.employeeId}, but that employee has no target mapping.`);
      continue;
    }
    const existingByUid = await db.user.findUnique({ where: { firebaseUid: mapped.value.firebaseUid }, include: { role: true, employee: true } });
    const existingByUsername = await db.user.findUnique({ where: { username: mapped.value.username }, select: { id: true } });
    if (existingByUsername && existingByUid && existingByUsername.id !== existingByUid.id) {
      recordConflict(context, "identity", record, `Username ${mapped.value.username} belongs to another PostgreSQL identity.`);
      continue;
    }
    const existing = existingByUid;
    if (existing) {
      const same = existing.username === mapped.value.username
        && existing.displayName === mapped.value.displayName
        && existing.status === mapped.value.status
        && existing.role.code === mapped.value.role
        && (existing.employee?.employeeId ?? null) === mapped.value.employeeId;
      if (!same) {
        recordConflict(context, "identity", record, `Firebase identity ${mapped.value.firebaseUid} differs from PostgreSQL identity; no password or credential migration was attempted.`);
        continue;
      }
      maps.users.set(mapped.value.firebaseUid, existing.id);
      maps.usersByUsername.set(mapped.value.username, existing.id);
      report.skipped += 1;
      statusDistribution(report, "unchanged");
      context.manifest.push(makeManifestEntry(record, "unchanged", existing.id, { ...mapped.value, employeeTargetId }));
      continue;
    }
    const id = randomUUID();
    if (context.mode === "execute") await db.user.create({ data: { id, firebaseUid: mapped.value.firebaseUid, username: mapped.value.username, displayName: mapped.value.displayName, roleId: role.id, employeeId: employeeTargetId, status: mapped.value.status } });
    maps.users.set(mapped.value.firebaseUid, id);
    maps.usersByUsername.set(mapped.value.username, id);
    if (mapped.value.employeeId) maps.users.set(`employee:${mapped.value.employeeId}`, id);
    report.inserted += 1;
    statusDistribution(report, "inserted");
    context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, { ...mapped.value, employeeTargetId }));
  }
  report.targetAfter = await db.user.count();
  report.verifiedReadCount = await db.user.count({ where: { firebaseUid: { not: "" } } });
}

async function migrateAttendance(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "attendance");
  const rows = recordsFor(context.source, "attendance");
  report.source = rows.length;
  report.targetBefore = await db.attendanceRecord.count();
  for (const record of rows) {
    const mapped = mapAttendance(record);
    if ("failure" in mapped) {
      recordInvalid(context, "attendance", record, mapped.failure.message);
      continue;
    }
    const employeeTargetId = maps.employees.get(mapped.value.employeeId);
    const timeInOperatorUserId = maps.users.get(mapped.value.timeInActor.uid);
    const timeOutOperatorUserId = mapped.value.timeOutActor ? maps.users.get(mapped.value.timeOutActor.uid) : null;
    const hrVerifiedByUserId = mapped.value.hrVerification ? maps.users.get(mapped.value.hrVerification.actor.uid) : null;
    if (!employeeTargetId) {
      recordConflict(context, "attendance", record, `Attendance references employee ${mapped.value.employeeId} without a target employee.`);
      continue;
    }
    if (!timeInOperatorUserId) {
      recordConflict(context, "attendance", record, `Time-in actor ${mapped.value.timeInActor.uid} has no target identity.`);
      continue;
    }
    if (mapped.value.timeOutActor && !timeOutOperatorUserId) {
      recordConflict(context, "attendance", record, `Time-out actor ${mapped.value.timeOutActor.uid} has no target identity.`);
      continue;
    }
    if (mapped.value.hrVerification && !hrVerifiedByUserId) {
      recordConflict(context, "attendance", record, `HR verifier ${mapped.value.hrVerification.actor.uid} has no target identity.`);
      continue;
    }
    const existingByLegacy = await db.attendanceRecord.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByBusiness = await db.attendanceRecord.findUnique({ where: { employeeId_attendanceDate: { employeeId: employeeTargetId, attendanceDate: mapped.value.attendanceDate } } });
    if (existingByLegacy && existingByLegacy.employeeId !== employeeTargetId) {
      recordConflict(context, "attendance", record, "Legacy attendance ID belongs to a different employee.");
      continue;
    }
    const existing = existingByLegacy ?? existingByBusiness;
    const data: Prisma.AttendanceRecordUncheckedUpdateInput = {
      employeeId: employeeTargetId,
      attendanceDate: mapped.value.attendanceDate,
      timeIn: mapped.value.timeIn,
      timeOut: mapped.value.timeOut,
      timeInSource: mapped.value.timeInSource,
      timeOutSource: mapped.value.timeOutSource,
      timeInSourceReference: mapped.value.timeInSourceReference,
      timeOutSourceReference: mapped.value.timeOutSourceReference,
      status: mapped.value.status,
      timeInOperatorUserId,
      timeOutOperatorUserId,
      timeInActorSnapshot: mapped.value.timeInActor,
      timeOutActorSnapshot: jsonOrNull(mapped.value.timeOutActor),
      hrVerificationStatus: mapped.value.hrVerification ? "verified" : "pending",
      hrVerifiedAt: mapped.value.hrVerification?.verifiedAt ?? null,
      hrVerifiedByUserId,
      hrVerifiedBySnapshot: jsonOrNull(mapped.value.hrVerification?.actor ?? null),
      payrollReadinessStatus: mapped.value.payrollReadinessStatus,
      payrollReadinessReasons: jsonOrNull(mapped.value.payrollReadinessReasons),
      correctionMetadata: jsonOrNull(mapped.value.correctionMetadata),
      sourceMetadata: mapped.value.sourceMetadata,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
      createdAt: mapped.value.createdAt,
      updatedAt: mapped.value.updatedAt,
    };
    if (existing) {
      if (context.mode === "execute") await db.attendanceRecord.update({ where: { id: existing.id }, data });
      report.updated += 1;
      statusDistribution(report, "updated");
      maps.attendance.set(`${mapped.value.employeeId}_${mapped.value.attendanceDate.toISOString().slice(0, 10)}`, existing.id);
      maps.attendance.set(sourceKey("attendance", record.id), existing.id);
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.attendanceRecord.create({ data: { ...data, id } as Prisma.AttendanceRecordUncheckedCreateInput });
      maps.attendance.set(`${mapped.value.employeeId}_${mapped.value.attendanceDate.toISOString().slice(0, 10)}`, id);
      maps.attendance.set(sourceKey("attendance", record.id), id);
      report.inserted += 1;
      statusDistribution(report, "inserted");
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
  report.targetAfter = await db.attendanceRecord.count();
  report.verifiedReadCount = await db.attendanceRecord.count({ where: { legacyFirestoreId: { not: null } } });
}

async function migrateCorrections(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "corrections");
  const rows = recordsFor(context.source, "attendanceCorrectionRequests");
  report.source = rows.length;
  report.targetBefore = await db.attendanceCorrection.count();
  for (const record of rows) {
    const mapped = mapCorrection(record);
    if ("failure" in mapped) {
      recordInvalid(context, "corrections", record, mapped.failure.message);
      continue;
    }
    const employeeTargetId = maps.employees.get(mapped.value.employeeId);
    const dateKey = mapped.value.attendanceDate.toISOString().slice(0, 10);
    const attendanceTargetId = maps.attendance.get(sourceKey("attendance", mapped.value.attendanceSourceId))
      ?? maps.attendance.get(`${mapped.value.employeeId}_${dateKey}`);
    const submittedByUserId = maps.users.get(mapped.value.submittedBy.uid);
    const reviewedByUserId = mapped.value.reviewedBy ? maps.users.get(mapped.value.reviewedBy.uid) : null;
    if (!employeeTargetId || !attendanceTargetId) {
      recordConflict(context, "corrections", record, `Correction ${record.id} has no employee or attendance target mapping.`);
      continue;
    }
    if (!submittedByUserId) {
      recordConflict(context, "corrections", record, `Correction submitter ${mapped.value.submittedBy.uid} has no target identity.`);
      continue;
    }
    if (mapped.value.reviewedBy && !reviewedByUserId) {
      recordConflict(context, "corrections", record, `Correction reviewer ${mapped.value.reviewedBy.uid} has no target identity.`);
      continue;
    }
    const existing = await db.attendanceCorrection.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const data: Prisma.AttendanceCorrectionUncheckedUpdateInput = {
      employeeId: employeeTargetId,
      attendanceRecordId: attendanceTargetId,
      attendanceDate: mapped.value.attendanceDate,
      issueType: prismaIssueType(mapped.value.issueType),
      status: mapped.value.status,
      reason: mapped.value.reason,
      originalSnapshot: jsonOrNull(mapped.value.originalSnapshot),
      requestedChanges: mapped.value.requestedChanges,
      resultingSnapshot: jsonOrNull(mapped.value.resultingSnapshot),
      changedFields: mapped.value.changedFields,
      evidence: mapped.value.evidence,
      submittedByUserId,
      submittedBySnapshot: mapped.value.submittedBy,
      reviewedByUserId,
      reviewedBySnapshot: jsonOrNull(mapped.value.reviewedBy),
      submittedAt: mapped.value.submittedAt,
      reviewedAt: mapped.value.reviewedAt,
      reviewNote: mapped.value.reviewNote,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.attendanceCorrection.update({ where: { id: existing.id }, data });
      report.updated += 1;
      statusDistribution(report, "updated");
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.attendanceCorrection.create({ data: { ...data, id } as Prisma.AttendanceCorrectionUncheckedCreateInput });
      report.inserted += 1;
      statusDistribution(report, "inserted");
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
  report.targetAfter = await db.attendanceCorrection.count();
  report.verifiedReadCount = await db.attendanceCorrection.count({ where: { legacyFirestoreId: { not: null } } });
}

async function migratePayroll(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "payroll");
  const batches = recordsFor(context.source, "payrollBatches");
  const memberships = recordsFor(context.source, "payrollBatchMembership");
  const handoffs = recordsFor(context.source, "payrollHandoffs");
  const results = recordsFor(context.source, "payrollResults");
  const resultItems = recordsFor(context.source, "payrollResultItems");
  report.source = batches.length + memberships.length + handoffs.length + results.length + resultItems.length;
  report.targetBefore = await payrollTargetCount(db);

  const batchItemRecords = buildBatchItemRecords(batches, memberships);
  await migratePayrollBatches(db, context, maps, batches);
  await migratePayrollBatchItems(db, context, maps, batchItemRecords);
  await migratePayrollHandoffs(db, context, maps, handoffs);
  await migratePayrollResults(db, context, maps, results);
  await migratePayrollResultItems(db, context, maps, resultItems);

  report.targetAfter = await payrollTargetCount(db);
  report.verifiedReadCount = await db.payrollBatch.count({ where: { legacyFirestoreId: { not: null } } })
    + await db.payrollBatchItem.count({ where: { legacyFirestoreId: { not: null } } })
    + await db.payrollHandoff.count({ where: { legacyFirestoreId: { not: null } } })
    + await db.payrollResult.count({ where: { legacyFirestoreId: { not: null } } })
    + await db.payrollResultItem.count({ where: { legacyFirestoreId: { not: null } } });
}

async function payrollTargetCount(db: Database): Promise<number> {
  const counts = await Promise.all([
    db.payrollBatch.count(),
    db.payrollBatchItem.count(),
    db.payrollHandoff.count(),
    db.payrollResult.count(),
    db.payrollResultItem.count(),
  ]);
  return counts.reduce((sum, count) => sum + count, 0);
}

function buildBatchItemRecords(
  batches: readonly SourceRecord[],
  memberships: readonly SourceRecord[],
): SourceRecord[] {
  const membershipByKey = new Map<string, SourceRecord>();
  for (const membership of memberships) {
    const data = membership.data as Record<string, unknown>;
    const batchId = typeof data.batchId === "string" ? data.batchId : null;
    const employeePeriodId = typeof data.employeePeriodId === "string" ? data.employeePeriodId : null;
    if (batchId && employeePeriodId) membershipByKey.set(`${batchId}:${employeePeriodId}`, membership);
  }
  const result: SourceRecord[] = [];
  for (const batch of batches) {
    const data = batch.data as Record<string, unknown>;
    if (!Array.isArray(data.includedRecords)) continue;
    for (const included of data.includedRecords) {
      if (typeof included !== "object" || included === null || Array.isArray(included)) continue;
      const includedRecord = included as Record<string, unknown>;
      const employeePeriodId = typeof includedRecord.employeePeriodId === "string" ? includedRecord.employeePeriodId : null;
      if (!employeePeriodId) continue;
      const membership = membershipByKey.get(`${batch.id}:${employeePeriodId}`);
      result.push({
        collection: "payrollBatchItems",
        id: membership?.id ?? `${batch.id}:${employeePeriodId}`,
        path: membership?.path ?? `${batch.path}/includedRecords/${employeePeriodId}`,
        data: { ...includedRecord, ...(membership?.data ?? {}) },
      });
    }
  }
  return result;
}

async function migratePayrollBatches(db: Database, context: MigrationContext, maps: TargetMaps, rows: readonly SourceRecord[]): Promise<void> {
  const report = domainReport(context, "payroll");
  for (const record of rows) {
    const mapped = mapBatch(record);
    if ("failure" in mapped) {
      recordInvalid(context, "payroll", record, mapped.failure.message);
      continue;
    }
    const existingByLegacy = await db.payrollBatch.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByReference = await db.payrollBatch.findUnique({ where: { batchReference: mapped.value.batchReference } });
    if (existingByLegacy && existingByReference && existingByLegacy.id !== existingByReference.id) {
      recordConflict(context, "payroll", record, `Payroll batch reference ${mapped.value.batchReference} resolves to two PostgreSQL rows.`);
      continue;
    }
    const existing = existingByLegacy ?? existingByReference;
    const createdByUserId = maps.users.get(mapped.value.createdBy.uid) ?? null;
    const submittedByUserId = mapped.value.submittedBy ? maps.users.get(mapped.value.submittedBy.uid) ?? null : null;
    const data: Prisma.PayrollBatchUncheckedUpdateInput = {
      batchReference: mapped.value.batchReference,
      periodStart: mapped.value.periodStart,
      periodEnd: mapped.value.periodEnd,
      periodLabel: mapped.value.periodLabel,
      status: mapped.value.status,
      createdByUserId,
      createdBySnapshot: mapped.value.createdBy,
      createdAt: mapped.value.createdAt,
      updatedAt: mapped.value.updatedAt,
      submittedByUserId,
      submittedBySnapshot: jsonOrNull(mapped.value.submittedBy),
      submittedAt: mapped.value.submittedAt,
      recordCount: mapped.value.recordCount,
      blockedCount: mapped.value.blockedCount,
      notes: mapped.value.notes,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.payrollBatch.update({ where: { id: existing.id }, data });
      maps.batches.set(mapped.value.batchReference, existing.id);
      maps.batches.set(sourceKey("payrollBatches", record.id), existing.id);
      report.updated += 1;
      statusDistribution(report, mapped.value.status);
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.payrollBatch.create({ data: { ...data, id } as Prisma.PayrollBatchUncheckedCreateInput });
      maps.batches.set(mapped.value.batchReference, id);
      maps.batches.set(sourceKey("payrollBatches", record.id), id);
      report.inserted += 1;
      statusDistribution(report, mapped.value.status);
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
}

async function migratePayrollBatchItems(db: Database, context: MigrationContext, maps: TargetMaps, rows: readonly SourceRecord[]): Promise<void> {
  const report = domainReport(context, "payroll");
  for (const record of rows) {
    const data = record.data as Record<string, unknown>;
    const batchSourceId = typeof data.batchId === "string" ? data.batchId : record.path.split("/")[1];
    const mapped = mapBatchItem(record, batchSourceId ?? "");
    if ("failure" in mapped) {
      recordInvalid(context, "payroll", record, mapped.failure.message);
      continue;
    }
    const batchTargetId = maps.batches.get(sourceKey("payrollBatches", mapped.value.batchSourceId))
      ?? maps.batches.get(mapped.value.batchSourceId);
    const employeeTargetId = maps.employees.get(mapped.value.employeeId);
    if (!batchTargetId || !employeeTargetId) {
      recordConflict(context, "payroll", record, `Payroll batch item ${record.id} has no batch or employee target mapping.`);
      continue;
    }
    const existingByLegacy = await db.payrollBatchItem.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByBusiness = await db.payrollBatchItem.findUnique({ where: { batchId_employeePeriodId: { batchId: batchTargetId, employeePeriodId: mapped.value.employeePeriodId } } });
    const existing = existingByLegacy ?? existingByBusiness;
    const dataToWrite: Prisma.PayrollBatchItemUncheckedUpdateInput = {
      batchId: batchTargetId,
      employeeId: employeeTargetId,
      employeePeriodId: mapped.value.employeePeriodId,
      periodStart: mapped.value.periodStart,
      periodEnd: mapped.value.periodEnd,
      employeeIdSnapshot: mapped.value.employeeIdSnapshot,
      employeeNameSnapshot: mapped.value.employeeNameSnapshot,
      departmentSnapshot: mapped.value.departmentSnapshot,
      presentDays: mapped.value.presentDays,
      lateCount: mapped.value.lateCount,
      lateMinutes: mapped.value.lateMinutes,
      undertimeMinutes: mapped.value.undertimeMinutes,
      hrVerificationStatus: mapped.value.hrVerificationStatus,
      payrollReadinessStatus: mapped.value.payrollReadinessStatus,
      sourceAttendanceIds: mapped.value.sourceAttendanceIds,
      snapshotCreatedAt: mapped.value.snapshotCreatedAt,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.payrollBatchItem.update({ where: { id: existing.id }, data: dataToWrite });
      report.updated += 1;
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, dataToWrite));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.payrollBatchItem.create({ data: { ...dataToWrite, id } as Prisma.PayrollBatchItemUncheckedCreateInput });
      report.inserted += 1;
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, dataToWrite));
    }
  }
}

async function migratePayrollHandoffs(db: Database, context: MigrationContext, maps: TargetMaps, rows: readonly SourceRecord[]): Promise<void> {
  const report = domainReport(context, "payroll");
  for (const record of rows) {
    const mapped = mapHandoff(record);
    if ("failure" in mapped) {
      recordInvalid(context, "payroll", record, mapped.failure.message);
      continue;
    }
    const batchId = maps.batches.get(sourceKey("payrollBatches", mapped.value.batchSourceId)) ?? maps.batches.get(mapped.value.batchSourceId);
    if (!batchId) {
      recordConflict(context, "payroll", record, `Payroll handoff references batch ${mapped.value.batchSourceId} without a target mapping.`);
      continue;
    }
    const existingByLegacy = await db.payrollHandoff.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByBatch = await db.payrollHandoff.findUnique({ where: { batchId } });
    const existingByReference = await db.payrollHandoff.findUnique({ where: { transferReference: mapped.value.transferReference } });
    if ((existingByLegacy && existingByBatch && existingByLegacy.id !== existingByBatch.id) || (existingByReference && existingByBatch && existingByReference.id !== existingByBatch.id)) {
      recordConflict(context, "payroll", record, `Payroll handoff ${mapped.value.transferReference} has a unique-key conflict.`);
      continue;
    }
    const existing = existingByLegacy ?? existingByBatch ?? existingByReference;
    const submittedByUserId = maps.users.get(mapped.value.submittedBy.uid) ?? null;
    const data: Prisma.PayrollHandoffUncheckedUpdateInput = {
      batchId,
      transferReference: mapped.value.transferReference,
      periodStart: mapped.value.periodStart,
      periodEnd: mapped.value.periodEnd,
      periodLabel: mapped.value.periodLabel,
      submittedByUserId,
      submittedBySnapshot: mapped.value.submittedBy,
      readyAt: mapped.value.readyAt,
      submittedAt: mapped.value.submittedAt,
      acknowledgedAt: mapped.value.acknowledgedAt,
      failedAt: mapped.value.failedAt,
      transferStatus: mapped.value.transferStatus,
      acknowledgementStatus: mapped.value.acknowledgementStatus,
      externalReference: mapped.value.externalReference,
      provider: mapped.value.provider,
      failureCode: mapped.value.failureCode,
      failureSummary: mapped.value.failureSummary,
      attemptCount: mapped.value.attemptCount,
      batchSummarySnapshot: mapped.value.batchSummarySnapshot,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.payrollHandoff.update({ where: { id: existing.id }, data });
      maps.handoffs.set(mapped.value.transferReference, existing.id);
      maps.handoffs.set(sourceKey("payrollHandoffs", record.id), existing.id);
      report.updated += 1;
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.payrollHandoff.create({ data: { ...data, id } as Prisma.PayrollHandoffUncheckedCreateInput });
      maps.handoffs.set(mapped.value.transferReference, id);
      maps.handoffs.set(sourceKey("payrollHandoffs", record.id), id);
      report.inserted += 1;
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
}

async function migratePayrollResults(db: Database, context: MigrationContext, maps: TargetMaps, rows: readonly SourceRecord[]): Promise<void> {
  const report = domainReport(context, "payroll");
  for (const record of rows) {
    const mapped = mapResult(record);
    if ("failure" in mapped) {
      recordInvalid(context, "payroll", record, mapped.failure.message);
      continue;
    }
    const batchId = maps.batches.get(sourceKey("payrollBatches", mapped.value.batchSourceId)) ?? maps.batches.get(mapped.value.batchSourceId);
    const handoffId = maps.handoffs.get(sourceKey("payrollHandoffs", mapped.value.handoffSourceId)) ?? maps.handoffs.get(mapped.value.handoffSourceId);
    if (!batchId || !handoffId) {
      recordConflict(context, "payroll", record, `Payroll result ${record.id} has no batch or handoff target mapping.`);
      continue;
    }
    const existingByLegacy = await db.payrollResult.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByReference = await db.payrollResult.findUnique({ where: { resultReference: mapped.value.resultReference } });
    const existingByHandoff = await db.payrollResult.findUnique({ where: { handoffId } });
    if ((existingByLegacy && existingByReference && existingByLegacy.id !== existingByReference.id) || (existingByHandoff && existingByReference && existingByHandoff.id !== existingByReference.id)) {
      recordConflict(context, "payroll", record, `Payroll result ${mapped.value.resultReference} has a unique-key conflict.`);
      continue;
    }
    const existing = existingByLegacy ?? existingByReference ?? existingByHandoff;
    const data: Prisma.PayrollResultUncheckedUpdateInput = {
      batchId,
      handoffId,
      resultReference: mapped.value.resultReference,
      externalPayrollReference: mapped.value.externalPayrollReference,
      status: mapped.value.status,
      provider: mapped.value.provider,
      employeeCount: mapped.value.employeeCount,
      processedCount: mapped.value.processedCount,
      pendingCount: mapped.value.pendingCount,
      rejectedCount: mapped.value.rejectedCount,
      failedCount: mapped.value.failedCount,
      payslipAvailableCount: mapped.value.payslipAvailableCount,
      accountingReadinessStatus: mapped.value.accountingReadinessStatus,
      accountingReadinessReasons: jsonOrNull(mapped.value.accountingReadinessReasons),
      receivedAt: mapped.value.receivedAt,
      processedAt: mapped.value.processedAt,
      completedAt: mapped.value.completedAt,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.payrollResult.update({ where: { id: existing.id }, data });
      maps.results.set(mapped.value.resultReference, existing.id);
      maps.results.set(sourceKey("payrollResults", record.id), existing.id);
      report.updated += 1;
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.payrollResult.create({ data: { ...data, id } as Prisma.PayrollResultUncheckedCreateInput });
      maps.results.set(mapped.value.resultReference, id);
      maps.results.set(sourceKey("payrollResults", record.id), id);
      report.inserted += 1;
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
}

async function migratePayrollResultItems(db: Database, context: MigrationContext, maps: TargetMaps, rows: readonly SourceRecord[]): Promise<void> {
  const report = domainReport(context, "payroll");
  for (const record of rows) {
    const sourceResultId = resultSourceIdFromRecord(record);
    const mapped = mapResultItem(record, sourceResultId);
    if ("failure" in mapped) {
      recordInvalid(context, "payroll", record, mapped.failure.message);
      continue;
    }
    const resultId = maps.results.get(sourceKey("payrollResults", mapped.value.resultSourceId)) ?? maps.results.get(mapped.value.resultSourceId);
    const employeeId = mapped.value.employeeId ? maps.employees.get(mapped.value.employeeId) ?? null : null;
    if (!resultId) {
      recordConflict(context, "payroll", record, `Payroll result item ${record.id} has no result target mapping.`);
      continue;
    }
    const existingByLegacy = await db.payrollResultItem.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByBusiness = await db.payrollResultItem.findUnique({ where: { resultId_employeeIdSnapshot: { resultId, employeeIdSnapshot: mapped.value.employeeIdSnapshot } } });
    const existing = existingByLegacy ?? existingByBusiness;
    const data: Prisma.PayrollResultItemUncheckedUpdateInput = {
      resultId,
      employeeId,
      employeeIdSnapshot: mapped.value.employeeIdSnapshot,
      employeeNameSnapshot: mapped.value.employeeNameSnapshot,
      departmentSnapshot: mapped.value.departmentSnapshot,
      periodStart: mapped.value.periodStart,
      periodEnd: mapped.value.periodEnd,
      externalEmployeeReference: mapped.value.externalEmployeeReference,
      externalPayrollReference: mapped.value.externalPayrollReference,
      processingStatus: mapped.value.processingStatus,
      payslipStatus: mapped.value.payslipStatus,
      externalPayslipId: mapped.value.externalPayslipId,
      issueCode: mapped.value.issueCode,
      issueSummary: mapped.value.issueSummary,
      processedAt: mapped.value.processedAt,
      releasedAt: mapped.value.releasedAt,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.payrollResultItem.update({ where: { id: existing.id }, data });
      maps.resultItems.set(sourceKey("payrollResultItems", record.id), existing.id);
      maps.resultItems.set(`${mapped.value.resultSourceId}:${mapped.value.externalEmployeeReference}`, existing.id);
      report.updated += 1;
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.payrollResultItem.create({ data: { ...data, id } as Prisma.PayrollResultItemUncheckedCreateInput });
      maps.resultItems.set(sourceKey("payrollResultItems", record.id), id);
      maps.resultItems.set(`${mapped.value.resultSourceId}:${mapped.value.externalEmployeeReference}`, id);
      report.inserted += 1;
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
}

function resultSourceIdFromRecord(record: SourceRecord): string {
  const parts = record.path.split("/");
  const resultIndex = parts.indexOf("payrollResults");
  return resultIndex >= 0 && parts[resultIndex + 1] ? parts[resultIndex + 1] : "";
}

async function migratePayslips(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "payslips");
  const rows = recordsFor(context.source, "payrollPayslips");
  report.source = rows.length;
  report.targetBefore = await db.payrollPayslip.count();
  for (const record of rows) {
    const mapped = mapPayslip(record);
    if ("failure" in mapped) {
      recordInvalid(context, "payslips", record, mapped.failure.message);
      continue;
    }
    const employeeId = maps.employees.get(mapped.value.employeeId);
    if (!employeeId) {
      recordConflict(context, "payslips", record, `Payslip references employee ${mapped.value.employeeId} without a target mapping.`);
      continue;
    }
    const resultItemId = mapped.value.resultItemSourceId
      ? maps.resultItems.get(sourceKey("payrollResultItems", mapped.value.resultItemSourceId)) ?? maps.resultItems.get(mapped.value.resultItemSourceId)
      : null;
    const existingByLegacy = await db.payrollPayslip.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByReference = await db.payrollPayslip.findUnique({ where: { payrollReference: mapped.value.payrollReference } });
    const existingByPeriod = await db.payrollPayslip.findUnique({ where: { employeeId_periodStart_periodEnd: { employeeId, periodStart: mapped.value.periodStart, periodEnd: mapped.value.periodEnd } } });
    if ((existingByLegacy && existingByReference && existingByLegacy.id !== existingByReference.id) || (existingByPeriod && existingByReference && existingByPeriod.id !== existingByReference.id)) {
      recordConflict(context, "payslips", record, `Payslip ${mapped.value.payrollReference} has a unique-key conflict.`);
      continue;
    }
    const existing = existingByLegacy ?? existingByReference ?? existingByPeriod;
    const data: Prisma.PayrollPayslipUncheckedUpdateInput = {
      employeeId,
      resultItemId,
      periodStart: mapped.value.periodStart,
      periodEnd: mapped.value.periodEnd,
      payFrequency: mapped.value.payFrequency,
      monthlyBasicSalary: mapped.value.monthlyBasicSalary,
      cutoffBasicPay: mapped.value.cutoffBasicPay,
      referenceDailyRate: mapped.value.referenceDailyRate,
      basicPay: mapped.value.basicPay,
      grossPay: mapped.value.grossPay,
      deductions: mapped.value.deductions,
      totalDeductions: mapped.value.totalDeductions,
      netPay: mapped.value.netPay,
      status: mapped.value.status,
      releasedAt: mapped.value.releasedAt,
      source: mapped.value.source,
      payrollReference: mapped.value.payrollReference,
      monthlySummary: mapped.value.monthlySummary,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.payrollPayslip.update({ where: { id: existing.id }, data });
      report.updated += 1;
      statusDistribution(report, mapped.value.status);
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.payrollPayslip.create({ data: { ...data, id } as Prisma.PayrollPayslipUncheckedCreateInput });
      report.inserted += 1;
      statusDistribution(report, mapped.value.status);
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
  report.targetAfter = await db.payrollPayslip.count();
  report.verifiedReadCount = await db.payrollPayslip.count({ where: { legacyFirestoreId: { not: null } } });
}

async function migrateAccounting(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "accounting");
  const rows = recordsFor(context.source, "accountingTransfers");
  const memberships = recordsFor(context.source, "accountingTransferMembership");
  report.source = rows.length + memberships.length;
  report.targetBefore = await db.accountingTransfer.count();
  for (const record of rows) {
    const mapped = mapAccountingTransfer(record);
    if ("failure" in mapped) {
      recordInvalid(context, "accounting", record, mapped.failure.message);
      continue;
    }
    const resultId = maps.results.get(sourceKey("payrollResults", mapped.value.resultSourceId)) ?? maps.results.get(mapped.value.resultSourceId);
    const batchId = maps.batches.get(sourceKey("payrollBatches", mapped.value.batchSourceId)) ?? maps.batches.get(mapped.value.batchSourceId);
    const handoffId = maps.handoffs.get(sourceKey("payrollHandoffs", mapped.value.handoffSourceId)) ?? maps.handoffs.get(mapped.value.handoffSourceId);
    if (!resultId || !batchId || !handoffId) {
      recordConflict(context, "accounting", record, `Accounting transfer ${record.id} has missing result, batch, or handoff target lineage.`);
      continue;
    }
    const existingByLegacy = await db.accountingTransfer.findUnique({ where: { legacyFirestoreId: mapped.value.legacyFirestoreId } });
    const existingByReference = await db.accountingTransfer.findUnique({ where: { transferReference: mapped.value.transferReference } });
    const existingByResult = await db.accountingTransfer.findUnique({ where: { payrollResultId: resultId } });
    if ((existingByLegacy && existingByReference && existingByLegacy.id !== existingByReference.id) || (existingByResult && existingByReference && existingByResult.id !== existingByReference.id)) {
      recordConflict(context, "accounting", record, `Accounting transfer ${mapped.value.transferReference} has a unique-key conflict.`);
      continue;
    }
    const existing = existingByLegacy ?? existingByReference ?? existingByResult;
    const submittedByUserId = maps.users.get(mapped.value.submittedBy.uid) ?? null;
    const data: Prisma.AccountingTransferUncheckedUpdateInput = {
      payrollResultId: resultId,
      payrollBatchId: batchId,
      payrollHandoffId: handoffId,
      transferReference: mapped.value.transferReference,
      periodStart: mapped.value.periodStart,
      periodEnd: mapped.value.periodEnd,
      periodLabel: mapped.value.periodLabel,
      externalPayrollReference: mapped.value.externalPayrollReference,
      employeeCount: mapped.value.employeeCount,
      payrollResultStatus: mapped.value.payrollResultStatus,
      submittedByUserId,
      submittedBySnapshot: mapped.value.submittedBy,
      submittedAt: mapped.value.submittedAt,
      acknowledgedAt: mapped.value.acknowledgedAt,
      failedAt: mapped.value.failedAt,
      transferStatus: mapped.value.transferStatus,
      acknowledgementStatus: mapped.value.acknowledgementStatus,
      externalAccountingReference: mapped.value.externalAccountingReference,
      provider: mapped.value.provider,
      failureCode: mapped.value.failureCode,
      failureSummary: mapped.value.failureSummary,
      attemptCount: mapped.value.attemptCount,
      legacyFirestoreId: mapped.value.legacyFirestoreId,
    };
    if (existing) {
      if (context.mode === "execute") await db.accountingTransfer.update({ where: { id: existing.id }, data });
      report.updated += 1;
      statusDistribution(report, mapped.value.transferStatus);
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.accountingTransfer.create({ data: { ...data, id } as Prisma.AccountingTransferUncheckedCreateInput });
      report.inserted += 1;
      statusDistribution(report, mapped.value.transferStatus);
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
  report.targetAfter = await db.accountingTransfer.count();
  report.verifiedReadCount = await db.accountingTransfer.count({ where: { legacyFirestoreId: { not: null } } });
}

async function migrateAudit(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "audit");
  const rows = [
    ...recordsFor(context.source, "auditEvents"),
    ...recordsFor(context.source, "adminAuditEvents"),
    ...recordsFor(context.source, "adminUserAccountAuditEvents"),
    ...recordsFor(context.source, "payrollResultAuditEvents"),
    ...recordsFor(context.source, "accountingTransferAuditEvents"),
  ];
  report.source = rows.length;
  report.targetBefore = await db.auditEvent.count();
  for (const record of rows) {
    const mapped = mapAudit(record);
    if ("failure" in mapped) {
      recordInvalid(context, "audit", record, mapped.failure.message);
      continue;
    }
    const actorUserId = mapped.value.actorUid ? maps.users.get(mapped.value.actorUid) ?? null : null;
    const existing = await db.auditEvent.findUnique({ where: { sourceCollection_legacyDocumentId: { sourceCollection: mapped.value.sourceCollection, legacyDocumentId: mapped.value.legacyFirestoreId } } });
    const data: Prisma.AuditEventUncheckedUpdateInput = {
      eventType: mapped.value.eventType,
      action: mapped.value.action,
      module: mapped.value.module,
      actorType: mapped.value.actorType,
      actorUserId,
      actorUid: mapped.value.actorUid,
      actorSnapshot: mapped.value.actor ?? { uid: mapped.value.actorUid ?? "unknown", username: "unknown", displayName: "Historical actor", role: mapped.value.actorType },
      targetType: mapped.value.targetType,
      targetId: mapped.value.targetId,
      targetReference: mapped.value.targetReference,
      targetLabel: mapped.value.targetLabel,
      targetSnapshot: jsonOrNull(mapped.value.targetSnapshot),
      outcome: mapped.value.outcome,
      summary: mapped.value.summary,
      metadata: mapped.value.metadata,
      sourceCollection: mapped.value.sourceCollection,
      legacyDocumentId: mapped.value.legacyFirestoreId,
      occurredAt: mapped.value.occurredAt,
      createdAt: mapped.value.occurredAt,
    };
    if (existing) {
      if (context.mode === "execute") await db.auditEvent.update({ where: { id: existing.id }, data });
      report.updated += 1;
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.auditEvent.create({ data: { ...data, id } as Prisma.AuditEventUncheckedCreateInput });
      report.inserted += 1;
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
  report.targetAfter = await db.auditEvent.count();
  report.verifiedReadCount = await db.auditEvent.count({ where: { sourceCollection: { not: null }, legacyDocumentId: { not: null } } });
}

async function migrateSettings(db: Database, context: MigrationContext, maps: TargetMaps): Promise<void> {
  const report = domainReport(context, "settings");
  const rows = recordsFor(context.source, "systemSettings");
  report.source = rows.length;
  report.targetBefore = await db.systemSetting.count();
  for (const record of rows) {
    const mapped = mapSetting(record);
    if ("failure" in mapped) {
      recordInvalid(context, "settings", record, mapped.failure.message);
      continue;
    }
    const updatedByUserId = mapped.value.updatedBy ? maps.users.get(mapped.value.updatedBy.uid) ?? null : null;
    const existing = await db.systemSetting.findUnique({ where: { settingKey: mapped.value.settingKey } });
    const data: Prisma.SystemSettingUncheckedUpdateInput = {
      settingKey: mapped.value.settingKey,
      overrides: mapped.value.overrides,
      version: mapped.value.version,
      updatedByUserId,
      updatedBySnapshot: jsonOrNull(mapped.value.updatedBy),
      ...(mapped.value.updatedAt ? { updatedAt: mapped.value.updatedAt } : {}),
    };
    if (existing) {
      if (context.mode === "execute") await db.systemSetting.update({ where: { id: existing.id }, data });
      report.updated += 1;
      context.manifest.push(makeManifestEntry(record, "updated", existing.id, data));
    } else {
      const id = randomUUID();
      if (context.mode === "execute") await db.systemSetting.create({ data: { ...data, id } as Prisma.SystemSettingUncheckedCreateInput });
      report.inserted += 1;
      context.manifest.push(makeManifestEntry(record, "inserted", context.mode === "execute" ? id : null, data));
    }
  }
  report.targetAfter = await db.systemSetting.count();
  report.verifiedReadCount = await db.systemSetting.count();
}

function domainReport(context: MigrationContext, domain: string) {
  if (!context.report.domains[domain]) context.report.domains[domain] = emptyDomainReport();
  return context.report.domains[domain];
}

function jsonOrNull(value: unknown): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
  return value === null || value === undefined ? Prisma.JsonNull : jsonObject(value);
}

function prismaIssueType(value: MappedCorrection["issueType"]): "MissingTimeIn" | "MissingTimeOut" | "IncorrectTimeIn" | "IncorrectTimeOut" | "TimeInAndTimeOutCorrection" {
  const values = {
    "Missing Time-In": "MissingTimeIn",
    "Missing Time-Out": "MissingTimeOut",
    "Incorrect Time-In": "IncorrectTimeIn",
    "Incorrect Time-Out": "IncorrectTimeOut",
    "Time In and Time Out Correction": "TimeInAndTimeOutCorrection",
  } as const;
  return values[value];
}

function recordInvalid(context: MigrationContext, domain: string, record: SourceRecord, message: string): void {
  const report = domainReport(context, domain);
  report.invalid += 1;
  statusDistribution(report, "invalid");
  addFinding(context.report.findings, finding("P1", domain, record, message, message));
  context.manifest.push(makeManifestEntry(record, "invalid", null, null, message));
}

function recordConflict(context: MigrationContext, domain: string, record: SourceRecord, message: string): void {
  const report = domainReport(context, domain);
  report.failed += 1;
  statusDistribution(report, "conflict");
  addFinding(context.report.findings, finding("P0", domain, record, message));
  context.manifest.push(makeManifestEntry(record, "conflict", null, null, message));
}

function finding(
  severity: MigrationFinding["severity"],
  domain: string,
  record: SourceRecord,
  message: string,
  quarantineReason?: string,
): MigrationFinding {
  return {
    severity,
    domain,
    collection: record.collection,
    sourceId: record.id,
    message,
    ...(quarantineReason ? { quarantineReason } : {}),
  };
}

export function hasBlockingFindings(context: MigrationContext): boolean {
  return context.report.findings.some((item) => item.severity === "P0" || item.severity === "P1");
}

export function applyTargetCountAndOrphanChecks(context: MigrationContext): void {
  for (const report of Object.values(context.report.domains)) {
    report.orphanCount = 0;
    report.duplicateCount = 0;
  }
}

export function safeError(error: unknown): string {
  return compactError(error);
}
