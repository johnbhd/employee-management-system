import { PayrollResultsPage } from "@/components/payroll/results/PayrollResultsPage";
import { getPayrollResultsData } from "@/server/payroll/payroll-result.service";
import type { PayrollResultsData } from "@/types/payroll-results";

export const dynamic = "force-dynamic";

const emptyResultsData: PayrollResultsData = {
  period: { start: "", end: "", label: "Payroll period unavailable" },
  currentResult: null,
  records: [],
  batchResults: [],
  notices: [],
  summary: {
    processedEmployees: 0,
    payslipsAvailable: 0,
    pendingResults: 0,
    failedOrRejected: 0,
    completedBatches: 0,
  },
  total: 0,
  page: 1,
  pageSize: 5,
  hasNext: false,
  periodOptions: [],
  departmentOptions: [],
  providerNote: "Payroll result data is unavailable.",
};

export default async function PayrollResultsRoute() {
  let data = emptyResultsData;
  let loadError = false;

  try {
    data = await getPayrollResultsData();
  } catch {
    loadError = true;
  }

  return <PayrollResultsPage initialData={data} loadError={loadError} />;
}
