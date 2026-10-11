import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  payrollAlerts,
  payrollBatches,
  payrollReadinessRecords,
  payrollSummaryMetrics,
} from "@/data/payroll/dashboard";

import { PayrollHandoffAlerts } from "./PayrollHandoffAlerts";
import { PayrollReadinessTable } from "./PayrollReadinessTable";
import { PayrollRecentBatches } from "./PayrollRecentBatches";

export function PayrollDashboardPage() {
  return (
    <div className="payroll-dashboard">
      <AdminPageHeader
        eyebrow="Payroll operations"
        title="Payroll Dashboard"
        description="Monitor verified attendance, payroll handoff readiness, transfer progress, and payroll integration activity."
        actions={(
          <ActionButton icon="refresh" action="Payroll dashboard data refreshed.">
            Refresh data
          </ActionButton>
        )}
      />

      <div className="metric-grid payroll-dashboard__summary">
        {payrollSummaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard
        title="Verified Attendance Ready for Payroll"
        eyebrow="Payroll readiness"
        className="payroll-dashboard__readiness"
      >
        <p className="payroll-dashboard__section-note">
          Only HR-verified attendance records that meet payroll readiness checks are shown here.
        </p>
        <PayrollReadinessTable records={payrollReadinessRecords} />
      </SectionCard>

      <div className="payroll-dashboard__split">
        <SectionCard
          title="Recent Payroll Batches"
          eyebrow="Batch activity"
          className="payroll-dashboard__batches"
        >
          <p className="payroll-dashboard__section-note">
            Recent preparation batches and their current transfer status.
          </p>
          <PayrollRecentBatches batches={payrollBatches} />
        </SectionCard>

        <SectionCard
          title="Transfer Issues & Follow-up"
          eyebrow="Payroll alerts"
          className="payroll-dashboard__alerts-card"
        >
          <p className="payroll-dashboard__section-note">
            Items that require attention before or after payroll handoff.
          </p>
          <PayrollHandoffAlerts alerts={payrollAlerts} />
        </SectionCard>
      </div>

      <p className="payroll-dashboard__boundary-note">
        <Icon name="shield" />
        This workspace displays deterministic payroll-readiness information only. It does not calculate salaries, approve payroll, or write to the Existing Payroll System.
      </p>
    </div>
  );
}
