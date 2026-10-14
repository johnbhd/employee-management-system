import type { NavigationItem } from "@/types/ui";
import type { PermissionKey } from "@/types/permissions";

export const adminNavigationSections = [
  { id: "workspace", label: "Workspace" },
  { id: "integrations", label: "Integrations" },
  { id: "administration", label: "Administration" },
] as const;

type AdminNavigationSection = typeof adminNavigationSections[number]["id"];

export type AdminNavigationItem = Omit<NavigationItem, "href"> & {
  href: string;
  section: AdminNavigationSection;
  permission: PermissionKey;
};

export const adminNavigation: AdminNavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "dashboard",
    section: "workspace",
    permission: "admin.dashboard.view",
  },
  {
    id: "integration-monitoring",
    label: "Integration Monitoring",
    href: "/admin/integration-monitoring",
    icon: "monitoring",
    section: "integrations",
    permission: "admin.integration_monitoring.view",
  },
  {
    id: "hrps-integration",
    label: "HRPS Integration",
    href: "/admin/hrps-integration",
    icon: "hrps",
    section: "integrations",
    permission: "admin.integration_monitoring.view",
  },
  {
    id: "bundy-etl",
    label: "Bundy / Biometric ETL",
    href: "/admin/bundy-etl",
    icon: "bundy",
    section: "integrations",
    permission: "admin.integration_monitoring.view",
  },
  {
    id: "qr-attendance",
    label: "QR Attendance",
    href: "/admin/qr-attendance",
    icon: "qr",
    section: "integrations",
    permission: "admin.integration_monitoring.view",
  },
  {
    id: "unified-attendance",
    label: "Unified Attendance",
    href: "/admin/unified-attendance",
    icon: "unified",
    section: "integrations",
    permission: "admin.integration_monitoring.view",
  },
  {
    id: "payroll-integration",
    label: "Payroll Integration",
    href: "/admin/payroll-integration",
    icon: "payroll",
    section: "integrations",
    permission: "admin.integration_monitoring.view",
  },
  {
    id: "accounting-integration",
    label: "Accounting Integration",
    href: "/admin/accounting-integration",
    icon: "accounting",
    section: "integrations",
    permission: "admin.integration_monitoring.view",
  },
  {
    id: "user-accounts",
    label: "User Accounts",
    href: "/admin/user-accounts",
    icon: "users",
    section: "administration",
    permission: "admin.user_accounts.view",
  },
  {
    id: "roles-permissions",
    label: "Roles & Permissions",
    href: "/admin/roles-permissions",
    icon: "roles",
    section: "administration",
    permission: "admin.roles_permissions.view",
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: "audit",
    section: "administration",
    permission: "admin.audit_logs.view",
  },
  {
    id: "system-settings",
    label: "System & Settings",
    href: "/admin/settings",
    icon: "settings",
    section: "administration",
    permission: "admin.settings.view",
  },
];
