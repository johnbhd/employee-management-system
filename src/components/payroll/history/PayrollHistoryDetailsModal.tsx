import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPayrollHistoryTone, type PayrollHistoryRecord } from "@/data/payroll/history";

type PayrollHistoryDetailsModalProps = {
  record: PayrollHistoryRecord | null;
  onClose: () => void;
};

export function PayrollHistoryDetailsModal({ record, onClose }: PayrollHistoryDetailsModalProps) {
  if (!record) return null;

  return (
    <div className="payroll-history__modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="payroll-history__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-history-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="payroll-history__modal-header">
          <div>
            <p className="section-kicker">Historical batch details</p>
            <h2 id="payroll-history-details-title">{record.id}</h2>
          </div>
          <button type="button" className="payroll-history__modal-close" onClick={onClose} aria-label="Close batch details">
            <Icon name="close" />
          </button>
        </div>
        <p className="payroll-history__modal-description">{record.note}</p>
        <dl className="payroll-history__details-list">
          <div><dt>Payroll period</dt><dd>{record.period}</dd></div>
          <div><dt>Employees</dt><dd>{record.employees}</dd></div>
          <div><dt>Created by</dt><dd>{record.createdBy}</dd></div>
          <div><dt>Created at</dt><dd>{record.createdAt}</dd></div>
          <div><dt>Batch status</dt><dd><StatusBadge tone={getPayrollHistoryTone(record.batchStatus)}>{record.batchStatus}</StatusBadge></dd></div>
          <div><dt>Transfer status</dt><dd><StatusBadge tone={getPayrollHistoryTone(record.transferStatus)}>{record.transferStatus}</StatusBadge></dd></div>
          <div><dt>Payroll acknowledgement</dt><dd><StatusBadge tone={getPayrollHistoryTone(record.acknowledgement)}>{record.acknowledgement}</StatusBadge></dd></div>
          <div><dt>Result status</dt><dd><StatusBadge tone={getPayrollHistoryTone(record.resultStatus)}>{record.resultStatus}</StatusBadge></dd></div>
        </dl>
        <div className="payroll-history__modal-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}
