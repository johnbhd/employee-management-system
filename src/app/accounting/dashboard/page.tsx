import { AccountingDashboardPage } from "@/components/accounting/dashboard/AccountingDashboardPage";
import { getAccountingDashboardData } from "@/server/accounting/accounting-dashboard.service";
import type { AccountingDashboardData } from "@/types/accounting-dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  let data: AccountingDashboardData | null = null;
  let loadError = false;

  try {
    data = await getAccountingDashboardData();
  } catch {
    loadError = true;
  }

  return <AccountingDashboardPage initialData={data} loadError={loadError} />;
}
