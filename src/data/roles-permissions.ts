export type RolePermissionCategory =
  | "Administration"
  | "Integration Monitoring"
  | "Source Integrations"
  | "User Accounts"
  | "Employee Self-Service";

export type PermissionDefinition = {
  id: string;
  name: string;
  description: string;
  category: RolePermissionCategory;
  protectedForPrimaryAdministrator?: boolean;
};

export type RoleDefinition = {
  id: string;
  name: "IT Administrator" | "Employee";
  description: string;
  status: "Active";
  type: "System Role";
  protected: boolean;
  lastUpdated: string;
  permissionIds: readonly string[];
};

export const permissionCategoryOrder: readonly RolePermissionCategory[] = [
  "Administration",
  "Integration Monitoring",
  "Source Integrations",
  "User Accounts",
  "Employee Self-Service",
];

export const permissionDefinitions: readonly PermissionDefinition[] = [
  {
    id: "view-admin-dashboard",
    name: "View Admin Dashboard",
    description: "Open the IT Administrator integration control center.",
    category: "Administration",
  },
  {
    id: "view-roles-permissions",
    name: "View Roles & Permissions",
    description: "Review the application role and permission catalog.",
    category: "Administration",
    protectedForPrimaryAdministrator: true,
  },
  {
    id: "manage-roles-permissions",
    name: "Manage Roles & Permissions",
    description: "Simulate changes to application-level permission assignments.",
    category: "Administration",
    protectedForPrimaryAdministrator: true,
  },
  {
    id: "view-integration-monitoring",
    name: "View Integration Monitoring",
    description: "Review source, processing, and downstream synchronization status.",
    category: "Integration Monitoring",
  },
  {
    id: "view-integration-errors",
    name: "View Integration Errors",
    description: "Review the operational error queue and recovery status.",
    category: "Integration Monitoring",
  },
  {
    id: "retry-integration-errors",
    name: "Retry Technical Integration Errors",
    description: "Simulate controlled retry actions for eligible technical errors.",
    category: "Integration Monitoring",
  },
  {
    id: "view-hrps-integration",
    name: "View HRPS Integration",
    description: "Review the HRPS employee-information source boundary.",
    category: "Source Integrations",
  },
  {
    id: "view-bundy-etl",
    name: "View Bundy / Biometric ETL",
    description: "Review imported attendance logs and technical matching status.",
    category: "Source Integrations",
  },
  {
    id: "view-qr-attendance",
    name: "View QR Attendance",
    description: "Review QR attendance source events and processing status.",
    category: "Source Integrations",
  },
  {
    id: "view-unified-attendance",
    name: "View Unified Attendance",
    description: "Review standardized attendance records and validation state.",
    category: "Source Integrations",
  },
  {
    id: "view-payroll-integration",
    name: "View Payroll Integration",
    description: "Review verified attendance transfer readiness for the existing Payroll System.",
    category: "Source Integrations",
  },
  {
    id: "view-accounting-integration",
    name: "View Accounting Integration",
    description: "Review approved payroll synchronization readiness for the existing Accounting System.",
    category: "Source Integrations",
  },
  {
    id: "view-user-accounts",
    name: "View User Accounts",
    description: "Review application accounts and their assigned roles.",
    category: "User Accounts",
    protectedForPrimaryAdministrator: true,
  },
  {
    id: "manage-user-accounts",
    name: "Manage User Accounts",
    description: "Simulate application account status and role-assignment actions.",
    category: "User Accounts",
    protectedForPrimaryAdministrator: true,
  },
  {
    id: "view-employee-dashboard",
    name: "View Employee Dashboard",
    description: "Open the employee self-service dashboard.",
    category: "Employee Self-Service",
  },
  {
    id: "view-own-attendance",
    name: "View Own Attendance",
    description: "Review the signed-in employee attendance summary.",
    category: "Employee Self-Service",
  },
  {
    id: "view-own-attendance-history",
    name: "View Own Attendance History",
    description: "Review personal attendance records and details.",
    category: "Employee Self-Service",
  },
  {
    id: "view-own-payslip",
    name: "View Own Payslip",
    description: "View the latest payslip preview exposed by the employee dashboard.",
    category: "Employee Self-Service",
  },
  {
    id: "view-own-profile",
    name: "View Own Profile",
    description: "Review the signed-in employee profile reference.",
    category: "Employee Self-Service",
  },
];

export const roleDefinitions: readonly RoleDefinition[] = [
  {
    id: "it-administrator",
    name: "IT Administrator",
    description: "Technical integration administration and application access control.",
    status: "Active",
    type: "System Role",
    protected: true,
    lastUpdated: "Sep 23, 2026 · Prototype",
    permissionIds: [
      "view-admin-dashboard",
      "view-roles-permissions",
      "manage-roles-permissions",
      "view-integration-monitoring",
      "view-integration-errors",
      "retry-integration-errors",
      "view-hrps-integration",
      "view-bundy-etl",
      "view-qr-attendance",
      "view-unified-attendance",
      "view-payroll-integration",
      "view-accounting-integration",
      "view-user-accounts",
      "manage-user-accounts",
    ],
  },
  {
    id: "employee",
    name: "Employee",
    description: "Employee self-service access to personal attendance and payroll views.",
    status: "Active",
    type: "System Role",
    protected: true,
    lastUpdated: "Sep 20, 2026 · Prototype",
    permissionIds: [
      "view-employee-dashboard",
      "view-own-attendance",
      "view-own-attendance-history",
      "view-own-payslip",
      "view-own-profile",
    ],
  },
];
