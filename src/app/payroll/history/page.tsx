import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { PayrollHistoryPage } from "@/components/payroll/history/PayrollHistoryPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getPayrollHistoryData } from "@/server/payroll/payroll-history.service";
import type { PayrollHistoryData } from "@/types/payroll-history";

export const dynamic = "force-dynamic";

const emptyHistoryData: PayrollHistoryData = {
  period: { start: "", end: "", label: "Payroll period unavailable" },
  records: [],
  summary: {
    totalBatches: 0,
    completed: 0,
    completedWithIssues: 0,
    failedOrRejected: 0,
    latestCompletedPeriod: null,
  },
  total: 0,
  page: 1,
  pageSize: 5,
  hasNext: false,
  periodOptions: [],
  batchStatusOptions: [],
  transferStatusOptions: [],
  resultStatusOptions: [],
  providerNote: "Persistent payroll history data is unavailable.",
};

export default async function PayrollHistoryRoute() {
  const context = await requireRoleContext("payroll");
  if (!(await hasPermission(context.user, "payroll.history.view"))) {
    return <PermissionDeniedPage title="Payroll History unavailable" backHref="/payroll/dashboard" backLabel="Back to Payroll Dashboard" />;
  }

  let data = emptyHistoryData;
  let loadError = false;

  try {
    data = await getPayrollHistoryData();
  } catch {
    loadError = true;
  }

  return <PayrollHistoryPage initialData={data} loadError={loadError} />;
}
