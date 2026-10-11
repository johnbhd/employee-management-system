import type { PayrollHandoffRecord, PayrollReadyBatch } from "@/data/payroll/handoff";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getPayrollHandoffAcknowledgementTone,
  getPayrollHandoffResponse,
  getPayrollHandoffTransferTone,
} from "@/data/payroll/handoff";

type PayrollHandoffDetailsModalProps = {
  readyBatch: PayrollReadyBatch | null;
  record: PayrollHandoffRecord | null;
  onClose: () => void;
  onSubmitReady?: (batch: PayrollReadyBatch) => void;
  onCopyReference?: (record: PayrollHandoffRecord) => void;
};

export function PayrollHandoffDetailsModal({
  readyBatch,
  record,
  onClose,
  onSubmitReady,
  onCopyReference,
}: PayrollHandoffDetailsModalProps) {
  if (!readyBatch && !record) return null;

  const isReady = Boolean(readyBatch);
  const title = isReady ? readyBatch?.id : record?.id;

  return (
    <div className="payroll-handoff__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="payroll-handoff__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-handoff-details-title">
        <header className="payroll-handoff__modal-header">
          <div>
            <p className="section-kicker">{isReady ? "Batch ready for handoff" : "Handoff details"}</p>
            <h2 id="payroll-handoff-details-title">{title}</h2>
            <p>{isReady ? "This batch is prepared for submission." : "Transfer status and acknowledgement from the Existing Payroll System."}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose} aria-label="Close handoff details">
            <Icon name="close" />
          </button>
        </header>

        {readyBatch ? (
          <dl className="payroll-handoff__modal-details">
            <Detail label="Payroll period" value={readyBatch.period} />
            <Detail label="Employees" value={String(readyBatch.employees)} />
            <Detail label="Departments" value={String(readyBatch.departments)} />
            <Detail label="Created at" value={readyBatch.createdAt} />
            <Detail label="Readiness" value={<StatusBadge tone="info">Ready for handoff</StatusBadge>} />
          </dl>
        ) : record ? (
          <>
            <dl className="payroll-handoff__modal-details">
              <Detail label="Batch ID" value={record.id} />
              <Detail label="Payroll period" value={record.period} />
              <Detail label="Employees" value={String(record.employees)} />
              <Detail label="Submitted at" value={record.submittedAt} />
              <Detail label="Transfer status" value={<StatusBadge tone={getPayrollHandoffTransferTone(record.transferStatus)}>{record.transferStatus}</StatusBadge>} />
              <Detail label="Payroll acknowledgement" value={<StatusBadge tone={getPayrollHandoffAcknowledgementTone(record.acknowledgement)}>{record.acknowledgement}</StatusBadge>} />
              <Detail label="Reference no." value={record.reference} />
            </dl>
            <p className="payroll-handoff__response"><strong>Response</strong>{getPayrollHandoffResponse(record)}</p>
          </>
        ) : null}

        <footer className="payroll-handoff__modal-footer">
          {record && record.reference !== "—" ? (
            <button type="button" className="button-secondary" onClick={() => onCopyReference?.(record)}>
              <Icon name="file" /> Copy reference
            </button>
          ) : null}
          {readyBatch ? (
            <button type="button" className="button-primary" onClick={() => onSubmitReady?.(readyBatch)}>
              <Icon name="arrow" /> Submit to payroll
            </button>
          ) : null}
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
