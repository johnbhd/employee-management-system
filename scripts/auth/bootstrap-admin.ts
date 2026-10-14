import { loadEnvConfig } from "@next/env";
import { Prisma, PrismaClient } from "@prisma/client";

import { reservedPermissionsForAdmin } from "../../src/lib/auth/permissions";
import { permissionKeys, type PermissionKey } from "../../src/types/permissions";

loadEnvConfig(process.cwd());

type BootstrapMode = "dry-run" | "apply";
type BootstrapOutcome = "created" | "validated";

export type BootstrapConfig = {
  mode: BootstrapMode;
  firebaseUid: string;
  username: string;
  displayName: string;
  selfCheck: boolean;
  showHelp: boolean;
};

type ExistingIdentity = {
  id: string;
  firebaseUid: string;
  username: string;
  displayName: string;
  status: "active" | "inactive" | "disabled";
  employeeId: string | null;
  roleCode: string;
};

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

type BaselineCounts = {
  users: number;
  employees: number;
  schedules: number;
  attendance: number;
  corrections: number;
  payrollBatches: number;
  payrollHandoffs: number;
  payrollResults: number;
  payslips: number;
  accounting: number;
  audit: number;
};

type AdminRoleSummary = {
  roleId: string;
  permissionCount: number;
  permissions: PermissionKey[];
};

const permissionKeySet = new Set<string>(permissionKeys);
const reservedAdminPermissionSet = new Set<string>(reservedPermissionsForAdmin);

const helpText = `
DB-SEED-011A PostgreSQL Initial IT Administrator Bootstrap

Safe default:
  npm.cmd run db:bootstrap-admin -- --dry-run

Apply explicitly:
  npm.cmd run db:bootstrap-admin -- --apply

Required server-only inputs:
  ADMIN_FIREBASE_UID       Real Firebase Authentication UID.
  ADMIN_USERNAME           PostgreSQL application username.
  ADMIN_DISPLAY_NAME      PostgreSQL application display name.

Options:
  --dry-run                Validate only (default).
  --apply                  Create the application user explicitly.
  --firebase-uid <value>   Override ADMIN_FIREBASE_UID for this run.
  --username <value>       Override ADMIN_USERNAME for this run.
  --display-name <value>   Override ADMIN_DISPLAY_NAME for this run.
  --self-check             Run local bootstrap logic checks without PostgreSQL.
  --help                   Show this help.

This command never reads or writes Firestore, never accepts a password, and
does not use Supabase Auth.
`;

export function parseBootstrapConfig(
  argv: readonly string[],
  environment: NodeJS.ProcessEnv = process.env,
): BootstrapConfig {
  const showHelp = argv.includes("--help") || argv.includes("-h");
  const selfCheck = argv.includes("--self-check");
  const hasApply = argv.includes("--apply");
  const hasDryRun = argv.includes("--dry-run");

  if (hasApply && hasDryRun) {
    throw new Error("Choose either --apply or --dry-run, not both.");
  }

  if (showHelp || selfCheck) {
    return {
      mode: hasApply ? "apply" : "dry-run",
      firebaseUid: "",
      username: "",
      displayName: "",
      selfCheck,
      showHelp,
    };
  }

  const firebaseUid = requiredValue(
    "ADMIN_FIREBASE_UID",
    valueAfter(argv, "--firebase-uid") ?? environment.ADMIN_FIREBASE_UID,
    128,
  );
  const username = normalizeUsername(
    requiredValue(
      "ADMIN_USERNAME",
      valueAfter(argv, "--username") ?? environment.ADMIN_USERNAME,
      80,
    ),
  );
  const displayName = requiredValue(
    "ADMIN_DISPLAY_NAME",
    valueAfter(argv, "--display-name") ?? environment.ADMIN_DISPLAY_NAME,
    160,
  );

  return {
    mode: hasApply ? "apply" : "dry-run",
    firebaseUid,
    username,
    displayName,
    selfCheck,
    showHelp,
  };
}

export function evaluateExistingIdentity(
  existing: ExistingIdentity | null,
  config: Pick<BootstrapConfig, "firebaseUid" | "username" | "displayName">,
): BootstrapOutcome {
  if (!existing) {
    return "created";
  }

  if (existing.firebaseUid !== config.firebaseUid) {
    throw new Error("The existing application identity does not match the supplied Firebase UID.");
  }

  if (existing.roleCode !== "admin") {
    throw new Error("The supplied Firebase UID already belongs to an application user with a different role.");
  }

  if (existing.status !== "active") {
    throw new Error("The matching application user is not active; review the account before bootstrapping.");
  }

  if (existing.employeeId !== null) {
    throw new Error("The IT Administrator bootstrap user must not be linked to an Employee record.");
  }

  if (existing.username.toLowerCase() !== config.username.toLowerCase()) {
    throw new Error("The matching application user has a different username.");
  }

  if (existing.displayName !== config.displayName) {
    throw new Error("The matching application user has a different display name.");
  }

  return "validated";
}

function valueAfter(argv: readonly string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index < 0) return null;

  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function requiredValue(name: string, value: string | undefined, maxLength: number): string {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new Error(`${name} is required. Supply it through the environment or its explicit CLI option.`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${name} exceeds its maximum length of ${maxLength}.`);
  }

  if (
    name === "ADMIN_FIREBASE_UID"
    && new Set(["admin", "administrator", "fake", "placeholder", "test", "demo"]).has(trimmed.toLowerCase())
  ) {
    throw new Error("ADMIN_FIREBASE_UID must be a real Firebase UID, not a placeholder value.");
  }

  return trimmed;
}

function normalizeUsername(value: string): string {
  const normalized = value.toLowerCase();

  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    throw new Error("ADMIN_USERNAME may contain only letters, numbers, dots, underscores, and hyphens.");
  }

  return normalized;
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured; the PostgreSQL bootstrap did not start.");
  }

  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

async function checkPostgresHealth(
  prisma: PrismaClient,
): Promise<{ configured: boolean; connected: boolean }> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { configured: false, connected: false };
  }

  try {
    await prisma.$queryRaw<{ connected: number }[]>(Prisma.sql`SELECT 1 AS connected`);
    return { configured: true, connected: true };
  } catch {
    return { configured: true, connected: false };
  }
}

async function getExistingIdentity(
  prisma: DatabaseClient,
  firebaseUid: string,
): Promise<ExistingIdentity | null> {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: {
      id: true,
      firebaseUid: true,
      username: true,
      displayName: true,
      status: true,
      employeeId: true,
      role: { select: { code: true } },
    },
  });

  return user
    ? {
      id: user.id,
      firebaseUid: user.firebaseUid,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      employeeId: user.employeeId,
      roleCode: user.role.code,
    }
    : null;
}

async function getUsernameOwner(
  prisma: DatabaseClient,
  username: string,
): Promise<{ id: string; firebaseUid: string } | null> {
  return prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: { id: true, firebaseUid: true },
  });
}

async function validateAdminRoleAndPermissions(
  prisma: DatabaseClient,
): Promise<AdminRoleSummary> {
  const role = await prisma.applicationRole.findUnique({
    where: { code: "admin" },
    select: {
      id: true,
      rolePermissions: {
        select: { permission: { select: { key: true } } },
      },
    },
  });

  if (!role) {
    throw new Error("The IT Administrator application role is not configured in PostgreSQL.");
  }

  const permissions = role.rolePermissions.map((assignment) => assignment.permission.key);
  const unknownPermissions = permissions.filter((permission) => !permissionKeySet.has(permission));
  const nonAdminPermissions = permissions.filter((permission) => !permission.startsWith("admin."));
  const missingReservedPermissions = [...reservedAdminPermissionSet].filter(
    (permission) => !permissions.includes(permission),
  );

  if (unknownPermissions.length) {
    throw new Error(`The IT Administrator role contains unknown permissions: ${unknownPermissions.join(", ")}.`);
  }

  if (nonAdminPermissions.length) {
    throw new Error("The IT Administrator role contains non-technical business permissions.");
  }

  if (missingReservedPermissions.length) {
    throw new Error(`The IT Administrator role is missing required lockout-protection permissions: ${missingReservedPermissions.join(", ")}.`);
  }

  if (!permissions.length) {
    throw new Error("The IT Administrator role has no persisted permissions.");
  }

  return {
    roleId: role.id,
    permissionCount: permissions.length,
    permissions: permissions as PermissionKey[],
  };
}

async function getBaselineCounts(prisma: DatabaseClient): Promise<BaselineCounts> {
  const [
    users,
    employees,
    schedules,
    attendance,
    corrections,
    payrollBatches,
    payrollHandoffs,
    payrollResults,
    payslips,
    accounting,
    audit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.employee.count(),
    prisma.employeeSchedule.count(),
    prisma.attendanceRecord.count(),
    prisma.attendanceCorrection.count(),
    prisma.payrollBatch.count(),
    prisma.payrollHandoff.count(),
    prisma.payrollResult.count(),
    prisma.payrollPayslip.count(),
    prisma.accountingTransfer.count(),
    prisma.auditEvent.count(),
  ]);

  return {
    users,
    employees,
    schedules,
    attendance,
    corrections,
    payrollBatches,
    payrollHandoffs,
    payrollResults,
    payslips,
    accounting,
    audit,
  };
}

async function getActiveAdminCount(prisma: DatabaseClient): Promise<number> {
  return prisma.user.count({
    where: {
      status: "active",
      role: { code: "admin" },
    },
  });
}

function assertNoBusinessGrowth(before: BaselineCounts, after: BaselineCounts): void {
  const businessKeys: Array<keyof BaselineCounts> = [
    "employees",
    "schedules",
    "attendance",
    "corrections",
    "payrollBatches",
    "payrollHandoffs",
    "payrollResults",
    "payslips",
    "accounting",
    "audit",
  ];

  const changed = businessKeys.filter((key) => before[key] !== after[key]);
  if (changed.length) {
    throw new Error(`The bootstrap changed business baseline counts: ${changed.join(", ")}.`);
  }
}

function printCounts(label: string, counts: BaselineCounts): void {
  console.log(`${label}: users=${counts.users}, employees=${counts.employees}, schedules=${counts.schedules}, attendance=${counts.attendance}, corrections=${counts.corrections}, payrollBatches=${counts.payrollBatches}, payrollHandoffs=${counts.payrollHandoffs}, payrollResults=${counts.payrollResults}, payslips=${counts.payslips}, accounting=${counts.accounting}, audit=${counts.audit}.`);
}

function runSelfCheck(): void {
  const baseConfig = {
    firebaseUid: "firebase-user-123",
    username: "admin",
    displayName: "Initial IT Administrator",
  } as const;

  if (evaluateExistingIdentity(null, baseConfig) !== "created") {
    throw new Error("Self-check failed: a missing identity should be created.");
  }

  const matching: ExistingIdentity = {
    id: "application-user-1",
    firebaseUid: baseConfig.firebaseUid,
    username: baseConfig.username,
    displayName: baseConfig.displayName,
    status: "active",
    employeeId: null,
    roleCode: "admin",
  };

  if (evaluateExistingIdentity(matching, baseConfig) !== "validated") {
    throw new Error("Self-check failed: a matching identity should validate.");
  }

  const conflictCases: ExistingIdentity[] = [
    { ...matching, roleCode: "hr" },
    { ...matching, status: "disabled" },
    { ...matching, employeeId: "employee-row-1" },
    { ...matching, displayName: "Different Admin" },
  ];

  for (const conflict of conflictCases) {
    let failed = false;
    try {
      evaluateExistingIdentity(conflict, baseConfig);
    } catch {
      failed = true;
    }

    if (!failed) {
      throw new Error("Self-check failed: a conflicting identity was accepted.");
    }
  }

  console.log("DB-SEED-011A self-check PASS.");
}

async function runBootstrap(config: BootstrapConfig): Promise<void> {
  const prisma = createPrismaClient();

  try {
    const health = await checkPostgresHealth(prisma);
    if (!health.connected) {
      throw new Error("Supabase PostgreSQL is not reachable; the bootstrap did not start.");
    }

    const before = await getBaselineCounts(prisma);
    const role = await validateAdminRoleAndPermissions(prisma);
    const existing = await getExistingIdentity(prisma, config.firebaseUid);
    const usernameOwner = await getUsernameOwner(prisma, config.username);

    if (usernameOwner && usernameOwner.id !== existing?.id) {
      throw new Error("The requested admin username is already assigned to another application identity.");
    }

    const outcome = evaluateExistingIdentity(existing, config);
    const activeAdminCount = await getActiveAdminCount(prisma);
    const projectedActiveAdminCount = activeAdminCount + (outcome === "created" ? 1 : 0);

    if (projectedActiveAdminCount < 1) {
      throw new Error("The bootstrap would leave PostgreSQL without an enabled IT Administrator.");
    }

    if (config.mode === "apply" && outcome === "created") {
      await prisma.$transaction(async (transaction) => {
        const transactionExisting = await getExistingIdentity(transaction, config.firebaseUid);
        const transactionOwner = await getUsernameOwner(transaction, config.username);

        if (transactionExisting || transactionOwner) {
          throw new Error("The admin identity changed during bootstrap; no user was created.");
        }

        await transaction.user.create({
          data: {
            firebaseUid: config.firebaseUid,
            username: config.username,
            displayName: config.displayName,
            status: "active",
            roleId: role.roleId,
            employeeId: null,
          },
        });
      });
    }

    const after = config.mode === "apply"
      ? await getBaselineCounts(prisma)
      : {
        ...before,
        users: before.users + (outcome === "created" ? 1 : 0),
      };

    if (config.mode === "apply") {
      const finalIdentity = await getExistingIdentity(prisma, config.firebaseUid);
      if (!finalIdentity) {
        throw new Error("The PostgreSQL application user was not found after bootstrap.");
      }

      evaluateExistingIdentity(finalIdentity, config);

      if (await getActiveAdminCount(prisma) < 1) {
        throw new Error("The PostgreSQL lockout invariant failed: no active IT Administrator exists.");
      }

      assertNoBusinessGrowth(before, after);
    }

    console.log(`DB-SEED-011A ${config.mode} PASS.`);
    console.log(`Application user: ${outcome === "created" ? (config.mode === "apply" ? "created" : "would be created") : "validated / no-op"}.`);
    console.log(`Firebase UID: ${config.mode === "apply" ? "configured / verified through PostgreSQL" : "configured / mapping projected only"}.`);
    console.log("Role: IT Administrator.");
    console.log(`Admin permissions: ${role.permissionCount} persisted technical permissions validated.`);
    console.log("Enabled: yes.");
    console.log("Employee link: none.");
    console.log(`Admin lockout protection: ${projectedActiveAdminCount} active IT Administrator(s) after this ${config.mode}.`);
    printCounts(config.mode === "apply" ? "Post-bootstrap baseline" : "Current / projected baseline", after);
    console.log("Firestore modified: no.");
    console.log("Firebase Authentication: retained; no password was requested or stored.");
    console.log("Supabase Auth: not used.");
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<number> {
  const config = parseBootstrapConfig(process.argv.slice(2));

  if (config.showHelp) {
    console.log(helpText);
    return 0;
  }

  if (config.selfCheck) {
    runSelfCheck();
    return 0;
  }

  await runBootstrap(config);
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Admin bootstrap failed.";
    console.error(`DB-SEED-011A FAILED: ${message}`);
    process.exitCode = 1;
  });
