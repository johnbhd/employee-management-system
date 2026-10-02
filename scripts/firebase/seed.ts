import { loadEnvConfig } from "@next/env";

import { employeeSeedData } from "./data/employees";
import { userSeedData } from "./data/users";
import { createSeedContext } from "./seed-context";
import type {
  FirebaseSeeder,
  SeedName,
  SeederResult,
} from "./seed-types";
import { seedEmployees } from "./seeders/employees.seeder";
import { seedUsers } from "./seeders/users.seeder";

loadEnvConfig(process.cwd());

const firebaseSeeders: Record<SeedName, FirebaseSeeder> = {
  employees: seedEmployees,
  users: seedUsers,
};

const allSeedNames: readonly SeedName[] = ["employees", "users"];

function printHelp(): void {
  console.log(`AU-JSC Firebase development seeder

Usage:
  yarn firebase:seed [employees|users] [--dry-run]

Commands:
  employees  Seed the HRPS employee reference documents.
  users      Seed employees first, then Auth users and Firestore user documents.
  --dry-run  Preview the deterministic records without connecting or writing.
  --help     Show this help message.

With no command, employees and users run in dependency order.`);
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
        `Unknown Firebase seeder: ${argument}\n\nAvailable seeders:\n- employees\n- users`,
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
  const employeeIdSet = new Set(employeeIds);

  if (new Set(employeeIds).size !== employeeIds.length) {
    throw new Error("Employee seed data contains duplicate employee IDs.");
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
