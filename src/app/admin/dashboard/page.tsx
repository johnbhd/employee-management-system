import { AdminDashboardPage } from "@/components/admin/pages/AdminDashboardPage";
import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { getAdminDashboardData } from "@/server/admin/admin-dashboard.service";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import type { AdminDashboardData } from "@/types/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("admin");
  if (!(await hasPermission(context.user, "admin.dashboard.view"))) {
    return <PermissionDeniedPage title="Admin Dashboard unavailable" backHref="/admin/dashboard" backLabel="Back to Admin Dashboard" />;
  }

  let data: AdminDashboardData | null = null;
  let loadError = false;

  try {
    data = await getAdminDashboardData();
  } catch {
    loadError = true;
  }

  return <AdminDashboardPage initialData={data} loadError={loadError} />;
}
