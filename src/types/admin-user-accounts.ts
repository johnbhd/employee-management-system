import type { ApplicationRole } from "@/lib/auth/roles";
import type { ApplicationUserStatus } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

export type AdminAccountAuthStatus = "active" | "disabled" | "missing";
export type AdminAccountProfileStatus = "valid" | "missing";
export type AdminAccountLinkStatus = "linked" | "unlinked" | "invalid";

export type AdminUserAccount = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string;
  username: string | null;
  role: ApplicationRole | null;
  employeeId: string | null;
  employee: EmployeeReference | null;
  authStatus: AdminAccountAuthStatus;
  profileStatus: AdminAccountProfileStatus;
  applicationStatus: ApplicationUserStatus | null;
  linkStatus: AdminAccountLinkStatus;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export type AdminUserAccountAuditEvent = {
  id: string;
  action: "created" | "profile_updated" | "enabled" | "disabled";
  actorUid: string;
  actorDisplayName: string;
  targetUid: string;
  targetDisplayName: string;
  changes: Array<{ field: string; from: string | null; to: string | null }>;
  occurredAt: string;
};

export type AdminUserAccountsData = {
  items: AdminUserAccount[];
  employees: EmployeeReference[];
  auditEvents: AdminUserAccountAuditEvent[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    linked: number;
    integrityIssues: number;
  };
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
};

export type AdminUserAccountSummary = {
  total: number;
  active: number;
  disabled: number;
  linked: number;
  integrityIssues: number;
  roleCounts: Array<{
    roleId: ApplicationRole;
    memberCount: number;
  }>;
};

export type AdminUserAccountCreateInput = {
  email: string;
  password: string;
  username: string;
  displayName: string;
  role: ApplicationRole;
  employeeId: string | null;
};

export type AdminUserAccountUpdateInput = {
  username?: string;
  displayName?: string;
  role?: ApplicationRole;
  employeeId?: string | null;
  disabled?: boolean;
};
