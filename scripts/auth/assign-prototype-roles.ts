import { loadEnvConfig } from "@next/env";
import { PrismaClient, type ApplicationRoleCode } from "@prisma/client";

loadEnvConfig(process.cwd());

type PrototypeRoleAssignment = {
  employeeId: string;
  expectedDepartment: string;
  role: ApplicationRoleCode;
};

const prototypeAssignments: readonly PrototypeRoleAssignment[] = [
  {
    employeeId: "013",
    expectedDepartment: "Payroll",
    role: "payroll",
  },
  {
    employeeId: "014",
    expectedDepartment: "Accounting",
    role: "accounting",
  },
  {
    employeeId: "034",
    expectedDepartment: "Human Resources",
    role: "hr",
  },
];

const requiredRoleCodes: readonly ApplicationRoleCode[] = [
  "admin",
  "hr",
  "employee",
  "payroll",
  "accounting",
];

type AssignmentTarget = {
  assignment: PrototypeRoleAssignment;
  user: {
    id: string;
    firebaseUid: string;
    username: string;
    displayName: string;
    status: "active" | "inactive" | "disabled";
    role: {
      id: string;
      code: ApplicationRoleCode;
      label: string;
    };
    employee: {
      id: string;
      employeeId: string;
      displayName: string;
      department: string;
      position: string | null;
    };
  };
  nextRole: {
    id: string;
    code: ApplicationRoleCode;
    label: string;
  };
};

function isApplyMode(argv: readonly string[]): boolean {
  if (argv.includes("--dry-run") && argv.includes("--apply")) {
    throw new Error("Choose either --dry-run or --apply, not both.");
  }

  return argv.includes("--apply");
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured; prototype role assignment did not start.");
  }

  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });
}

async function requireCanonicalRoles(prisma: PrismaClient) {
  const roles = await prisma.applicationRole.findMany({
    where: { code: { in: [...requiredRoleCodes] } },
    select: {
      id: true,
      code: true,
      label: true,
    },
  });
  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const missing = requiredRoleCodes.filter((code) => !roleByCode.has(code));

  if (missing.length > 0) {
    throw new Error(`Canonical application roles are missing: ${missing.join(", ")}.`);
  }

  return roleByCode;
}

async function requireAdminActor(prisma: PrismaClient) {
  const admins = await prisma.user.findMany({
    where: {
      status: "active",
      employeeId: null,
      role: { code: "admin" },
    },
    select: {
      id: true,
      firebaseUid: true,
      username: true,
      displayName: true,
      role: { select: { code: true } },
    },
  });

  if (admins.length !== 1) {
    throw new Error(`Expected exactly one active unlinked IT Administrator; found ${admins.length}.`);
  }

  return admins[0];
}

async function resolveTargets(
  prisma: PrismaClient,
  roleByCode: Awaited<ReturnType<typeof requireCanonicalRoles>>,
): Promise<AssignmentTarget[]> {
  const targets: AssignmentTarget[] = [];

  for (const assignment of prototypeAssignments) {
    const employee = await prisma.employee.findUnique({
      where: { employeeId: assignment.employeeId },
      select: {
        id: true,
        employeeId: true,
        displayName: true,
        department: true,
        position: true,
      },
    });

    if (!employee) {
      throw new Error(`Employee ${assignment.employeeId} does not exist in PostgreSQL.`);
    }

    if (employee.department.toLowerCase() !== assignment.expectedDepartment.toLowerCase()) {
      throw new Error(
        `Employee ${assignment.employeeId} is in ${employee.department}, not ${assignment.expectedDepartment}; no role was assigned.`,
      );
    }

    const users = await prisma.user.findMany({
      where: { employeeId: employee.id },
      select: {
        id: true,
        firebaseUid: true,
        username: true,
        displayName: true,
        status: true,
        role: { select: { id: true, code: true, label: true } },
        employee: { select: { id: true, employeeId: true, displayName: true, department: true, position: true } },
      },
    });

    if (users.length !== 1) {
      throw new Error(`Employee ${assignment.employeeId} must have exactly one linked application user.`);
    }

    const user = users[0];
    if (!user || !user.employee) {
      throw new Error(`Employee ${assignment.employeeId} must have exactly one linked application user.`);
    }

    const linkedUser = { ...user, employee: user.employee };

    if (linkedUser.status !== "active") {
      throw new Error(`Employee ${assignment.employeeId}'s account is not active; no role was assigned.`);
    }

    if (linkedUser.role.code !== "employee" && linkedUser.role.code !== assignment.role) {
      throw new Error(
        `Employee ${assignment.employeeId} already has role ${linkedUser.role.code}; refusing to overwrite it.`,
      );
    }

    const nextRole = roleByCode.get(assignment.role);
    if (!nextRole) {
      throw new Error(`The target role ${assignment.role} is not configured.`);
    }

    targets.push({ assignment, user: linkedUser, nextRole });
  }

  return targets;
}

function printPlan(
  actor: { username: string; displayName: string },
  targets: readonly AssignmentTarget[],
  mode: "dry-run" | "apply",
): void {
  console.log(`AUTH-RBAC-015E-PRE ${mode} plan`);
  console.log(`Actor: ${actor.displayName} (${actor.username})`);

  for (const target of targets) {
    const action = target.user.role.code === target.assignment.role ? "already assigned" : "assign";
    console.log(
      `Employee ${target.assignment.employeeId}: ${target.user.displayName} | ${target.user.role.label} -> ${target.nextRole.label} | ${action}`,
    );
    console.log(`  Existing Firebase UID bridge: ${target.user.firebaseUid}`);
    console.log(`  HRPS department remains: ${target.user.employee.department}`);
  }
}

async function applyAssignments(
  prisma: PrismaClient,
  actor: Awaited<ReturnType<typeof requireAdminActor>>,
  targets: readonly AssignmentTarget[],
): Promise<number> {
  let changed = 0;

  await prisma.$transaction(async (transaction) => {
    for (const target of targets) {
      const current = await transaction.user.findUnique({
        where: { id: target.user.id },
        select: {
          firebaseUid: true,
          role: { select: { code: true } },
        },
      });

      if (!current) {
        throw new Error(`Employee ${target.assignment.employeeId}'s application user disappeared before assignment.`);
      }

      if (current.firebaseUid !== target.user.firebaseUid) {
        throw new Error(`Employee ${target.assignment.employeeId}'s Firebase UID bridge changed; no role was assigned.`);
      }

      if (current.role.code === target.assignment.role) {
        continue;
      }

      if (current.role.code !== "employee") {
        throw new Error(
          `Employee ${target.assignment.employeeId} changed to role ${current.role.code}; refusing to overwrite it.`,
        );
      }

      await transaction.user.update({
        where: { id: target.user.id },
        data: { roleId: target.nextRole.id },
      });

      await transaction.auditEvent.create({
        data: {
          eventType: "admin.user.role_changed",
          action: "role_changed",
          module: "User Accounts",
          actorType: "user",
          actorUserId: actor.id,
          actorUid: actor.firebaseUid,
          actorSnapshot: {
            uid: actor.firebaseUid,
            username: actor.username,
            displayName: actor.displayName,
            role: actor.role.code,
          },
          targetType: "user_account",
          targetId: target.user.firebaseUid,
          targetReference: target.user.firebaseUid,
          targetLabel: target.user.displayName,
          targetSnapshot: {
            firebaseUid: target.user.firebaseUid,
            employeeId: target.assignment.employeeId,
            department: target.user.employee.department,
            role: target.assignment.role,
          },
          outcome: "Successful",
          summary: "An existing employee application account was assigned an operational role.",
          metadata: {
            changes: [{ field: "role", from: "employee", to: target.assignment.role }],
            targetUid: target.user.firebaseUid,
            targetDisplayName: target.user.displayName,
            employeeId: target.assignment.employeeId,
            department: target.user.employee.department,
          },
          occurredAt: new Date(),
        },
      });

      changed += 1;
    }
  });

  return changed;
}

async function main(): Promise<void> {
  const mode = isApplyMode(process.argv.slice(2)) ? "apply" : "dry-run";
  const prisma = createPrismaClient();

  try {
    const roleByCode = await requireCanonicalRoles(prisma);
    const actor = await requireAdminActor(prisma);
    const targets = await resolveTargets(prisma, roleByCode);

    printPlan(actor, targets, mode);

    if (mode === "dry-run") {
      console.log("No PostgreSQL rows were changed. Re-run with --apply to assign these roles.");
      return;
    }

    const changed = await applyAssignments(prisma, actor, targets);
    console.log(`AUTH-RBAC-015E-PRE apply PASS: ${changed} role assignment(s) changed; existing assignments were left unchanged.`);
    console.log("Firebase Authentication identities, employee links, departments, and credentials were not changed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Prototype role assignment failed.";
  console.error(`AUTH-RBAC-015E-PRE FAILED: ${message}`);
  process.exitCode = 1;
});
