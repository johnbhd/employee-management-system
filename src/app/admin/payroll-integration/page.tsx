import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { AdminIntegrationDetailPage, adminIntegrationDetailConfigs } from "@/components/admin/integrations/AdminIntegrationDetailPage";
import { getAdminIntegrationMonitoringData } from "@/server/admin/integration-monitoring.service";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import type { AdminIntegrationMonitoringData } from "@/types/admin-integration-monitoring";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("admin");
  if (!(await hasPermission(context.user, "admin.integration_monitoring.view"))) {
    return <PermissionDeniedPage title="Payroll Integration unavailable" backHref="/admin/dashboard" backLabel="Back to Admin Dashboard" />;
  }

  let data: AdminIntegrationMonitoringData | null = null;
  let loadError = false;

  try {
    data = await getAdminIntegrationMonitoringData();
  } catch {
    loadError = true;
  }

  return <AdminIntegrationDetailPage config={adminIntegrationDetailConfigs.payroll} initialData={data} loadError={loadError} />;
}
