import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

import { AuditLogsExplorer } from "./AuditLogsExplorer";

export function AdminAuditLogsPage() {
  return (
    <div className="admin-page admin-audit-logs-page">
      <AdminPageHeader
        eyebrow="Traceability workspace"
        title="Audit Logs"
        description="Review application-wide account, permission, attendance, and integration activity in chronological order."
      />
      <AuditLogsExplorer />
    </div>
  );
}
