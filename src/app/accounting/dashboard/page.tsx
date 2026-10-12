import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { AccountingDashboardPage } from "@/components/accounting/dashboard/AccountingDashboardPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getAccountingDashboardData } from "@/server/accounting/accounting-dashboard.service";
import type { AccountingDashboardData } from "@/types/accounting-dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("accounting");
  if (!(await hasPermission(context.user, "accounting.dashboard.view"))) {
    return <PermissionDeniedPage title="Accounting Dashboard unavailable" backHref="/" backLabel="Return to sign in" />;
  }

  let data: AccountingDashboardData | null = null;
  let loadError = false;

  try {
    data = await getAccountingDashboardData();
  } catch {
    loadError = true;
  }

  return <AccountingDashboardPage initialData={data} loadError={loadError} />;
}
