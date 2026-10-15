import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { HrDashboardPage } from "@/components/hr/dashboard/HrDashboardPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getHrDashboardSummary } from "@/server/hr/hr-dashboard.service";

export default async function Page() {
  const context = await requireRoleContext("hr");
  if (!(await hasPermission(context.user, "hr.dashboard.view"))) {
    return <PermissionDeniedPage title="HR Dashboard unavailable" backHref="/" backLabel="Return to sign in" />;
  }

  let summary = null;
  let dataLoadError = false;

  try {
    summary = await getHrDashboardSummary();
  } catch {
    dataLoadError = true;
  }

  return (
    <HrDashboardPage
      dataLoadError={dataLoadError}
      summary={summary}
    />
  );
}
