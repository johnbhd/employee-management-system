import { loadEnvConfig } from "@next/env";

import { demoEmployeeSeedAccounts } from "./data/demo-employees";
import { employeeSeedData } from "./data/employees";
import { employeeScheduleSeedData } from "./data/employee-schedules";
import { attendanceCorrectionSeedData } from "./data/attendance-corrections";
import { payrollPayslipSeedData } from "./data/payslips";
import { userSeedData } from "./data/users";
import { createSeedContext } from "./seed-context";
import type {
  FirebaseSeeder,
  SeedName,
  SeederResult,
} from "./seed-types";
import { seedEmployees } from "./seeders/employees.seeder";
import { seedEmployeeSchedules } from "./seeders/employee-schedules.seeder";
import { seedAttendanceCorrections } from "./seeders/attendance-corrections.seeder";
import { seedPayslips } from "./seeders/payslips.seeder";
import { seedUsers } from "./seeders/users.seeder";

loadEnvConfig(process.cwd());

const firebaseSeeders: Record<SeedName, FirebaseSeeder> = {
  employees: seedEmployees,
  schedules: seedEmployeeSchedules,
  users: seedUsers,
  payslips: seedPayslips,
  corrections: seedAttendanceCorrections,
};

const allSeedNames: readonly SeedName[] = [
  "employees",
  "schedules",
  "users",
  "payslips",
  "corrections",
];

function printHelp(): void {
  console.log(`AU-JSC Firebase development seeder

Usage:
  yarn firebase:seed [employees|schedules|users|payslips|corrections] [--dry-run]

Commands:
  employees  Seed the HRPS employee reference documents.
  schedules  Seed Employee-linked HRPS reference schedule documents.
  users      Seed employees first, then Auth users and Firestore user documents.
  payslips   Seed employees, users, and development Payroll System snapshots.
  corrections Seed development correction requests and supporting attendance records.
  --dry-run  Preview the deterministic records without connecting or writing.
  --help     Show this help message.

With no command, employees, schedules, users, payslips, and corrections run in dependency order.`);
}

function isSeedName(value: string): value is SeedName {
  return allSeedNames.includes(value as SeedName);
}

function parseArgs(args: readonly string[]): {
  dryRun: boolean;
  requestedName: SeedName | null;
} {
  let dryRun = false;
  let requestedName: SeedName | null = null;

  for (const argument of args) {
    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (argument === "--help" || argument === "-h") {
      printHelp();
      process.exit(0);
    }

    if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    }

    if (requestedName) {
      throw new Error("Only one Firebase seeder may be selected at a time.");
    }

    if (!isSeedName(argument)) {
      throw new Error(
        `Unknown Firebase seeder: ${argument}\n\nAvailable seeders:\n- employees\n- schedules\n- users\n- payslips\n- corrections`,
      );
    }

    requestedName = argument;
  }

  return {
    dryRun,
    requestedName,
  };
}

function validateSeedData(): void {
  const employeeIds = employeeSeedData.map((employee) => employee.employeeId);
  const userIds = userSeedData.map((user) => user.uid);
  const usernames = userSeedData.map((user) => user.username);
  const authEmails = userSeedData.map((user) => user.authEmail);
  const scheduleIds = employeeScheduleSeedData.map((schedule) => schedule.scheduleId);
  const scheduleEmployeeIds = employeeScheduleSeedData.map(
    (schedule) => schedule.employeeId,
  );
  const payslipIds = payrollPayslipSeedData.map((payslip) => payslip.id);
  const correctionIds = attendanceCorrectionSeedData.map(
    (correction) => correction.requestId,
  );
  const employeeIdSet = new Set(employeeIds);
  const demoEmployeeIds = demoEmployeeSeedAccounts.map(
    (employee) => employee.employeeId,
  );

  if (demoEmployeeSeedAccounts.length !== 10) {
    throw new Error("Demo employee seed data must contain exactly 10 accounts.");
  }

  if (
    new Set(demoEmployeeIds).size !== demoEmployeeIds.length
    || demoEmployeeIds.some((employeeId) => !/^\d{3}$/.test(employeeId))
  ) {
    throw new Error(
      "Demo employee IDs must be unique three-digit strings with leading zeros preserved.",
    );
  }

  if (demoEmployeeIds.some((employeeId) => !employeeIdSet.has(employeeId))) {
    throw new Error(
      "Every demo employee account must reference a seeded employee document.",
    );
  }

  if (
    demoEmployeeSeedAccounts.some(
      (employee) => employee.role !== "employee" || employee.employmentStatus !== "active",
    )
  ) {
    throw new Error(
      "Every demo employee account must use the active employee role and status.",
    );
  }

  if (new Set(employeeIds).size !== employeeIds.length) {
    throw new Error("Employee seed data contains duplicate employee IDs.");
  }

  if (new Set(scheduleIds).size !== scheduleIds.length) {
    throw new Error("Schedule seed data contains duplicate schedule IDs.");
  }

  if (new Set(scheduleEmployeeIds).size !== scheduleEmployeeIds.length) {
    throw new Error("Schedule seed data contains duplicate employee IDs.");
  }

  if (scheduleEmployeeIds.some((employeeId) => !employeeIdSet.has(employeeId))) {
    throw new Error("Schedule seed data references an unknown employee ID.");
  }

  if (demoEmployeeIds.some((employeeId) => !scheduleEmployeeIds.includes(employeeId))) {
    throw new Error("Every demo employee account must reference a seeded schedule.");
  }

  if (new Set(userIds).size !== userIds.length) {
    throw new Error("User seed data contains duplicate deterministic UIDs.");
  }

  if (new Set(usernames).size !== usernames.length) {
    throw new Error("User seed data contains duplicate usernames.");
  }

  if (new Set(authEmails).size !== authEmails.length) {
    throw new Error("User seed data contains duplicate Auth emails.");
  }

  if (new Set(payslipIds).size !== payslipIds.length) {
    throw new Error("Payslip seed data contains duplicate deterministic IDs.");
  }

  if (new Set(correctionIds).size !== correctionIds.length) {
    throw new Error("Correction seed data contains duplicate deterministic request IDs.");
  }

  if (
    attendanceCorrectionSeedData.some(
      (correction) =>
        !employeeIdSet.has(correction.employeeId) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(correction.attendanceDate),
    )
  ) {
    throw new Error(
      "Correction seed data must reference seeded employees and valid attendance dates.",
    );
  }

  if (
    attendanceCorrectionSeedData.some(
      (correction) =>
        (correction.issueType === "Missing Time-Out" &&
          (!correction.requestedTimeOut || correction.timeOut !== null)) ||
        (correction.issueType === "Incorrect Time-In" &&
          (!correction.requestedTimeIn || correction.timeOut === null)),
    )
  ) {
    throw new Error(
      "Correction seed data must include the requested time field for its issue type.",
    );
  }

  if (
    payrollPayslipSeedData.some(
      (payslip) => !employeeIdSet.has(payslip.employeeId),
    )
  ) {
    throw new Error("Payslip seed data references an unknown employee ID.");
  }

  for (const user of userSeedData) {
    if (user.employeeId && !employeeIdSet.has(user.employeeId)) {
      throw new Error(
        `User seed data references unknown employee ${user.employeeId}.`,
      );
    }
  }
}

function getSeedNames(requestedName: SeedName | null): readonly SeedName[] {
  if (!requestedName) {
    return allSeedNames;
  }

  if (requestedName === "users") {
    return ["employees", "users"];
  }

  if (requestedName === "payslips") {
    return ["employees", "users", "payslips"];
  }

  if (requestedName === "schedules") {
    return ["employees", "schedules"];
  }

  if (requestedName === "corrections") {
    return ["employees", "users", "corrections"];
  }

  return [requestedName];
}

function printResult(result: SeederResult): void {
  const counts = result.records.reduce<Record<string, number>>(
    (summary, record) => {
      summary[record.status] = (summary[record.status] ?? 0) + 1;
      return summary;
    },
    {},
  );
  const countSummary = Object.entries(counts)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  console.log(`${result.name}: ${result.records.length} record(s) (${countSummary})`);
}

function getSafeErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return `Firebase seeding failed (${error.code}).`;
  }

  if (error instanceof Error && error.message.startsWith("Unknown Firebase")) {
    return error.message;
  }

  if (
    error instanceof Error &&
    (error.message.startsWith("Unknown option:") ||
      error.message.startsWith("Only one Firebase seeder"))
  ) {
    return error.message;
  }

  if (error instanceof Error && error.message.startsWith("Firebase seed")) {
    return error.message;
  }

  if (error instanceof Error && error.message.startsWith("Firebase Admin")) {
    return error.message;
  }

  return "Firebase seeding failed. Review the Firebase configuration and command output.";
}

async function main(): Promise<void> {
  const { dryRun, requestedName } = parseArgs(process.argv.slice(2));
  const seedNames = getSeedNames(requestedName);

  validateSeedData();

  const context = createSeedContext(dryRun);

  console.log(`Firebase project: ${context.projectId ? "configured" : "not configured"}`);
  console.log(`Mode: ${dryRun ? "dry run (no reads or writes)" : "write"}`);
  console.log(`Seed order: ${seedNames.join(" -> ")}`);

  for (const seedName of seedNames) {
    const result = await firebaseSeeders[seedName](context);
    printResult(result);
  }

  if (dryRun) {
    console.log("Dry run complete. No Firebase data was changed.");
  } else {
    console.log("Firebase seed complete. No destructive operations were used.");
  }
}

main().catch((error: unknown) => {
  console.error(getSafeErrorMessage(error));
  process.exitCode = 1;
});
