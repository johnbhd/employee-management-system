import type { ApplicationRole } from "@/lib/auth/roles";

export const permissionCategories = [
  "Employee Self-Service",
  "HR & Attendance",
  "Payroll Integration",
  "Accounting Integration",
  "Integration Monitoring",
  "User Administration",
  "Security & Permissions",
  "Audit & Logs",
  "System Settings",
] as const;

export type PermissionCategory = typeof permissionCategories[number];

export const permissionKeys = [
  "employee.dashboard.view",
  "employee.attendance.view_own",
  "employee.attendance.history.view_own",
  "employee.attendance_qr.view_own",
  "employee.payslip.view_own",
  "employee.profile.view_own",
  "hr.dashboard.view",
  "hr.attendance.view",
  "hr.attendance.reports.view",
  "hr.correction.view",
  "hr.correction.review",
  "hr.attendance.verify",
  "hr.attendance.scan",
  "hr.employee_directory.view",
  "hr.schedule.view",
  "hr.schedule.manage",
  "hr.audit_history.view",
  "payroll.dashboard.view",
  "payroll.verified_attendance.view",
  "payroll.batch.view",
  "payroll.batch.manage",
  "payroll.handoff.view",
  "payroll.handoff.submit",
  "payroll.result.view",
  "payroll.history.view",
  "accounting.dashboard.view",
  "accounting.approved_payroll.view",
  "accounting.transfer.view",
  "accounting.transfer.prepare",
  "accounting.transfer.submit",
  "accounting.transfer.acknowledge",
  "accounting.history.view",
  "admin.dashboard.view",
  "admin.integration_monitoring.view",
  "admin.integration_monitoring.retry",
  "admin.user_accounts.view",
  "admin.user_accounts.manage",
  "admin.roles_permissions.view",
  "admin.roles_permissions.manage",
  "admin.audit_logs.view",
  "admin.settings.view",
  "admin.settings.manage",
] as const;

export type PermissionKey = typeof permissionKeys[number];

export type PermissionDefinition = {
  key: PermissionKey;
  label: string;
  description: string;
  category: PermissionCategory;
  requiredForRoles?: readonly ApplicationRole[];
  dependsOn?: readonly PermissionKey[];
};

export type ApplicationRoleDefinition = {
  id: ApplicationRole;
  label: string;
  description: string;
  type: "System Role";
};

export type RolePermissionAssignment = {
  roleId: ApplicationRole;
  permissions: PermissionKey[];
  version: number;
  updatedAt: string | null;
  updatedBy: { uid: string; displayName: string } | null;
  source: "default" | "postgresql";
};

export type RolePermissionView = RolePermissionAssignment & {
  roleName: string;
  description: string;
  memberCount: number;
};

export type RolesPermissionsData = {
  roles: RolePermissionView[];
  permissions: PermissionDefinition[];
  summary: {
    roleCount: number;
    permissionCount: number;
    assignedPermissionCount: number;
    configurationStatus: "healthy" | "attention";
    configurationIssues: string[];
    latestUpdatedAt: string | null;
  };
};
