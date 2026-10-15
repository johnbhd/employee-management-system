import { AdminAuditLogsPage } from "@/components/admin/audit-logs/AdminAuditLogsPage";
import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { hasPermission } from "@/server/auth/permission.service";
import { getAdminAuditLogsData, getDefaultAdminAuditLogsQuery } from "@/server/admin/admin-audit-logs.service";
import { requireRoleContext } from "@/server/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("admin");
  if (!(await hasPermission(context.user, "admin.audit_logs.view"))) {
    return <PermissionDeniedPage title="Audit Logs unavailable" backHref="/admin/dashboard" backLabel="Back to Admin Dashboard" />;
  }

  let data = null;
  let loadError = false;
  try {
    data = await getAdminAuditLogsData(await getDefaultAdminAuditLogsQuery());
  } catch {
    loadError = true;
  }
  return <AdminAuditLogsPage initialData={data} loadError={loadError} />;
}
