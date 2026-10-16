import type {
  AccountingDashboardAccountingStatus,
  AccountingDashboardPayroll,
} from "@/types/accounting-dashboard";

import { formatAccountingReturnedAmount } from "@/data/accounting/approved-payroll";
import { formatCampusDateTime } from "@/lib/campus-time";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type LatestApprovedPayrollProps = {
  payroll: AccountingDashboardPayroll | null;
};

export function LatestApprovedPayroll({ payroll }: LatestApprovedPayrollProps) {
  if (!payroll) {
    return (
      <p className="accounting-dashboard__empty-state">
        No approved Payroll Result is available yet.
      </p>
    );
  }

  return (
    <div className="accounting-dashboard__latest">
      <div className="accounting-dashboard__latest-intro">
        <span className="accounting-dashboard__latest-icon" aria-hidden="true">
          <Icon name="payroll" />
        </span>
        <div>
          <p className="accounting-dashboard__latest-label">Latest approved payroll</p>
          <h3>{payroll.payrollPeriod.label}</h3>
          <p>{payroll.payrollReference} · {payroll.employeeCount} employees</p>
        </div>
      </div>

      <dl className="accounting-dashboard__latest-details">
        <div>
          <dt>Returned amount</dt>
          <dd>{formatAccountingReturnedAmount(payroll.returnedAmount)}</dd>
        </div>
        <div>
          <dt>Payroll result status</dt>
          <dd>
            <StatusBadge tone={getPayrollStatusTone(payroll.payrollStatus)}>
              {getPayrollStatusLabel(payroll.payrollStatus)}
            </StatusBadge>
          </dd>
        </div>
        <div>
          <dt>Accounting status</dt>
          <dd>
            <StatusBadge tone={getAccountingStatusTone(payroll.accountingStatus)}>
              {payroll.accountingStatus}
            </StatusBadge>
          </dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>
            <time dateTime={payroll.lastUpdatedAt}>
              {formatCampusDateTime(new Date(payroll.lastUpdatedAt))}
            </time>
          </dd>
        </div>
      </dl>
      <p className="accounting-dashboard__latest-source">
        Returned by the Existing Payroll System. No payroll amount is calculated here.
      </p>
    </div>
  );
}

export function getAccountingStatusTone(status: AccountingDashboardAccountingStatus) {
  if (status === "Transferred") return "success" as const;
  if (status === "Integration Issue" || status === "Blocked") return "danger" as const;
  if (status === "Ready for Transfer" || status === "Prepared") return "info" as const;
  return "warning" as const;
}

function getPayrollStatusLabel(status: AccountingDashboardPayroll["payrollStatus"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "completed_with_issues":
      return "Completed with issues";
    case "partially_completed":
      return "Partially completed";
    case "processing":
      return "Processing";
    case "rejected":
      return "Rejected";
    case "failed":
      return "Failed";
  }
}

function getPayrollStatusTone(status: AccountingDashboardPayroll["payrollStatus"]) {
  if (status === "completed") return "success" as const;
  if (status === "processing") return "warning" as const;
  return "danger" as const;
}
