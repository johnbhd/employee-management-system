import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  permissionDefinitions,
  roleDefinitions,
} from "@/data/roles-permissions";
import { userAccounts } from "@/data/user-accounts";

import { RolesPermissionsManager, type RoleWithUsers } from "./RolesPermissionsManager";

export function RolesPermissionsPage() {
  const roles: RoleWithUsers[] = roleDefinitions.map((role) => ({
    ...role,
    assignedUsers: userAccounts.filter((account) => account.role === role.name).length,
  }));
  const activeRoles = roles.filter((role) => role.status === "Active");
  const assignedUsers = userAccounts.length;

  const roleMetrics = [
    {
      label: "Total Roles",
      value: String(roles.length),
      note: "Application role catalog",
      icon: "roles" as const,
      tone: "info" as const,
    },
    {
      label: "Active Roles",
      value: String(activeRoles.length),
      note: "Available to assign",
      icon: "check" as const,
      tone: "success" as const,
    },
    {
      label: "Assigned Users",
      value: String(assignedUsers),
      note: "Across application accounts",
      icon: "users" as const,
      tone: "info" as const,
    },
    {
      label: "Total Permissions",
      value: String(permissionDefinitions.length),
      note: "Grouped application capabilities",
      icon: "key" as const,
      tone: "warning" as const,
    },
  ];

  return (
    <div className="admin-page roles-permissions-page">
      <AdminPageHeader
        eyebrow="Access management / Prototype"
        title="Roles & Permissions"
        description="Manage application roles and define access to employee and integration features."
        actions={<StatusBadge tone="info"><Icon name="shield" /> Prototype access control</StatusBadge>}
      />

      <div className="metric-grid roles-permissions-metrics">
        {roleMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <RolesPermissionsManager roles={roles} permissions={permissionDefinitions} />

      <SectionCard title="Access Control Boundary" eyebrow="Keep domains separate">
        <div className="panel-body roles-boundary-content">
          <p>
            Roles and permissions configured here apply only to this integration application. They do not change access within the Existing HRPS, Bundy / Biometric System, Payroll System, or Accounting System.
          </p>
          <p className="roles-boundary-note">
            <Icon name="lock" />
            <span>Official employee information and downstream business permissions remain owned by their respective systems.</span>
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
