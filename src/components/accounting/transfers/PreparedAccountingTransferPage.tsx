import Link from "next/link";

import { getAccountingTransferLabel, getAccountingTransferTone } from "@/data/accounting/approved-payroll";
import { formatCampusDateTime } from "@/lib/campus-time";
import type { AccountingTransferRecord } from "@/types/accounting-transfers";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PreparedAccountingTransferPageProps = {
  transfer: AccountingTransferRecord;
};

function formatTimestamp(value: string | null) {
  return value ? formatCampusDateTime(new Date(value)) : "Not available";
}

export function PreparedAccountingTransferPage({
  transfer,
}: PreparedAccountingTransferPageProps) {
  const snapshot = transfer.snapshot;

  return (
    <div className="accounting-prepared-transfer">
      <AdminPageHeader
        eyebrow="Prepared Accounting transfer"
        title={transfer.transferId}
        description="A local, read-only transfer snapshot prepared from the persisted Payroll Result."
        actions={(
          <Link href="/accounting/approved-payroll" className="button-secondary">
            <Icon name="arrow" />
            Back to Payroll Results
          </Link>
        )}
      />

      <div className="accounting-prepared-transfer__notice" role="status">
        <Icon name="shield" />
        <div>
          <strong>Prepared locally — not submitted</strong>
          <span>No data has been sent to the external Accounting System. Submission belongs to ACCOUNTING-017B.</span>
        </div>
      </div>

      <div className="accounting-prepared-transfer__status-row">
        <StatusBadge tone={getAccountingTransferTone(transfer.transferStatus)}>
          {getAccountingTransferLabel(transfer.transferStatus)}
        </StatusBadge>
        <span>Source: {snapshot?.source.mode === "simulated-payroll" ? "Simulated Payroll Result" : "Existing Payroll System Result"}</span>
      </div>

      <SectionCard title="Transfer details" eyebrow="Immutable preparation metadata">
        <dl className="accounting-prepared-transfer__details-grid">
          <div><dt>Transfer reference</dt><dd>{transfer.transferId}</dd></div>
          <div><dt>Payroll Result</dt><dd>{transfer.payrollResultId}</dd></div>
          <div><dt>Payroll batch</dt><dd>{transfer.payrollBatchId}</dd></div>
          <div><dt>Payroll handoff</dt><dd>{transfer.payrollHandoffId}</dd></div>
          <div><dt>Payroll period</dt><dd>{transfer.period.label}</dd></div>
          <div><dt>External Payroll reference</dt><dd>{transfer.externalPayrollReference}</dd></div>
          <div><dt>Prepared by</dt><dd>{transfer.preparedBy?.displayName ?? transfer.submittedBy.displayName}</dd></div>
          <div><dt>Prepared at</dt><dd>{formatTimestamp(transfer.preparedAt ?? transfer.submittedAt)}</dd></div>
          <div><dt>Accounting status</dt><dd>{getAccountingTransferLabel(transfer.transferStatus)}</dd></div>
          <div><dt>Record count</dt><dd>{transfer.employeeCount}</dd></div>
        </dl>
      </SectionCard>

      <SectionCard title="Prepared snapshot" eyebrow="Read-only Payroll output">
        {snapshot ? (
          <>
            <dl className="accounting-prepared-transfer__details-grid">
              <div><dt>Result status</dt><dd>{snapshot.payroll.resultStatus}</dd></div>
              <div><dt>Payroll provider</dt><dd>{snapshot.source.provider}</dd></div>
              <div><dt>Processed employees</dt><dd>{snapshot.summary.processedCount}</dd></div>
              <div><dt>Pending employees</dt><dd>{snapshot.summary.pendingCount}</dd></div>
              <div><dt>Rejected employees</dt><dd>{snapshot.summary.rejectedCount}</dd></div>
              <div><dt>Failed employees</dt><dd>{snapshot.summary.failedCount}</dd></div>
              <div><dt>Payslips available</dt><dd>{snapshot.summary.payslipAvailableCount}</dd></div>
              <div><dt>Snapshot items</dt><dd>{snapshot.items.length}</dd></div>
            </dl>

            <div className="accounting-prepared-transfer__items-wrap">
              <table className="data-table accounting-prepared-transfer__items-table">
                <caption className="sr-only">Prepared Payroll Result employee output</caption>
                <thead>
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Department</th>
                    <th scope="col">Processing</th>
                    <th scope="col">Payslip</th>
                    <th scope="col">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.items.map((item) => (
                    <tr key={`${item.employeeId}-${item.externalEmployeeReference}`}>
                      <td>{item.employeeName}<small>{item.employeeId}</small></td>
                      <td>{item.department}</td>
                      <td>{item.processingStatus}</td>
                      <td>{item.payslipStatus}</td>
                      <td>{item.issueSummary ?? "None"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="accounting-prepared-transfer__empty" role="status">
            This transfer predates the local preparation snapshot and has no stored payload to display.
          </p>
        )}
      </SectionCard>

      <p className="accounting-prepared-transfer__boundary-note">
        <Icon name="shield" />
        The snapshot is read-only and contains Payroll output summaries only. No salary calculation, journal entry, or ledger posting is performed here.
      </p>
    </div>
  );
}
