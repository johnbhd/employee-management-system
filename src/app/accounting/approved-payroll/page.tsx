import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { ApprovedPayrollPage } from "@/components/accounting/approved-payroll/ApprovedPayrollPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
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
  const context = await requireRoleContext("accounting");
  if (!(await hasPermission(context.user, "accounting.approved_payroll.view"))) {
    return <PermissionDeniedPage title="Approved Payroll unavailable" backHref="/accounting/dashboard" backLabel="Back to Accounting Dashboard" />;
  }

  let data = emptyApprovedPayrollData;
  let loadError = false;

  try {
    data = await getAccountingApprovedPayrollData();
  } catch {
    loadError = true;
  }

  return <ApprovedPayrollPage initialData={data} loadError={loadError} />;
}
