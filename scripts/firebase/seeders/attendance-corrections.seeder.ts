import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";

import { attendanceCorrectionSeedData } from "../data/attendance-corrections";
import { demoEmployeeSeedAccounts } from "../data/demo-employees";
import { requireSeedServices } from "../seed-context";
import type {
  FirebaseSeeder,
  SeedRecord,
  SeedRecordStatus,
  SeederResult,
} from "../seed-types";

const attendanceCollection = "attendance";
const correctionCollection = "attendanceCorrectionRequests";
const hrOperator = {
  uid: "seed-aujsc-hr",
  username: "aujsc.hr",
  displayName: "HR / Attendance Staff",
  role: "hr" as const,
};

function toTimestamp(value: string) {
  return Timestamp.fromDate(new Date(value));
}

function getEmployee(employeeId: string) {
  return demoEmployeeSeedAccounts.find((employee) => employee.employeeId === employeeId);
}

function getPlannedRecord(requestId: string): SeedRecord {
  return {
    id: requestId,
    label: "Pending correction request",
    status: "planned",
    detail: "Would create a deterministic attendance record and pending correction request.",
  };
}

export const seedAttendanceCorrections: FirebaseSeeder = async (
  context,
): Promise<SeederResult> => {
  if (context.dryRun) {
    return {
      name: "corrections",
      records: attendanceCorrectionSeedData.map((item) => getPlannedRecord(item.requestId)),
    };
  }

  const { db } = requireSeedServices(context);
  const records: SeedRecord[] = [];

  for (const correction of attendanceCorrectionSeedData) {
    const employee = getEmployee(correction.employeeId);

    if (!employee) {
      throw new Error(
        `Correction seed ${correction.requestId} references an unknown demo employee.`,
      );
    }

    const attendanceReference = db
      .collection(attendanceCollection)
      .doc(`${correction.employeeId}_${correction.attendanceDate}`);
    const attendanceSnapshot = await attendanceReference.get();
    const submittedAt = toTimestamp(correction.submittedAt);
    const timeIn = toTimestamp(correction.timeIn);
    const timeOut = correction.timeOut ? toTimestamp(correction.timeOut) : null;
    const attendanceFields: DocumentData = {
      employeeId: correction.employeeId,
      attendanceDate: correction.attendanceDate,
      timeIn,
      timeOut,
      timeInSource: "QR",
      timeOutSource: timeOut ? "QR" : null,
      status: timeOut ? "completed" : "present",
      timeInOperator: hrOperator,
      timeOutOperator: timeOut ? hrOperator : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!attendanceSnapshot.exists) {
      await attendanceReference.set(attendanceFields);
    }

    const correctionReference = db
      .collection(correctionCollection)
      .doc(correction.requestId);
    const correctionSnapshot = await correctionReference.get();

    if (correctionSnapshot.exists) {
      records.push({
        id: correction.requestId,
        label: "Pending correction request",
        status: "unchanged",
        detail: "Existing correction request was preserved without overwriting its decision state.",
      });
      continue;
    }

    const originalAttendance = {
      attendanceRecordId: attendanceReference.id,
      attendanceDate: correction.attendanceDate,
      timeIn,
      timeOut,
      timeInSource: "QR",
      timeOutSource: timeOut ? "QR" : null,
      status: timeOut ? "completed" : "present",
    };
    const requestedChanges = correction.requestedTimeIn
      ? { timeIn: toTimestamp(correction.requestedTimeIn) }
      : correction.requestedTimeOut
        ? { timeOut: toTimestamp(correction.requestedTimeOut) }
        : null;

    if (!requestedChanges) {
      throw new Error(
        `Correction seed ${correction.requestId} does not define a requested time change.`,
      );
    }
    const requestFields: DocumentData = {
      id: correction.requestId,
      attendanceRecordId: attendanceReference.id,
      employeeId: correction.employeeId,
      attendanceDate: correction.attendanceDate,
      issueType: correction.issueType,
      status: "pending",
      reason: correction.reason,
      submittedAt,
      submittedBy: {
        displayName: employee.displayName,
        username: employee.username,
        role: "employee",
      },
      originalAttendance,
      requestedChanges,
      resultingAttendance: null,
      changedFields: [],
      evidence: [],
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      updatedAt: submittedAt,
    };

    await correctionReference.set(requestFields);
    const status: SeedRecordStatus = "created";

    records.push({
      id: correction.requestId,
      label: "Pending correction request",
      status,
      detail: "Created a deterministic pending correction request without overwriting existing attendance.",
    });
  }

  return {
    name: "corrections",
    records,
  };
};
