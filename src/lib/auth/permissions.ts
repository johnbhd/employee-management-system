import type {
  ApplicationRole,
} from "@/lib/auth/roles";
import type {
  ApplicationRoleDefinition,
  PermissionDefinition,
  PermissionKey,
} from "@/types/permissions";

export const applicationRoleDefinitions: readonly ApplicationRoleDefinition[] = [
  {
    id: "admin",
    label: "IT Administrator",
    description: "Technical integration administration and application access control.",
    type: "System Role",
  },
  {
    id: "hr",
    label: "HR / Attendance Staff",
    description: "Attendance operations, employee references, and HR review workflows.",
    type: "System Role",
  },
  {
    id: "employee",
    label: "Employee",
    description: "Self-service access to personal attendance, profile, and payslip views.",
    type: "System Role",
  },
  {
    id: "payroll",
    label: "Payroll Staff",
    description: "Payroll readiness, batch, handoff, result, and history workflows.",
    type: "System Role",
  },
  {
    id: "accounting",
    label: "Accounting Staff",
    description: "Approved Payroll review and Accounting transfer workflows.",
    type: "System Role",
  },
];

const dependencyMap: Partial<Record<PermissionKey, readonly PermissionKey[]>> = {
  "admin.integration_monitoring.retry": ["admin.integration_monitoring.view"],
  "admin.user_accounts.manage": ["admin.user_accounts.view"],
  "admin.roles_permissions.manage": ["admin.roles_permissions.view"],
  "admin.settings.manage": ["admin.settings.view"],
  "hr.correction.review": ["hr.correction.view"],
  "payroll.batch.manage": ["payroll.batch.view"],
  "payroll.handoff.submit": ["payroll.handoff.view"],
  "accounting.transfer.submit": ["accounting.transfer.view"],
};

function permission(
  key: PermissionKey,
  label: string,
  description: string,
  category: PermissionDefinition["category"],
  extra: Pick<PermissionDefinition, "requiredForRoles"> = {},
): PermissionDefinition {
  return {
    key,
    label,
    description,
    category,
    dependsOn: dependencyMap[key],
    ...extra,
  };
}

export const permissionCatalog: readonly PermissionDefinition[] = [
  permission("employee.dashboard.view", "View Employee Dashboard", "Open the signed-in employee dashboard.", "Employee Self-Service"),
  permission("employee.attendance.view_own", "View Own Attendance", "Review the signed-in employee attendance summary.", "Employee Self-Service"),
  permission("employee.attendance.history.view_own", "View Own Attendance History", "Review personal attendance records and details.", "Employee Self-Service"),
  permission("employee.attendance_qr.view_own", "View Own Attendance QR", "View the signed-in employee attendance QR code.", "Employee Self-Service"),
  permission("employee.payslip.view_own", "View Own Payslip", "View payroll snapshots belonging to the signed-in employee.", "Employee Self-Service"),
  permission("employee.profile.view_own", "View Own Profile", "Review the signed-in employee profile reference.", "Employee Self-Service"),
  permission("hr.dashboard.view", "View HR Dashboard", "Open the HR attendance operations dashboard.", "HR & Attendance"),
  permission("hr.attendance.view", "View Attendance Monitoring", "Review persisted attendance records across employees.", "HR & Attendance"),
  permission("hr.attendance.reports.view", "View Attendance Reports", "Generate read-only attendance reports.", "HR & Attendance"),
  permission("hr.correction.view", "View Correction Requests", "Review submitted attendance correction requests.", "HR & Attendance"),
  permission("hr.correction.review", "Review Correction Requests", "Approve or reject attendance correction requests.", "HR & Attendance"),
  permission("hr.attendance.verify", "Verify Attendance", "Perform final HR attendance verification for payroll readiness.", "HR & Attendance"),
  permission("hr.attendance.scan", "Scan Attendance QR", "Use the authorized attendance scanner for HR operations.", "HR & Attendance"),
  permission("hr.employee_directory.view", "View Employee Directory", "Review read-only Employee/HRPS references.", "HR & Attendance"),
  permission("hr.schedule.view", "View Employee Schedules", "Review read-only employee schedule references.", "HR & Attendance"),
  permission("hr.schedule.manage", "Manage Employee Schedules", "Manage supported employee schedule references.", "HR & Attendance"),
  permission("hr.audit_history.view", "View HR Audit History", "Review persisted HR attendance and correction activity.", "HR & Attendance"),
  permission("payroll.dashboard.view", "View Payroll Dashboard", "Open the Payroll Staff dashboard.", "Payroll Integration"),
  permission("payroll.verified_attendance.view", "View Verified Attendance", "Review HR-verified attendance ready for payroll.", "Payroll Integration"),
  permission("payroll.batch.view", "View Payroll Batches", "Review Payroll handoff batches.", "Payroll Integration"),
  permission("payroll.batch.manage", "Manage Payroll Batches", "Create, edit, and transition eligible Payroll batches.", "Payroll Integration"),
  permission("payroll.handoff.view", "View Payroll Handoff", "Review Payroll transfer and acknowledgement status.", "Payroll Integration"),
  permission("payroll.handoff.submit", "Submit Payroll Handoff", "Submit eligible Payroll batches to the configured adapter.", "Payroll Integration"),
  permission("payroll.result.view", "View Payroll Results", "Review Payroll results returned by the configured adapter.", "Payroll Integration"),
  permission("payroll.history.view", "View Payroll History", "Review read-only Payroll lifecycle history.", "Payroll Integration"),
  permission("accounting.dashboard.view", "View Accounting Dashboard", "Open the Accounting Staff dashboard.", "Accounting Integration"),
  permission("accounting.approved_payroll.view", "View Approved Payroll", "Review Payroll results prepared for Accounting.", "Accounting Integration"),
  permission("accounting.transfer.view", "View Accounting Transfers", "Review Accounting transfer and acknowledgement status.", "Accounting Integration"),
  permission("accounting.transfer.submit", "Submit Accounting Transfer", "Submit eligible Payroll results to the Accounting adapter.", "Accounting Integration"),
  permission("accounting.history.view", "View Accounting History", "Review read-only Accounting transfer history.", "Accounting Integration"),
  permission("admin.dashboard.view", "View Admin Dashboard", "Open the IT Administrator integration control center.", "Integration Monitoring"),
  permission("admin.integration_monitoring.view", "View Integration Monitoring", "Review source and downstream integration health.", "Integration Monitoring"),
  permission("admin.integration_monitoring.retry", "Retry Integration Errors", "Run an authorized retry for eligible technical integration errors.", "Integration Monitoring"),
  permission("admin.user_accounts.view", "View User Accounts", "Review Firebase identities and application profiles.", "User Administration", { requiredForRoles: ["admin"] }),
  permission("admin.user_accounts.manage", "Manage User Accounts", "Create and manage application accounts and role assignments.", "User Administration", { requiredForRoles: ["admin"] }),
  permission("admin.roles_permissions.view", "View Roles & Permissions", "Review the controlled role and permission catalog.", "Security & Permissions", { requiredForRoles: ["admin"] }),
  permission("admin.roles_permissions.manage", "Manage Roles & Permissions", "Update persisted role-permission assignments.", "Security & Permissions", { requiredForRoles: ["admin"] }),
  permission("admin.audit_logs.view", "View Audit Logs", "Review application audit activity.", "Audit & Logs"),
  permission("admin.settings.view", "View System Settings", "Review application settings.", "System Settings"),
  permission("admin.settings.manage", "Manage System Settings", "Update supported application settings.", "System Settings"),
];

export const defaultRolePermissions: Readonly<Record<ApplicationRole, readonly PermissionKey[]>> = {
  admin: permissionCatalog
    .filter((item) => item.key.startsWith("admin."))
    .map((item) => item.key),
  hr: permissionCatalog
    .filter((item) => item.key.startsWith("hr."))
    .map((item) => item.key),
  employee: permissionCatalog
    .filter((item) => item.key.startsWith("employee."))
    .map((item) => item.key),
  payroll: permissionCatalog
    .filter((item) => item.key.startsWith("payroll."))
    .map((item) => item.key),
  accounting: permissionCatalog
    .filter((item) => item.key.startsWith("accounting."))
    .map((item) => item.key),
};

export const reservedPermissionsForAdmin: readonly PermissionKey[] = [
  "admin.roles_permissions.view",
  "admin.roles_permissions.manage",
  "admin.user_accounts.view",
  "admin.user_accounts.manage",
];

export function getPermissionDefinition(key: PermissionKey) {
  return permissionCatalog.find((item) => item.key === key) ?? null;
}

export function getRoleDefinition(role: ApplicationRole) {
  return applicationRoleDefinitions.find((item) => item.id === role) ?? null;
}
