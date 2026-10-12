import { IntegrationMonitoringPage } from "@/components/admin/pages/IntegrationMonitoringPage";
import { getAdminIntegrationMonitoringData } from "@/server/admin/integration-monitoring.service";
import type { AdminIntegrationMonitoringData } from "@/types/admin-integration-monitoring";

export const dynamic = "force-dynamic";

export default async function Page() {
  let data: AdminIntegrationMonitoringData | null = null;
  let loadError = false;

  try {
    data = await getAdminIntegrationMonitoringData();
  } catch {
    loadError = true;
  }

  return <IntegrationMonitoringPage initialData={data} loadError={loadError} />;
}
