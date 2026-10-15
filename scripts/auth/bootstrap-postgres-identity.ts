import { loadEnvConfig } from "@next/env";
import { Prisma, PrismaClient, type PrismaClient as PrismaClientType } from "@prisma/client";
import type { UserRecord } from "firebase-admin/auth";
import type { DocumentData } from "firebase-admin/firestore";

import { getFirebaseAdminAuth } from "../../src/lib/firebase/server/runtime";
import { getFirebaseAdminDb } from "../../src/lib/firebase/server/legacy-firestore";
import { isApplicationRole, type ApplicationRole } from "../../src/lib/auth/roles";

loadEnvConfig(process.cwd());

let prismaClient: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (prismaClient) return prismaClient;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

  prismaClient = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  return prismaClient;
}

type IdentityCandidate = {
  auth: UserRecord;
  username: string;
  displayName: string;
  role: ApplicationRole;
  employee: {
    employeeId: string;
    displayName: string;
    department: string;
    position: string | null;
    employmentStatus: "active" | "inactive";
  } | null;
  status: "active" | "inactive" | "disabled";
};

function requiredString(data: DocumentData, field: string): string | null {
  const value = data[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nullableString(data: DocumentData, field: string): string | null | undefined {
  const value = data[field];
  if (value === null || value === undefined) return null;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function applicationStatus(value: unknown): "active" | "inactive" | "disabled" | null {
  return value === "active" || value === "inactive" || value === "disabled"
    ? value
    : null;
}

function employeeStatus(value: unknown): "active" | "inactive" | null {
  return value === "active" || value === "inactive" ? value : null;
}

async function listAuthUsers(): Promise<UserRecord[]> {
  const auth = getFirebaseAdminAuth();
  const users: UserRecord[] = [];
  let pageToken: string | undefined;

  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  return users;
}

async function readCandidate(auth: UserRecord): Promise<IdentityCandidate | null> {
  const snapshot = await getFirebaseAdminDb().collection("users").doc(auth.uid).get();

  if (!snapshot.exists) return null;

  const data = snapshot.data();
  if (!data) return null;

  const username = requiredString(data, "username");
  const displayName = requiredString(data, "displayName");
  const employeeId = nullableString(data, "employeeId");
  const role = data.role;
  const status = applicationStatus(data.status);

  if (
    !username
    || !displayName
    || !isApplicationRole(role)
    || employeeId === undefined
    || !status
  ) {
    throw new Error(`The Firebase application profile for ${auth.uid} is invalid.`);
  }

  let employee: IdentityCandidate["employee"] = null;

  if (employeeId) {
    const employeeSnapshot = await getFirebaseAdminDb()
      .collection("employees")
      .doc(employeeId)
      .get();
    const employeeData = employeeSnapshot.data();
    const employeeName = employeeData ? requiredString(employeeData, "displayName") : null;
    const department = employeeData ? requiredString(employeeData, "department") : null;
    const position = employeeData ? nullableString(employeeData, "position") : null;
    const employment = employeeData ? employeeStatus(employeeData.employmentStatus) : null;

    if (
      !employeeSnapshot.exists
      || !employeeData
      || !employeeName
      || !department
      || position === undefined
      || !employment
    ) {
      throw new Error(`The Firebase application profile for ${auth.uid} references an invalid employee.`);
    }

    employee = {
      employeeId,
      displayName: employeeName,
      department,
      position,
      employmentStatus: employment,
    };
  }

  return {
    auth,
    username,
    displayName,
    role,
    employee,
    status: auth.disabled ? "disabled" : status,
  };
}

function sameValue(left: string | null, right: string | null): boolean {
  return left === right;
}

async function reconcileCandidate(
  candidate: IdentityCandidate,
  apply: boolean,
  prisma: PrismaClientType | Prisma.TransactionClient = getPrismaClient(),
): Promise<"created" | "unchanged" | "updated"> {
  const role = await prisma.applicationRole.findUnique({
    where: { code: candidate.role },
    select: { id: true },
  });

  if (!role) {
    throw new Error(`The PostgreSQL role ${candidate.role} is not configured.`);
  }

  const existing = await prisma.user.findUnique({
    where: { firebaseUid: candidate.auth.uid },
    include: { role: true, employee: true },
  });
  const usernameOwner = await prisma.user.findUnique({
    where: { username: candidate.username },
    select: { id: true },
  });

  if (usernameOwner && usernameOwner.id !== existing?.id) {
    throw new Error(`Username conflict detected for ${candidate.username}.`);
  }

  if (candidate.employee) {
    const employeeOwner = await prisma.user.findFirst({
      where: {
        status: "active",
        employee: { employeeId: candidate.employee.employeeId },
        ...(existing ? { id: { not: existing.id } } : {}),
      },
      select: { id: true },
    });

    if (employeeOwner) {
      throw new Error(`Employee mapping conflict detected for ${candidate.employee.employeeId}.`);
    }
  }

  let employeeId: string | null = null;
  if (candidate.employee) {
    const employee = apply
      ? await prisma.employee.upsert({
        where: { employeeId: candidate.employee.employeeId },
        create: {
          employeeId: candidate.employee.employeeId,
          displayName: candidate.employee.displayName,
          department: candidate.employee.department,
          position: candidate.employee.position,
          employmentStatus: candidate.employee.employmentStatus,
          sourceSystem: "HRPS",
          dataSource: "identity-bootstrap",
        },
        update: {
          displayName: candidate.employee.displayName,
          department: candidate.employee.department,
          position: candidate.employee.position,
          employmentStatus: candidate.employee.employmentStatus,
          sourceSystem: "HRPS",
          dataSource: "identity-bootstrap",
        },
      })
      : await prisma.employee.findUnique({
        where: { employeeId: candidate.employee.employeeId },
        select: { id: true },
      });

    if (employee) employeeId = employee.id;
  }

  if (existing) {
    const same = (
      existing.username === candidate.username
      && existing.displayName === candidate.displayName
      && existing.role.code === candidate.role
      && existing.status === candidate.status
      && sameValue(existing.employee?.employeeId ?? null, candidate.employee?.employeeId ?? null)
    );

    if (same) return "unchanged";

    throw new Error(`PostgreSQL identity conflict detected for Firebase user ${candidate.auth.uid}.`);
  }

  if (!apply) return "created";

  await prisma.user.create({
    data: {
      firebaseUid: candidate.auth.uid,
      username: candidate.username,
      displayName: candidate.displayName,
      status: candidate.status,
      role: { connect: { id: role.id } },
      employee: employeeId ? { connect: { id: employeeId } } : undefined,
    },
  });

  return "created";
}

async function assertNoActiveEmployeeConflicts(): Promise<void> {
  const conflicts = await getPrismaClient().$queryRaw<Array<{ employee_id: string; total: bigint }>>`
    SELECT employee_id, COUNT(*) AS total
    FROM users
    WHERE employee_id IS NOT NULL AND status = 'active'
    GROUP BY employee_id
    HAVING COUNT(*) > 1
  `;

  if (conflicts.length) {
    throw new Error("PostgreSQL contains multiple active application users for one employee.");
  }
}

async function verifyAdminMapping(authUsers: readonly UserRecord[]): Promise<void> {
  const enabledUids = authUsers.filter((user) => !user.disabled).map((user) => user.uid);
  const admin = await getPrismaClient().user.findFirst({
    where: {
      firebaseUid: { in: enabledUids },
      status: "active",
      role: { code: "admin" },
    },
    select: { id: true },
  });

  if (!admin) {
    throw new Error("No enabled Firebase user is mapped to an active IT Administrator in PostgreSQL.");
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const authUsers = await listAuthUsers();
  const candidates = (await Promise.all(authUsers.map(readCandidate)))
    .filter((candidate): candidate is IdentityCandidate => Boolean(candidate));

  if (!candidates.length) {
    throw new Error("No valid Firebase application profiles were found for bootstrap.");
  }

  const usernames = new Set<string>();
  const employeeIds = new Set<string>();
  for (const candidate of candidates) {
    if (usernames.has(candidate.username)) {
      throw new Error(`Duplicate Firebase application username ${candidate.username}.`);
    }
    usernames.add(candidate.username);

    if (candidate.employee && employeeIds.has(candidate.employee.employeeId)) {
      throw new Error(`Duplicate active employee mapping ${candidate.employee.employeeId}.`);
    }
    if (candidate.employee) employeeIds.add(candidate.employee.employeeId);
  }

  const results = { created: 0, unchanged: 0, updated: 0 };
  await assertNoActiveEmployeeConflicts();

  if (apply) {
    await getPrismaClient().$transaction(async (transaction) => {
      for (const candidate of candidates) {
        const result = await reconcileCandidate(candidate, true, transaction);
        results[result] += 1;
      }
    });
  } else {
    for (const candidate of candidates) {
      const result = await reconcileCandidate(candidate, false);
      results[result] += 1;
    }
  }

  await assertNoActiveEmployeeConflicts();
  if (apply) {
    await verifyAdminMapping(authUsers);
  } else if (!candidates.some((candidate) => (
    candidate.role === "admin"
    && candidate.status === "active"
    && !candidate.auth.disabled
  ))) {
    throw new Error("The bootstrap input does not contain an enabled IT Administrator mapping.");
  }

  console.log(`PostgreSQL identity bootstrap ${apply ? "applied" : "dry run"}.`);
  console.log(`Firebase profiles considered: ${candidates.length}.`);
  console.log(`Created: ${results.created}; updated: ${results.updated}; unchanged: ${results.unchanged}.`);
  console.log(`${apply ? "Verified" : "Previewed"}: at least one enabled Firebase identity maps to an active IT Administrator.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Identity bootstrap failed.";
  console.error(message);
  process.exitCode = 1;
});
