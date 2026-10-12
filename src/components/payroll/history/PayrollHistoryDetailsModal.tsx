import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatPayrollHistoryDateTime,
  getPayrollHistoryAcknowledgementLabel,
  getPayrollHistoryBatchStatusLabel,
  getPayrollHistoryResultStatusLabel,
  getPayrollHistoryTone,
  getPayrollHistoryTransferStatusLabel,
  type PayrollHistoryRecord,
} from "@/data/payroll/history";

type PayrollHistoryDetailsModalProps = {
  record: PayrollHistoryRecord | null;
  onClose: () => void;
};

export function PayrollHistoryDetailsModal({ record, onClose }: PayrollHistoryDetailsModalProps) {
  if (!record) return null;

  const transferStatus = getPayrollHistoryTransferStatusLabel(record.handoff.status);
  const acknowledgement = getPayrollHistoryAcknowledgementLabel(record.handoff.acknowledgementStatus);
  const resultStatus = getPayrollHistoryResultStatusLabel(record.result.status);

  return (
    <div className="payroll-history__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="payroll-history__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-history-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="payroll-history__modal-header">
          <div>
            <p className="section-kicker">Historical payroll lifecycle</p>
            <h2 id="payroll-history-details-title">{record.batchId}</h2>
            <p className="payroll-history__modal-subtitle">{record.period.label}</p>
          </div>
          <button type="button" className="payroll-history__modal-close" onClick={onClose} aria-label="Close batch details">
            <Icon name="close" />
          </button>
        </div>

        <div className="payroll-history__modal-status">
          <span>Lifecycle status</span>
          <StatusBadge tone={getPayrollHistoryTone(record.lifecycleStatus)}>{record.lifecycleStatus}</StatusBadge>
        </div>

        <div className="payroll-history__modal-section">
          <h3>Payroll period summary</h3>
          <dl className="payroll-history__details-list">
            <Detail label="Employees" value={String(record.employeeCount)} />
            <Detail label="Created by" value={record.createdBy.displayName} />
            <Detail label="Created at" value={formatPayrollHistoryDateTime(record.createdAt)} />
            <Detail label="Batch status" value={<StatusBadge tone={getPayrollHistoryTone(record.batchStatus)}>{getPayrollHistoryBatchStatusLabel(record.batchStatus)}</StatusBadge>} />
          </dl>
        </div>

        <div className="payroll-history__modal-section">
          <h3>Batch snapshot</h3>
          <dl className="payroll-history__details-list">
            <Detail label="Included records" value={String(record.batch.includedRecordCount)} />
            <Detail label="Blocked records" value={String(record.batch.blockedRecordCount)} />
            <Detail label="Departments" value={String(record.batch.departmentCount)} />
            <Detail label="Ready at" value={formatPayrollHistoryDateTime(record.batch.readyAt)} />
            <Detail label="Submitted at" value={formatPayrollHistoryDateTime(record.batch.submittedAt)} />
            <Detail label="Notes" value={record.batch.notes ?? "—"} />
          </dl>
        </div>

        <div className="payroll-history__modal-section">
          <h3>Handoff and result</h3>
          <dl className="payroll-history__details-list">
            <Detail label="Transfer ID" value={record.handoff.transferId ?? "—"} />
            <Detail label="Transfer status" value={<StatusBadge tone={getPayrollHistoryTone(transferStatus)}>{transferStatus}</StatusBadge>} />
            <Detail label="Acknowledgement" value={<StatusBadge tone={getPayrollHistoryTone(acknowledgement)}>{acknowledgement}</StatusBadge>} />
            <Detail label="External Payroll reference" value={record.handoff.externalReference ?? record.result.externalReference ?? "—"} />
            <Detail label="Result ID" value={record.result.resultId ?? "—"} />
            <Detail label="Result status" value={<StatusBadge tone={getPayrollHistoryTone(resultStatus)}>{resultStatus}</StatusBadge>} />
            <Detail label="Processed employees" value={`${record.result.processedCount} / ${record.result.employeeCount}`} />
            <Detail label="Pending employees" value={String(record.result.pendingCount)} />
            <Detail label="Rejected employees" value={String(record.result.rejectedCount)} />
            <Detail label="Failed employees" value={String(record.result.failedCount)} />
            <Detail label="Payslips available" value={String(record.result.payslipAvailableCount)} />
            <Detail label="Completed at" value={formatPayrollHistoryDateTime(record.completedAt)} />
          </dl>
        </div>

        <div className="payroll-history__modal-section">
          <h3>Lifecycle timeline</h3>
          {record.timeline.length > 0 ? (
            <ol className="payroll-history__timeline">
              {record.timeline.map((event) => (
                <li key={event.id}>
                  <span className="payroll-history__timeline-dot" aria-hidden="true" />
                  <span><strong>{event.label}</strong><time dateTime={event.occurredAt}>{formatPayrollHistoryDateTime(event.occurredAt)}</time></span>
                </li>
              ))}
            </ol>
          ) : <p className="payroll-history__modal-empty">No persisted lifecycle events are available.</p>}
        </div>

        <div className="payroll-history__modal-section">
          <h3>Historical issues</h3>
          {record.issues.length > 0 ? (
            <ul className="payroll-history__issues">
              {record.issues.map((issue, index) => <li key={`${record.batchId}:issue:${index}`}>{issue}</li>)}
            </ul>
          ) : <p className="payroll-history__modal-empty">No issues were returned for this lifecycle.</p>}
        </div>

        <div className="payroll-history__modal-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
