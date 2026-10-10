import { FieldValue, type DocumentData } from "firebase-admin/firestore";

import { employeeScheduleSeedData } from "../data/employee-schedules";
import { requireSeedServices } from "../seed-context";
import type {
  FirebaseSeeder,
  SeedRecord,
  SeedRecordStatus,
  SeederResult,
} from "../seed-types";

const scheduleCollection = "employeeSchedules";

function valuesMatch(
  actual: unknown,
  expected: unknown,
): boolean {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return actual.length === expected.length
      && actual.every((value, index) => value === expected[index]);
  }

  return actual === expected;
}

function hasMatchingFields(
  existingData: DocumentData | undefined,
  expectedData: Record<string, unknown>,
): boolean {
  if (!existingData) {
    return false;
  }

  return Object.entries(expectedData).every(
    ([key, value]) => valuesMatch(existingData[key], value),
  );
}

function getPlannedRecord(
  employeeId: string,
  scheduleId: string,
): SeedRecord {
  return {
    id: employeeId,
    label: scheduleId,
    status: "planned",
    detail: "Would merge the deterministic Employee-linked schedule reference.",
  };
}

export const seedEmployeeSchedules: FirebaseSeeder = async (
  context,
): Promise<SeederResult> => {
  if (context.dryRun) {
    return {
      name: "schedules",
      records: employeeScheduleSeedData.map((schedule) =>
        getPlannedRecord(schedule.employeeId, schedule.scheduleId),
      ),
    };
  }

  const { db } = requireSeedServices(context);
  const records: SeedRecord[] = [];

  for (const schedule of employeeScheduleSeedData) {
    const reference = db
      .collection(scheduleCollection)
      .doc(schedule.employeeId);
    const snapshot = await reference.get();
    const existingData = snapshot.data();
    const seedFields = {
      scheduleId: schedule.scheduleId,
      employeeId: schedule.employeeId,
      workStart: schedule.workStart,
      workEnd: schedule.workEnd,
      breakStart: schedule.breakStart,
      breakEnd: schedule.breakEnd,
      shiftLabel: schedule.shiftLabel,
      workDays: [...schedule.workDays],
      restDays: [...schedule.restDays],
      workLocation: schedule.workLocation,
      sourceSystem: schedule.sourceSystem,
      dataSource: schedule.dataSource,
    };
    const needsCreatedAt = !existingData?.createdAt;
    const needsWrite =
      !snapshot.exists
      || needsCreatedAt
      || !hasMatchingFields(existingData, seedFields);

    if (!needsWrite) {
      records.push({
        id: schedule.employeeId,
        label: schedule.scheduleId,
        status: "unchanged",
        detail: "Existing schedule reference already matches the seed data.",
      });
      continue;
    }

    const writeData: DocumentData = {
      ...seedFields,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (needsCreatedAt) {
      writeData.createdAt = FieldValue.serverTimestamp();
    }

    await reference.set(writeData, { merge: true });

    const status: SeedRecordStatus = snapshot.exists ? "updated" : "created";

    records.push({
      id: schedule.employeeId,
      label: schedule.scheduleId,
      status,
      detail: status === "created"
        ? "Created the deterministic Employee-linked schedule reference."
        : "Merged the current development schedule reference.",
    });
  }

  return {
    name: "schedules",
    records,
  };
};
