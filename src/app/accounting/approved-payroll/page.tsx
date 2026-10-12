import { ApprovedPayrollPage } from "@/components/accounting/approved-payroll/ApprovedPayrollPage";
import { getAccountingApprovedPayrollData } from "@/server/accounting/accounting-approved-payroll.service";
import type { AccountingApprovedPayrollData } from "@/types/accounting-approved-payroll";

export const dynamic = "force-dynamic";

const emptyApprovedPayrollData: AccountingApprovedPayrollData = {
  records: [],
  summary: {
    approvedPayroll: 0,
    readyForTransfer: 0,
    transferred: 0,
    blocked: 0,
  },
  total: 0,
  page: 1,
  pageSize: 5,
  totalPages: 1,
  hasNext: false,
  periodOptions: [],
  resultStatusOptions: [],
  readinessStatusOptions: [],
  transferStatusOptions: [],
  providerNote: "Approved payroll information is unavailable.",
};

export default async function ApprovedPayrollRoute() {
  let data = emptyApprovedPayrollData;
  let loadError = false;

  try {
    data = await getAccountingApprovedPayrollData();
  } catch {
    loadError = true;
  }

  return <ApprovedPayrollPage initialData={data} loadError={loadError} />;
}
