import { PayrollHandoffPage } from "@/components/payroll/handoff/PayrollHandoffPage";
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
  let data = getEmptyData();
  let loadError = false;

  try {
    data = await getPayrollHandoffData();
  } catch {
    loadError = true;
  }

  return <PayrollHandoffPage initialData={data} loadError={loadError} />;
}
