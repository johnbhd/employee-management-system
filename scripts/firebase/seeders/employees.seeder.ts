import { FieldValue, type DocumentData } from "firebase-admin/firestore";

import { employeeSeedData } from "../data/employees";
import { requireSeedServices } from "../seed-context";
import type {
  FirebaseSeeder,
  SeedRecord,
  SeedRecordStatus,
  SeederResult,
} from "../seed-types";

const employeeCollection = "employees";

function hasMatchingFields(
  existingData: DocumentData | undefined,
  expectedData: Record<string, unknown>,
): boolean {
  if (!existingData) {
    return false;
  }

  return Object.entries(expectedData).every(
    ([key, value]) => existingData[key] === value,
  );
}

function getPlannedRecord(employeeId: string, displayName: string): SeedRecord {
  return {
    id: employeeId,
    label: displayName,
    status: "planned",
    detail: "Would merge the deterministic employee document.",
  };
}

export const seedEmployees: FirebaseSeeder = async (
  context,
): Promise<SeederResult> => {
  if (context.dryRun) {
    return {
      name: "employees",
      records: employeeSeedData.map((employee) =>
        getPlannedRecord(employee.employeeId, employee.displayName),
      ),
    };
  }

  const { db } = requireSeedServices(context);
  const records: SeedRecord[] = [];

  for (const employee of employeeSeedData) {
    const reference = db.collection(employeeCollection).doc(employee.employeeId);
    const snapshot = await reference.get();
    const existingData = snapshot.data();
    const seedFields = {
      employeeId: employee.employeeId,
      displayName: employee.displayName,
      department: employee.department,
      position: employee.position,
      employmentStatus: employee.employmentStatus,
      sourceSystem: employee.sourceSystem,
      dataSource: employee.dataSource,
    };
    const needsCreatedAt = !existingData?.createdAt;
    const needsWrite =
      !snapshot.exists ||
      needsCreatedAt ||
      !hasMatchingFields(existingData, seedFields);

    if (!needsWrite) {
      records.push({
        id: employee.employeeId,
        label: employee.displayName,
        status: "unchanged",
        detail: "Existing document already matches the seed data.",
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
      id: employee.employeeId,
      label: employee.displayName,
      status,
      detail:
        status === "created"
          ? "Created the deterministic employee document."
          : "Merged the current HRPS reference data into the employee document.",
    });
  }

  return {
    name: "employees",
    records,
  };
};
