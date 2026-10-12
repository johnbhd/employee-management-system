import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { PayrollHandoffPage } from "@/components/payroll/handoff/PayrollHandoffPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import {
  getDefaultPayrollHandoffQuery,
  getPayrollHandoffData,
} from "@/server/payroll/payroll-handoff.service";
import type { PayrollHandoffData } from "@/types/payroll-handoff";

function getEmptyData(): PayrollHandoffData {
  const period = getDefaultPayrollHandoffQuery();
  return {
    period: { start: "", end: "", label: "Payroll period unavailable" },
    readyBatches: [],
    history: [],
    total: 0,
    page: period.page,
    pageSize: period.pageSize,
    hasNext: false,
    periodOptions: [],
    summary: {
      readyForHandoff: 0,
      inProgress: 0,
      acknowledged: 0,
      failed: 0,
      awaitingAcknowledgement: 0,
    },
    providerNote: "Payroll handoff data is unavailable.",
  };
}

export const dynamic = "force-dynamic";

export default async function PayrollHandoffRoute() {
  const context = await requireRoleContext("payroll");
  if (!(await hasPermission(context.user, "payroll.handoff.view"))) {
    return <PermissionDeniedPage title="Payroll Handoff unavailable" backHref="/payroll/dashboard" backLabel="Back to Payroll Dashboard" />;
  }

  let data = getEmptyData();
  let loadError = false;

  try {
    data = await getPayrollHandoffData();
  } catch {
    loadError = true;
  }

  return <PayrollHandoffPage initialData={data} loadError={loadError} />;
}
