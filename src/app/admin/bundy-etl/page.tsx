import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { BundyIntegrationPage } from "@/components/admin/integrations/BundyIntegrationPage";
import { getBundyPageData } from "@/server/bundy/bundy-import.service";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import type { BundyPageData } from "@/types/bundy-import";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("admin");
  if (!(await hasPermission(context.user, "admin.integration_monitoring.view"))) {
    return <PermissionDeniedPage title="Bundy / Biometric ETL unavailable" backHref="/admin/dashboard" backLabel="Back to Admin Dashboard" />;
  }

  let data: BundyPageData | null = null;
  let loadError = false;

  try {
    data = await getBundyPageData();
  } catch {
    loadError = true;
  }

  return <BundyIntegrationPage initialData={data} initialLoadError={loadError} canImport={await hasPermission(context.user, "admin.integration_monitoring.retry")} />;
}
