import "server-only";

import type { UserRecord } from "firebase-admin/auth";

import { applicationRoleDefinitions } from "@/lib/auth/permissions";
import { isApplicationRole, type ApplicationRole } from "@/lib/auth/roles";
import { getFirebaseAdminAuth } from "@/lib/firebase/server";
import type { EmployeeReference } from "@/types/employee";
import type {
  AdminUserAccount,
  AdminUserAccountCreateInput,
  AdminUserAccountUpdateInput,
  AdminUserAccountSummary,
  AdminUserAccountsData,
} from "@/types/admin-user-accounts";

import { writeAdminUserAccountAuditEvent } from "@/server/repositories/admin-user-account-audit/admin-user-account-audit.repository";
import {
  createApplicationUserProfile,
  deleteApplicationUserProfile,
  getApplicationUserByUid,
  listApplicationUsers,
  updateApplicationUserProfile,
} from "@/server/repositories/users/user.repository";
import {
  getEmployeeById,
  listEmployees,
} from "@/server/repositories/employees/employee.repository";
import { listAdminUserAccountAuditEvents } from "@/server/repositories/admin-user-account-audit/admin-user-account-audit.repository";

export class AdminUserAccountError extends Error {
  readonly code: string;
  readonly status: 400 | 404 | 409;

  constructor(code: string, message: string, status: 400 | 404 | 409) {
    super(message);
    this.name = "AdminUserAccountError";
    this.code = code;
    this.status = status;
  }
}

type AccountListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: ApplicationRole;
  status?: "active" | "disabled" | "missing";
  link?: "linked" | "unlinked" | "invalid";
};

type Actor = {
  uid: string;
  displayName: string;
  role: ApplicationRole;
};

function cleanString(value: unknown, field: string, maxLength = 120): string {
  if (typeof value !== "string") {
    throw new AdminUserAccountError("INVALID_INPUT", `${field} is required.`, 400);
  }

  const cleaned = value.trim();

  if (!cleaned || cleaned.length > maxLength) {
    throw new AdminUserAccountError("INVALID_INPUT", `${field} is invalid.`, 400);
  }

  return cleaned;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return cleanString(value, field, 80);
}

function validateEmail(value: unknown): string {
  const email = cleanString(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AdminUserAccountError("INVALID_INPUT", "Enter a valid email address.", 400);
  }
  return email;
}

function validateRole(value: unknown): ApplicationRole {
  if (!isApplicationRole(value)) {
    throw new AdminUserAccountError("INVALID_ROLE", "Select a supported application role.", 400);
  }
  return value;
}

function validatePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 6) {
    throw new AdminUserAccountError(
      "INVALID_PASSWORD",
      "The temporary password must contain at least 6 characters.",
      400,
    );
  }
  return value;
}

function authDate(value: string | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

function authStatus(record: UserRecord | null): AdminUserAccount["authStatus"] {
  if (!record) return "missing";
  return record.disabled ? "disabled" : "active";
}

function linkStatus(
  profile: Awaited<ReturnType<typeof listApplicationUsers>>[number] | null,
  employee: EmployeeReference | null,
): AdminUserAccount["linkStatus"] {
  if (!profile?.employeeId) return "unlinked";
  return employee ? "linked" : "invalid";
}

function toAccount(
  authRecord: UserRecord | null,
  profile: Awaited<ReturnType<typeof listApplicationUsers>>[number] | null,
  employee: EmployeeReference | null,
): AdminUserAccount {
  return {
    uid: authRecord?.uid ?? profile?.uid ?? "",
    email: authRecord?.email ?? null,
    emailVerified: authRecord?.emailVerified ?? false,
    displayName: profile?.displayName ?? authRecord?.displayName ?? "Unnamed account",
    username: profile?.username ?? null,
    role: profile?.role ?? null,
    employeeId: profile?.employeeId ?? null,
    employee,
    authStatus: authStatus(authRecord),
    profileStatus: profile ? "valid" : "missing",
    applicationStatus: profile?.status ?? null,
    linkStatus: linkStatus(profile, employee),
    createdAt: authDate(authRecord?.metadata.creationTime),
    lastSignInAt: authDate(authRecord?.metadata.lastSignInTime),
  };
}

async function listAllAuthUsers(): Promise<UserRecord[]> {
  const auth = getFirebaseAdminAuth();
  const records: UserRecord[] = [];
  let pageToken: string | undefined;

  do {
    const result = await auth.listUsers(1000, pageToken);
    records.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  return records;
}

async function buildAccounts(): Promise<AdminUserAccount[]> {
  const [authUsers, profiles, employees] = await Promise.all([
    listAllAuthUsers(),
    listApplicationUsers(),
    listEmployees(),
  ]);
  const authByUid = new Map(authUsers.map((record) => [record.uid, record]));
  const profileByUid = new Map(profiles.map((profile) => [profile.uid, profile]));
  const employeeById = new Map(employees.map((employee) => [employee.employeeId, employee]));
  const ids = new Set([...authByUid.keys(), ...profileByUid.keys()]);

  return [...ids]
    .map((uid) => {
      const profile = profileByUid.get(uid) ?? null;
      const authRecord = authByUid.get(uid) ?? null;
      const employee = profile?.employeeId ? employeeById.get(profile.employeeId) ?? null : null;
      return toAccount(authRecord, profile, employee);
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

function matchesQuery(account: AdminUserAccount, query: AccountListQuery): boolean {
  const search = query.search?.trim().toLowerCase();
  const matchesSearch = !search || [
    account.displayName,
    account.email,
    account.username,
    account.uid,
    account.employeeId,
    account.employee?.department,
  ].some((value) => value?.toLowerCase().includes(search));

  return matchesSearch
    && (!query.role || account.role === query.role)
    && (!query.status || account.authStatus === query.status)
    && (!query.link || account.linkStatus === query.link);
}

function summaryFor(accounts: readonly AdminUserAccount[]) {
  return {
    total: accounts.length,
    active: accounts.filter((account) => account.authStatus === "active" && account.applicationStatus === "active").length,
    disabled: accounts.filter((account) => account.authStatus === "disabled").length,
    linked: accounts.filter((account) => account.linkStatus === "linked").length,
    integrityIssues: accounts.filter((account) => (
      account.profileStatus === "missing" || account.linkStatus === "invalid"
    )).length,
    roleCounts: applicationRoleDefinitions.map((role) => ({
      roleId: role.id,
      memberCount: accounts.filter((account) => account.role === role.id).length,
    })),
  };
}

export async function getAdminUserAccountSummary(): Promise<AdminUserAccountSummary> {
  const accounts = await buildAccounts();
  return summaryFor(accounts);
}

export async function getAdminUserAccountsData(
  query: AccountListQuery = {},
): Promise<AdminUserAccountsData> {
  const [accounts, employees, auditEvents] = await Promise.all([
    buildAccounts(),
    listEmployees(),
    listAdminUserAccountAuditEvents(),
  ]);
  const filtered = accounts.filter((account) => matchesQuery(account, query));
  const pageSize = Math.min(Math.max(query.pageSize ?? 10, 5), 50);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(query.page ?? 1, 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    employees,
    auditEvents,
    summary: summaryFor(accounts),
    page,
    pageSize,
    total: filtered.length,
    totalPages,
    hasNext: page < totalPages,
  };
}

async function requireTarget(uid: string) {
  const [authRecord, profile] = await Promise.all([
    getFirebaseAdminAuth().getUser(uid).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
        return null;
      }
      throw error;
    }),
    getApplicationUserByUid(uid),
  ]);

  if (!authRecord && !profile) {
    throw new AdminUserAccountError("ACCOUNT_NOT_FOUND", "The account could not be found.", 404);
  }

  return { authRecord, profile };
}

async function ensureEmployeeLinkIsValid(
  employeeId: string | null,
  targetUid: string | null,
): Promise<EmployeeReference | null> {
  if (!employeeId) return null;

  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    throw new AdminUserAccountError(
      "EMPLOYEE_NOT_FOUND",
      "Select an existing employee record. User Accounts cannot create HRPS employees.",
      400,
    );
  }

  const profiles = await listApplicationUsers();
  const duplicate = profiles.find((profile) => (
    profile.employeeId === employeeId && profile.uid !== targetUid && profile.status === "active"
  ));
  if (duplicate) {
    throw new AdminUserAccountError(
      "EMPLOYEE_ALREADY_LINKED",
      "That employee is already linked to another active application account.",
      409,
    );
  }

  return employee;
}

async function ensureUsernameIsAvailable(username: string, targetUid: string | null) {
  const profiles = await listApplicationUsers();
  if (profiles.some((profile) => profile.username.toLowerCase() === username.toLowerCase() && profile.uid !== targetUid)) {
    throw new AdminUserAccountError(
      "USERNAME_ALREADY_EXISTS",
      "That username is already assigned to another application account.",
      409,
    );
  }
}

async function activeAdminCount(): Promise<number> {
  const [profiles, authUsers] = await Promise.all([listApplicationUsers(), listAllAuthUsers()]);
  const enabledUids = new Set(authUsers.filter((record) => !record.disabled).map((record) => record.uid));
  return profiles.filter((profile) => profile.role === "admin" && enabledUids.has(profile.uid)).length;
}

function assertAdminSelfProtection(actor: Actor, targetUid: string, nextRole?: ApplicationRole, disable?: boolean) {
  if (actor.uid === targetUid && (nextRole && nextRole !== "admin" || disable === true)) {
    throw new AdminUserAccountError(
      "SELF_PROTECTION",
      "You cannot remove or disable your own IT Administrator access.",
      409,
    );
  }
}

export async function createAdminUserAccount(
  actor: Actor,
  input: AdminUserAccountCreateInput,
) {
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);
  const username = cleanString(input.username, "Username", 80).toLowerCase();
  const displayName = cleanString(input.displayName, "Display name");
  const role = validateRole(input.role);
  const employeeId = nullableString(input.employeeId, "Employee link");

  await ensureUsernameIsAvailable(username, null);
  if (role === "employee" && !employeeId) {
    throw new AdminUserAccountError("EMPLOYEE_LINK_REQUIRED", "Employee accounts must be linked to an existing employee record.", 400);
  }
  await ensureEmployeeLinkIsValid(employeeId, null);

  let record: UserRecord;
  try {
    record = await getFirebaseAdminAuth().createUser({
      email,
      password,
      displayName,
      disabled: false,
    });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "auth/email-already-exists") {
      throw new AdminUserAccountError("EMAIL_ALREADY_EXISTS", "That email is already registered in Firebase Authentication.", 409);
    }
    throw error;
  }

  try {
    await createApplicationUserProfile(record.uid, {
      username,
      displayName,
      role,
      employeeId,
    });
    await writeAdminUserAccountAuditEvent({
      action: "created",
      actor,
      target: { uid: record.uid, displayName },
      changes: [
        { field: "role", from: null, to: role },
        { field: "employeeId", from: null, to: employeeId },
      ],
    });
  } catch (error) {
    await getFirebaseAdminAuth().deleteUser(record.uid).catch(() => undefined);
    throw error;
  }

  const data = await getAdminUserAccountsData({ search: record.uid, pageSize: 1 });
  return data.items[0] ?? toAccount(record, null, null);
}

export async function updateAdminUserAccount(
  actor: Actor,
  uid: string,
  input: AdminUserAccountUpdateInput,
) {
  const target = await requireTarget(uid);
  const currentProfile = target.profile;
  const nextRole = input.role === undefined ? currentProfile?.role : validateRole(input.role);
  const nextDisplayName = input.displayName === undefined
    ? currentProfile?.displayName ?? target.authRecord?.displayName ?? "Unnamed account"
    : cleanString(input.displayName, "Display name");
  const nextUsername = input.username === undefined
    ? currentProfile?.username ?? ""
    : cleanString(input.username, "Username", 80).toLowerCase();
  const nextEmployeeId = input.employeeId === undefined
    ? currentProfile?.employeeId ?? null
    : nullableString(input.employeeId, "Employee link");

  if (!currentProfile && input.disabled === undefined) {
    throw new AdminUserAccountError("PROFILE_MISSING", "This Firebase account has no valid application profile yet.", 409);
  }
  if (!nextRole) {
    throw new AdminUserAccountError("INVALID_ROLE", "The account has no valid application role.", 400);
  }
  if (nextRole === "employee" && !nextEmployeeId) {
    throw new AdminUserAccountError("EMPLOYEE_LINK_REQUIRED", "Employee accounts must be linked to an existing employee record.", 400);
  }
  assertAdminSelfProtection(actor, uid, nextRole, input.disabled);
  if (input.role !== undefined && currentProfile?.role === "admin" && nextRole !== "admin" && await activeAdminCount() <= 1) {
    throw new AdminUserAccountError("LAST_ADMIN_PROTECTION", "The last active IT Administrator cannot be demoted.", 409);
  }
  if (input.disabled === true && currentProfile?.role === "admin" && await activeAdminCount() <= 1) {
    throw new AdminUserAccountError("LAST_ADMIN_PROTECTION", "The last active IT Administrator cannot be disabled.", 409);
  }

  if (input.username !== undefined) await ensureUsernameIsAvailable(nextUsername, uid);
  if (input.employeeId !== undefined || input.role === "employee") {
    await ensureEmployeeLinkIsValid(nextEmployeeId, uid);
  }

  const changes = [] as Array<{ field: string; from: string | null; to: string | null }>;
  const targetDisplayName = currentProfile?.displayName ?? target.authRecord?.displayName ?? "Unnamed account";

  if (currentProfile && (input.username !== undefined || input.displayName !== undefined || input.role !== undefined || input.employeeId !== undefined)) {
    if (input.username !== undefined && currentProfile.username !== nextUsername) changes.push({ field: "username", from: currentProfile.username, to: nextUsername });
    if (input.displayName !== undefined && currentProfile.displayName !== nextDisplayName) changes.push({ field: "displayName", from: currentProfile.displayName, to: nextDisplayName });
    if (input.role !== undefined && currentProfile.role !== nextRole) changes.push({ field: "role", from: currentProfile.role, to: nextRole });
    if (input.employeeId !== undefined && currentProfile.employeeId !== nextEmployeeId) changes.push({ field: "employeeId", from: currentProfile.employeeId, to: nextEmployeeId });
    await updateApplicationUserProfile(uid, {
      username: nextUsername,
      displayName: nextDisplayName,
      role: nextRole,
      employeeId: nextEmployeeId,
    });
    if (target.authRecord && input.displayName !== undefined && target.authRecord.displayName !== nextDisplayName) {
      await getFirebaseAdminAuth().updateUser(uid, { displayName: nextDisplayName });
    }
  }

  if (input.disabled !== undefined && target.authRecord) {
    const wasDisabled = target.authRecord.disabled;
    if (wasDisabled !== input.disabled) {
      await getFirebaseAdminAuth().updateUser(uid, { disabled: input.disabled });
      await updateApplicationUserProfile(uid, { status: input.disabled ? "disabled" : "active" });
      await writeAdminUserAccountAuditEvent({
        action: input.disabled ? "disabled" : "enabled",
        actor,
        target: { uid, displayName: targetDisplayName },
        changes: [{ field: "disabled", from: String(wasDisabled), to: String(input.disabled) }],
      });
    }
  }

  if (changes.length > 0) {
    await writeAdminUserAccountAuditEvent({
      action: "profile_updated",
      actor,
      target: { uid, displayName: nextDisplayName },
      changes,
    });
  }

  const refreshed = await getAdminUserAccountsData({ search: uid, pageSize: 1 });
  return refreshed.items[0] ?? null;
}

export async function getAdminUserAccount(uid: string) {
  const target = await requireTarget(uid);
  const employee = target.profile?.employeeId ? await getEmployeeById(target.profile.employeeId) : null;
  return toAccount(target.authRecord, target.profile, employee);
}

export { deleteApplicationUserProfile };
