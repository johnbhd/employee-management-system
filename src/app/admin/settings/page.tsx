import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { SystemSettingsPage } from "@/components/admin/settings/SystemSettingsPage";
import { getAdminSettingsData } from "@/server/admin/admin-settings.service";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import type { AdminSettingsData } from "@/types/admin-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("admin");
  if (!(await hasPermission(context.user, "admin.settings.view"))) {
    return <PermissionDeniedPage title="System Settings unavailable" backHref="/admin/dashboard" backLabel="Back to Admin Dashboard" />;
  }

  let data: AdminSettingsData | null = null;
  let loadError = false;

  try {
    data = await getAdminSettingsData();
  } catch {
    loadError = true;
  }

  return (
    <SystemSettingsPage
      initialData={data}
      loadError={loadError}
      canManage={await hasPermission(context.user, "admin.settings.manage")}
    />
  );
}
