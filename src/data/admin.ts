import type { NavigationItem } from "@/types/ui";

export const adminNavigation: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { id: "integration-monitoring", label: "Integration Monitoring", href: "/admin/integration-monitoring", icon: "monitoring" },
  { id: "user-accounts", label: "User Accounts", href: "/admin/user-accounts", icon: "users" },
  { id: "roles-permissions", label: "Roles & Permissions", href: "/admin/roles-permissions", icon: "roles" },
  { id: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs", icon: "audit" },
  { id: "system-settings", label: "System & Settings", href: "/admin/settings", icon: "settings" },
];
