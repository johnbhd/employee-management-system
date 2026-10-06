import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";

import { payrollPayslipSeedData, type SeedPayrollPayslip } from "../data/payslips";
import { employeeSeedData } from "../data/employees";
import { requireSeedServices } from "../seed-context";
import type {
  FirebaseSeeder,
  SeedRecord,
  SeedRecordStatus,
  SeederResult,
} from "../seed-types";

const payslipCollection = "payrollPayslips";

function hasMatchingFields(
  existingData: DocumentData | undefined,
  expectedData: Record<string, unknown>,
): boolean {
  if (!existingData) {
    return false;
  }

  return Object.entries(expectedData).every(([key, value]) =>
    JSON.stringify(existingData[key]) === JSON.stringify(value),
  );
}

function getPlannedRecord(payslip: SeedPayrollPayslip): SeedRecord {
  return {
    id: payslip.id,
    label: `${payslip.employeeId} ${payslip.periodStart}`,
    status: "planned",
    detail: "Would merge the deterministic Payroll System snapshot.",
  };
}

function toTimestamp(value: string | null): Timestamp | null {
  return value ? Timestamp.fromDate(new Date(value)) : null;
}

export const seedPayslips: FirebaseSeeder = async (
  context,
): Promise<SeederResult> => {
  if (context.dryRun) {
    return {
      name: "payslips",
      records: payrollPayslipSeedData.map(getPlannedRecord),
    };
  }

  const { db } = requireSeedServices(context);
  const knownEmployeeIds = new Set(
    employeeSeedData.map((employee) => employee.employeeId),
  );
  const records: SeedRecord[] = [];

  for (const payslip of payrollPayslipSeedData) {
    if (!knownEmployeeIds.has(payslip.employeeId)) {
      throw new Error(
        `Payslip seed ${payslip.id} references an unknown employee ID.`,
      );
    }

    const reference = db.collection(payslipCollection).doc(payslip.id);
    const snapshot = await reference.get();
    const existingData = snapshot.data();
    const seedFields = {
      employeeId: payslip.employeeId,
      periodStart: payslip.periodStart,
      periodEnd: payslip.periodEnd,
      payFrequency: payslip.payFrequency,
      monthlyBasicSalary: payslip.monthlyBasicSalary,
      cutoffBasicPay: payslip.cutoffBasicPay,
      referenceDailyRate: payslip.referenceDailyRate,
      basicPay: payslip.basicPay,
      grossPay: payslip.grossPay,
      deductions: payslip.deductions,
      totalDeductions: payslip.totalDeductions,
      netPay: payslip.netPay,
      status: payslip.status,
      releasedAt: toTimestamp(payslip.releasedAt),
      source: payslip.source,
      payrollReference: payslip.payrollReference,
      dataSource: payslip.dataSource,
      monthlySummary: payslip.monthlySummary,
    };
    const needsCreatedAt = !existingData?.createdAt;
    const needsWrite =
      !snapshot.exists
      || needsCreatedAt
      || !hasMatchingFields(existingData, seedFields);

    if (!needsWrite) {
      records.push({
        id: payslip.id,
        label: `${payslip.employeeId} ${payslip.periodStart}`,
        status: "unchanged",
        detail: "Existing Payroll System snapshot already matches the seed data.",
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
      id: payslip.id,
      label: `${payslip.employeeId} ${payslip.periodStart}`,
      status,
      detail:
        status === "created"
          ? "Created the deterministic Payroll System snapshot."
          : "Merged the current Payroll System snapshot data.",
    });
  }

  return {
    name: "payslips",
    records,
  };
};
