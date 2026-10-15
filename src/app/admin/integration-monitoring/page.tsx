import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { IntegrationMonitoringPage } from "@/components/admin/pages/IntegrationMonitoringPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getAdminIntegrationMonitoringData } from "@/server/admin/integration-monitoring.service";
import type { AdminIntegrationMonitoringData } from "@/types/admin-integration-monitoring";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("admin");
  if (!(await hasPermission(context.user, "admin.integration_monitoring.view"))) {
    return <PermissionDeniedPage title="Integration Monitoring unavailable" backHref="/admin/dashboard" backLabel="Back to Admin Dashboard" />;
  }

  let data: AdminIntegrationMonitoringData | null = null;
  let loadError = false;

  try {
    data = await getAdminIntegrationMonitoringData();
  } catch {
    loadError = true;
  }

  return <IntegrationMonitoringPage initialData={data} loadError={loadError} />;
}
