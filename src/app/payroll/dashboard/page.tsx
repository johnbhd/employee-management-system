import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { PayrollDashboardPage } from "@/components/payroll/dashboard/PayrollDashboardPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getPayrollDashboardData } from "@/server/payroll/payroll-dashboard.service";

export default async function Page() {
  const context = await requireRoleContext("payroll");
  if (!(await hasPermission(context.user, "payroll.dashboard.view"))) {
    return <PermissionDeniedPage title="Payroll Dashboard unavailable" backHref="/" backLabel="Return to sign in" />;
  }

  let data = null;
  let dataLoadError = false;

  try {
    data = await getPayrollDashboardData();
  } catch {
    dataLoadError = true;
  }

  return (
    <PayrollDashboardPage
      dataLoadError={dataLoadError}
      initialData={data}
    />
  );
}
