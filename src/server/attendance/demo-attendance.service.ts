import "server-only";

import { Prisma } from "@prisma/client";

import { formatCampusDateKey } from "@/lib/campus-time";
import { getRepositoryPrisma } from "@/server/repositories/prisma/prisma-repository-helpers";
import { recordAuditEvent } from "@/server/repositories/audit/audit.repository";
import { getTodayAttendanceForEmployee } from "@/server/attendance/attendance.service";
import { processUnifiedAttendanceForEmployeeDate } from "@/server/attendance/unified-attendance-processor";
import { isDemoAttendanceEnabled } from "@/server/attendance/demo-attendance-config";
import type { SessionUser } from "@/types/auth";
import type { AttendanceDemoSettingsData } from "@/types/attendance-demo";

const DEMO_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

type DemoActor = Pick<SessionUser, "uid" | "displayName" | "role"> & {
  username?: string;
};

type DemoSettingRecord = {
  enabled: boolean;
  customTime: string | null;
};

export class DemoAttendanceDisabledError extends Error {
  readonly code = "DEMO_ATTENDANCE_DISABLED";

  constructor() {
    super("Prototype attendance demonstration is currently disabled.");
    this.name = "DemoAttendanceDisabledError";
  }
}

export class DemoEmployeeUnavailableError extends Error {
  readonly code = "DEMO_EMPLOYEE_UNAVAILABLE";

  constructor() {
    super("The authenticated employee record is unavailable.");
    this.name = "DemoEmployeeUnavailableError";
  }
}

export class DemoAttendanceValidationError extends Error {
  readonly code = "DEMO_ATTENDANCE_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "DemoAttendanceValidationError";
  }
}

export class DemoAttendanceResetBlockedError extends Error {
  readonly code = "DEMO_ATTENDANCE_RESET_BLOCKED";
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = "DemoAttendanceResetBlockedError";
    this.reason = reason;
  }
}

export class DemoAttendanceResetProcessingError extends Error {
  readonly code = "DEMO_ATTENDANCE_RESET_PROCESSING_FAILED";

  constructor() {
    super("The simulated attendance was reset, but Unified Attendance could not finish reprocessing it.");
    this.name = "DemoAttendanceResetProcessingError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSimulated(value: unknown): boolean {
  return isRecord(value) && value.simulated === true;
}

function validateDemoTime(value: unknown): string {
  if (typeof value !== "string" || !DEMO_TIME_PATTERN.test(value)) {
    throw new DemoAttendanceValidationError(
      "Custom attendance time must use the 24-hour HH:mm format.",
    );
  }

  return value;
}

function normalizeSetting(setting: {
  enabled: boolean;
  customTime: string | null;
} | null): DemoSettingRecord {
  if (!setting || !setting.enabled || !setting.customTime || !DEMO_TIME_PATTERN.test(setting.customTime)) {
    return {
      enabled: false,
      customTime: setting?.customTime ?? null,
    };
  }

  return {
    enabled: true,
    customTime: setting.customTime,
  };
}

function getResetProtectionReason(input: {
  featureEnabled: boolean;
  record: {
    hrVerificationStatus: "pending" | "verified";
    timeInSource: "QR" | "BUNDY" | null;
    timeOutSource: "QR" | "BUNDY" | null;
    sourceMetadata: unknown;
    bundyEvidence: Array<{ id: string }>;
    corrections: Array<{ id: string }>;
  } | null;
  payrollBatchItem: {
    batch: { status: string; handoff: { id: string } | null };
  } | null;
}): string | null {
  if (!input.featureEnabled) {
    return "Prototype attendance demonstration is disabled.";
  }

  if (!input.record) {
    return "No simulated QR attendance exists for today.";
  }

  if (!isSimulated(input.record.sourceMetadata)) {
    return "Today's QR attendance was not created in demo mode.";
  }

  if (input.record.hrVerificationStatus === "verified") {
    return "This attendance has been Final Verified by HR and cannot be reset.";
  }

  if (input.payrollBatchItem) {
    return "This attendance is already included in Payroll processing and cannot be reset.";
  }

  if (input.record.bundyEvidence.length > 0
    || input.record.timeInSource === "BUNDY"
    || input.record.timeOutSource === "BUNDY") {
    return "Bundy evidence is linked to this attendance and cannot be reset here.";
  }

  if (input.record.corrections.length > 0) {
    return "This attendance has a correction request and cannot be reset here.";
  }

  if (input.record.timeInSource !== "QR" && input.record.timeOutSource !== "QR") {
    return "No simulated QR attendance exists for today.";
  }

  return null;
}

async function findDemoEmployee(employeeReference: string) {
  return getRepositoryPrisma().employee.findUnique({
    where: { employeeId: employeeReference },
    select: {
      id: true,
      employeeId: true,
      displayName: true,
      attendanceDemoSetting: {
        select: {
          enabled: true,
          customTime: true,
        },
      },
    },
  });
}

async function getResetState(employeeId: string, attendanceDate: string) {
  const prisma = getRepositoryPrisma();
  const employee = await prisma.employee.findUnique({
    where: { employeeId },
    select: { id: true },
  });

  if (!employee) {
    throw new DemoEmployeeUnavailableError();
  }

  const [record, payrollBatchItem] = await Promise.all([
    prisma.attendanceRecord.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId: employee.id,
          attendanceDate: new Date(`${attendanceDate}T00:00:00.000Z`),
        },
      },
      select: {
        hrVerificationStatus: true,
        timeInSource: true,
        timeOutSource: true,
        sourceMetadata: true,
        bundyEvidence: { select: { id: true }, take: 1 },
        corrections: { select: { id: true }, take: 1 },
      },
    }),
    prisma.payrollBatchItem.findFirst({
      where: {
        employeeId: employee.id,
        periodStart: { lte: new Date(`${attendanceDate}T00:00:00.000Z`) },
        periodEnd: { gte: new Date(`${attendanceDate}T00:00:00.000Z`) },
      },
      select: {
        batch: {
          select: {
            status: true,
            handoff: { select: { id: true } },
          },
        },
      },
    }),
  ]);

  return { record, payrollBatchItem };
}

export async function getEmployeeAttendanceDemoData(
  employeeReference: string,
  now = new Date(),
): Promise<AttendanceDemoSettingsData> {
  const featureEnabled = isDemoAttendanceEnabled();
  const employee = await findDemoEmployee(employeeReference);

  if (!employee) {
    throw new DemoEmployeeUnavailableError();
  }

  const attendanceDate = formatCampusDateKey(now);
  const attendance = await getTodayAttendanceForEmployee(employeeReference, now);
  const setting = normalizeSetting(employee.attendanceDemoSetting);
  const resetState = await getResetState(employeeReference, attendanceDate);
  const resetBlockedReason = getResetProtectionReason({
    featureEnabled,
    record: resetState.record,
    payrollBatchItem: resetState.payrollBatchItem,
  });

  return {
    featureEnabled,
    enabled: featureEnabled && setting.enabled,
    customTime: featureEnabled ? setting.customTime : null,
    attendanceDate,
    attendance: attendance.attendance,
    resetAvailable: !resetBlockedReason,
    resetBlockedReason,
  };
}

export async function updateEmployeeAttendanceDemoSettings(input: {
  employeeReference: string;
  enabled: boolean;
  customTime: string | null;
  actor: DemoActor;
}): Promise<AttendanceDemoSettingsData> {
  if (!isDemoAttendanceEnabled()) {
    throw new DemoAttendanceDisabledError();
  }

  const employee = await findDemoEmployee(input.employeeReference);
  if (!employee) {
    throw new DemoEmployeeUnavailableError();
  }

  const customTime = input.enabled
    ? validateDemoTime(input.customTime)
    : null;
  await getRepositoryPrisma().$transaction(async (transaction) => {
    const updated = await transaction.employeeAttendanceDemoSetting.upsert({
      where: { employeeId: employee.id },
      create: {
        employeeId: employee.id,
        enabled: input.enabled,
        customTime,
      },
      update: {
        enabled: input.enabled,
        customTime,
      },
      select: {
        enabled: true,
        customTime: true,
      },
    });

    await recordAuditEvent({
      eventType: "employee.demo_attendance_settings.updated",
      action: "Employee Demo Attendance Settings Updated",
      module: "Employee Attendance",
      actor: {
        type: "user",
        uid: input.actor.uid,
        displayName: input.actor.displayName,
        role: input.actor.role,
      },
      target: {
        type: "employee_attendance_demo_setting",
        id: employee.id,
        reference: employee.employeeId,
        label: employee.displayName,
      },
      outcome: "Successful",
      summary: "An employee updated their prototype attendance demonstration settings.",
      metadata: {
        enabled: updated.enabled,
        customTime: updated.customTime,
      },
    }, transaction);

    return updated;
  });

  return getEmployeeAttendanceDemoData(input.employeeReference);
}

export async function getEffectiveDemoAttendanceTime(input: {
  employeeReference: string;
  attendanceDate: string;
  actualRecordedAt: Date;
}): Promise<{
  occurredAt: Date;
  simulated: boolean;
  demoAttendanceTime: string | null;
}> {
  if (!isDemoAttendanceEnabled()) {
    return {
      occurredAt: input.actualRecordedAt,
      simulated: false,
      demoAttendanceTime: null,
    };
  }

  const employee = await findDemoEmployee(input.employeeReference);
  const setting = normalizeSetting(employee?.attendanceDemoSetting ?? null);

  if (!setting.enabled || !setting.customTime) {
    return {
      occurredAt: input.actualRecordedAt,
      simulated: false,
      demoAttendanceTime: null,
    };
  }

  const occurredAt = new Date(
    `${input.attendanceDate}T${setting.customTime}:00+08:00`,
  );

  if (Number.isNaN(occurredAt.getTime())) {
    return {
      occurredAt: input.actualRecordedAt,
      simulated: false,
      demoAttendanceTime: null,
    };
  }

  return {
    occurredAt,
    simulated: true,
    demoAttendanceTime: setting.customTime,
  };
}

export async function resetEmployeeDemoAttendance(input: {
  employeeReference: string;
  actor: DemoActor;
  now?: Date;
}): Promise<AttendanceDemoSettingsData> {
  if (!isDemoAttendanceEnabled()) {
    throw new DemoAttendanceDisabledError();
  }

  const now = input.now ?? new Date();
  const attendanceDate = formatCampusDateKey(now);
  const prisma = getRepositoryPrisma();
  const employee = await findDemoEmployee(input.employeeReference);

  if (!employee) {
    throw new DemoEmployeeUnavailableError();
  }

  await prisma.$transaction(async (transaction) => {
    const [record, payrollBatchItem] = await Promise.all([
      transaction.attendanceRecord.findUnique({
        where: {
          employeeId_attendanceDate: {
            employeeId: employee.id,
            attendanceDate: new Date(`${attendanceDate}T00:00:00.000Z`),
          },
        },
        select: {
          id: true,
          hrVerificationStatus: true,
          timeInSource: true,
          timeOutSource: true,
          sourceMetadata: true,
          bundyEvidence: { select: { id: true }, take: 1 },
          corrections: { select: { id: true }, take: 1 },
        },
      }),
      transaction.payrollBatchItem.findFirst({
        where: {
          employeeId: employee.id,
          periodStart: { lte: new Date(`${attendanceDate}T00:00:00.000Z`) },
          periodEnd: { gte: new Date(`${attendanceDate}T00:00:00.000Z`) },
        },
        select: {
          batch: {
            select: {
              status: true,
              handoff: { select: { id: true } },
            },
          },
        },
      }),
    ]);
    const reason = getResetProtectionReason({
      featureEnabled: true,
      record,
      payrollBatchItem,
    });

    if (reason) {
      throw new DemoAttendanceResetBlockedError(reason);
    }

    await transaction.attendanceRecord.update({
      where: { id: record!.id },
      data: {
        timeIn: null,
        timeOut: null,
        timeInSource: null,
        timeOutSource: null,
        timeInSourceReference: null,
        timeOutSourceReference: null,
        timeInOperatorUserId: null,
        timeOutOperatorUserId: null,
        timeInActorSnapshot: Prisma.DbNull,
        timeOutActorSnapshot: Prisma.DbNull,
        status: "present",
        payrollReadinessStatus: "blocked",
        payrollReadinessReasons: ["QR_DEMO_RESET"],
        technicalState: "NO_EVENTS",
        businessStatus: "UNCLASSIFIED",
        processedAt: now,
        lastReprocessedAt: now,
        requiresReview: true,
        reviewReasonCode: "QR_DEMO_RESET",
        sourceMetadata: {
          source: "QR",
          demoAttendanceReset: true,
          resetAt: now.toISOString(),
        },
      },
    });

    await recordAuditEvent({
      eventType: "employee.demo_qr_attendance.reset",
      action: "Employee Demo QR Attendance Reset",
      module: "Employee Attendance",
      actor: {
        type: "user",
        uid: input.actor.uid,
        displayName: input.actor.displayName,
        role: input.actor.role,
      },
      target: {
        type: "attendance_record",
        id: record!.id,
        reference: `${employee.employeeId}:${attendanceDate}`,
        label: employee.displayName,
      },
      outcome: "Successful",
      summary: "An eligible simulated QR attendance was reset for the current business day.",
      metadata: {
        employeeReference: employee.employeeId,
        attendanceDate,
        affectedCount: 1,
      },
      occurredAt: now,
    }, transaction);
  });

  try {
    await processUnifiedAttendanceForEmployeeDate({
      employeeId: input.employeeReference,
      attendanceDate,
    });
  } catch {
    throw new DemoAttendanceResetProcessingError();
  }

  return getEmployeeAttendanceDemoData(input.employeeReference, now);
}
