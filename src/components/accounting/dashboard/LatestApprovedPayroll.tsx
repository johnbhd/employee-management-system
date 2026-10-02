import type { AccountingPayrollBatch } from "@/data/accounting/dashboard";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type LatestApprovedPayrollProps = {
  payroll: AccountingPayrollBatch;
};

export function LatestApprovedPayroll({ payroll }: LatestApprovedPayrollProps) {
  return (
    <div className="accounting-dashboard__latest">
      <div className="accounting-dashboard__latest-intro">
        <span className="accounting-dashboard__latest-icon" aria-hidden="true">
          <Icon name="payroll" />
        </span>
        <div>
          <p className="accounting-dashboard__latest-label">Latest approved payroll</p>
          <h3>{payroll.payrollPeriod}</h3>
          <p>{payroll.payrollReference} · {payroll.employeeCount}</p>
        </div>
      </div>

      <dl className="accounting-dashboard__latest-details">
        <div>
          <dt>Approved amount</dt>
          <dd>{payroll.approvedAmount}</dd>
        </div>
        <div>
          <dt>Approval status</dt>
          <dd><StatusBadge tone={payroll.approvalTone}>{payroll.approvalStatus}</StatusBadge></dd>
        </div>
        <div>
          <dt>Accounting status</dt>
          <dd><StatusBadge tone={payroll.accountingTone}>{payroll.accountingStatus}</StatusBadge></dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{payroll.updatedAt}</dd>
        </div>
      </dl>
    </div>
  );
}
