"use client";

import { useCallback, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type { RolesPermissionsData } from "@/types/permissions";

import { RolesPermissionsManager } from "./RolesPermissionsManager";

type RolesPermissionsApiResponse = ApiSuccessResponse<RolesPermissionsData>;

export function RolesPermissionsPage({
  initialData,
  loadError: initialLoadError,
  canManage,
}: {
  initialData: RolesPermissionsData | null;
  loadError: boolean;
  canManage: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [loadError, setLoadError] = useState(initialLoadError);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<RolesPermissionsApiResponse>(
        "/api/admin/roles-permissions",
        { cache: "no-store" },
      );
      setData(response.data);
      setLoadError(false);
      setFeedback("");
    } catch (error) {
      setLoadError(true);
      setFeedback(error instanceof Error ? error.message : "Roles and permissions could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const metrics = data
    ? [
      { label: "Total Roles", value: String(data.summary.roleCount), note: "Controlled application role catalog", icon: "roles" as const, tone: "info" as const },
      { label: "Assigned Users", value: String(data.roles.reduce((total, role) => total + role.memberCount, 0)), note: "Across application profiles", icon: "users" as const, tone: "info" as const },
      { label: "Permission Catalog", value: String(data.summary.permissionCount), note: "Server-controlled capabilities", icon: "key" as const, tone: "warning" as const },
      { label: "Assigned Permissions", value: String(data.summary.assignedPermissionCount), note: "Current role assignments", icon: "check" as const, tone: "success" as const },
    ]
    : [
      { label: "Total Roles", value: "—", note: "Unavailable", icon: "roles" as const, tone: "info" as const },
      { label: "Assigned Users", value: "—", note: "Unavailable", icon: "users" as const, tone: "info" as const },
      { label: "Permission Catalog", value: "—", note: "Unavailable", icon: "key" as const, tone: "warning" as const },
      { label: "Assigned Permissions", value: "—", note: "Unavailable", icon: "check" as const, tone: "success" as const },
    ];

  return (
    <div className={`admin-page roles-permissions-page${isLoading ? " is-loading" : ""}`} aria-busy={isLoading}>
      <AdminPageHeader
        eyebrow="Access management"
        title="Roles & Permissions"
        description="Manage controlled application capabilities for the five supported roles. Server-side checks remain authoritative for every protected operation."
        actions={<StatusBadge tone={canManage ? "success" : "muted"}><Icon name="shield" /> {canManage ? "Permission management" : "Read-only access"}</StatusBadge>}
      />

      <div className="metric-grid roles-permissions-metrics">
        {metrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      {loadError && !data ? (
        <SectionCard title="Roles and permissions could not be loaded" eyebrow="Configuration unavailable">
          <div className="panel-body roles-load-error">
            <p>{feedback || "The permission configuration is temporarily unavailable."}</p>
            <button type="button" className="button-secondary" onClick={() => void loadData()} disabled={isLoading}>Try again</button>
          </div>
        </SectionCard>
      ) : data ? (
        <RolesPermissionsManager data={data} canManage={canManage} onDataChange={setData} />
      ) : null}

      <SectionCard title="Access Control Boundary" eyebrow="Keep domains separate">
        <div className="panel-body roles-boundary-content">
          <p>These assignments control access to this integration application only. They do not change permissions inside the Existing HRPS, Bundy / Biometric System, Payroll System, or Accounting System.</p>
          <p className="roles-boundary-note"><Icon name="lock" /><span>Employee ownership checks and official employee information remain protected by their respective server boundaries.</span></p>
        </div>
      </SectionCard>
    </div>
  );
}
