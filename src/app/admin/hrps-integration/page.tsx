import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { HrpsIntegrationPage } from "@/components/admin/integrations/HrpsIntegrationPage";
import { listHrpsImportHistory } from "@/server/hrps/hrps-import.service";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import type { HrpsImportHistoryData } from "@/types/hrps-import";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("admin");
  if (!(await hasPermission(context.user, "admin.integration_monitoring.view"))) {
    return <PermissionDeniedPage title="HRPS Integration unavailable" backHref="/admin/dashboard" backLabel="Back to Admin Dashboard" />;
  }

  let history: HrpsImportHistoryData | null = null;
  let loadError = false;

  try {
    history = await listHrpsImportHistory(1, 10);
  } catch {
    loadError = true;
  }

  return <HrpsIntegrationPage initialHistory={history} initialLoadError={loadError} canImport={await hasPermission(context.user, "admin.integration_monitoring.retry")} />;
}
