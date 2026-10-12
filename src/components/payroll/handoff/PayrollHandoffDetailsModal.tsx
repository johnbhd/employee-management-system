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
  const title = isReady ? readyBatch?.id : record?.transferId;

  return (
    <div className="payroll-handoff__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="payroll-handoff__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-handoff-details-title">
        <header className="payroll-handoff__modal-header">
          <div>
            <p className="section-kicker">{isReady ? "Batch ready for handoff" : "Handoff details"}</p>
            <h2 id="payroll-handoff-details-title">{title}</h2>
            <p>{isReady ? "This batch passed the server-side handoff checks." : "Persistent transfer status and acknowledgement details."}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose} aria-label="Close handoff details">
            <Icon name="close" />
          </button>
        </header>

        {readyBatch ? (
          <dl className="payroll-handoff__modal-details">
            <Detail label="Payroll period" value={readyBatch.period} />
            <Detail label="Included records" value={String(readyBatch.includedRecords)} />
            <Detail label="Departments" value={String(readyBatch.departments)} />
            <Detail label="Created by" value={readyBatch.createdBy} />
            <Detail label="Created at" value={formatDate(readyBatch.createdAt)} />
            <Detail label="Readiness" value={<StatusBadge tone="info">Ready for handoff</StatusBadge>} />
          </dl>
        ) : record ? (
          <>
            <dl className="payroll-handoff__modal-details">
              <Detail label="Transfer ID" value={record.transferId} />
              <Detail label="Batch ID" value={record.batchId} />
              <Detail label="Payroll period" value={record.period} />
              <Detail label="Employees" value={String(record.employees)} />
              <Detail label="Submitted at" value={formatDate(record.submittedAt)} />
              <Detail label="Submitted by" value={record.submittedBy} />
              <Detail label="Transfer status" value={<StatusBadge tone={getPayrollHandoffTransferTone(record.transferStatus)}>{record.transferStatus}</StatusBadge>} />
              <Detail label="Payroll acknowledgement" value={<StatusBadge tone={getPayrollHandoffAcknowledgementTone(record.acknowledgement)}>{record.acknowledgement}</StatusBadge>} />
              <Detail label="Reference no." value={record.reference} />
              <Detail label="Provider" value={record.provider} />
              <Detail label="Attempts" value={String(record.attemptCount)} />
            </dl>
            <p className="payroll-handoff__response"><strong>Response</strong>{getPayrollHandoffResponse(record)}</p>
            <div className="payroll-handoff__timeline">
              <strong>Timeline</strong>
              {record.timeline.map((event) => <div key={event.id}><span>{event.label}</span><time dateTime={event.occurredAt}>{formatDate(event.occurredAt)}</time></div>)}
            </div>
          </>
        ) : null}

        <footer className="payroll-handoff__modal-footer">
          {record && record.reference.startsWith("SIM-") ? (
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
