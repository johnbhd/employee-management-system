import type { ReactNode } from "react";

import type { PayrollBatchResult, PayrollResultRecord } from "@/data/payroll/results";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatPayrollResultDate,
  formatPayrollResultDateTime,
  getPayrollPayslipLabel,
  getPayrollPayslipTone,
  getPayrollResultLabel,
  getPayrollResultStatusLabel,
  getPayrollResultStatusTone,
  getPayrollResultTone,
} from "@/data/payroll/results";

type PayrollResultsDetailsModalProps = {
  record: PayrollResultRecord | null;
  batch: PayrollBatchResult | null;
  onClose: () => void;
  onCopyReference: (record: PayrollResultRecord) => void;
};

export function PayrollResultsDetailsModal({ record, batch, onClose, onCopyReference }: PayrollResultsDetailsModalProps) {
  if (!record && !batch) return null;

  const isRecord = Boolean(record);

  return (
    <div className="payroll-results__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="payroll-results__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-results-modal-title">
        <header className="payroll-results__modal-header">
          <div>
            <p className="section-kicker">{isRecord ? "Employee payroll result" : "Batch result"}</p>
            <h2 id="payroll-results-modal-title">{isRecord ? record?.employeeName : batch?.id}</h2>
            <p>{isRecord ? record?.employeeId : "Returned status from the Existing Payroll System."}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose} aria-label="Close payroll result details">
            <Icon name="close" />
          </button>
        </header>

        {record ? (
          <dl className="payroll-results__modal-details">
            <Detail label="Employee ID" value={record.employeeId} />
            <Detail label="Department" value={record.department} />
            <Detail label="Payroll period" value={record.period.label} />
            <Detail label="Payroll reference" value={record.externalPayrollReference ?? "—"} />
            <Detail label="Processing status" value={<StatusBadge tone={getPayrollResultTone(record.processingStatus)}>{getPayrollResultLabel(record.processingStatus)}</StatusBadge>} />
            <Detail label="Payslip status" value={<StatusBadge tone={getPayrollPayslipTone(record.payslipStatus)}>{getPayrollPayslipLabel(record.payslipStatus)}</StatusBadge>} />
            <Detail label="Date released" value={formatPayrollResultDate(record.releasedAt)} />
            <Detail label="Processed at" value={formatPayrollResultDateTime(record.processedAt)} />
            <Detail label="Source batch" value={record.batchId} />
            <Detail label="Transfer ID" value={record.transferId} />
            <Detail label="Issue" value={record.issueSummary ?? "No issue returned"} />
          </dl>
        ) : batch ? (
          <dl className="payroll-results__modal-details">
            <Detail label="Batch ID" value={batch.id} />
            <Detail label="Payroll period" value={batch.period.label} />
            <Detail label="Employees" value={String(batch.employees)} />
            <Detail label="Returned at" value={formatPayrollResultDateTime(batch.returnedAt)} />
            <Detail label="Result status" value={<StatusBadge tone={getPayrollResultStatusTone(batch.resultStatus)}>{getPayrollResultStatusLabel(batch.resultStatus)}</StatusBadge>} />
            <Detail label="Result ID" value={batch.resultId} />
            <Detail label="Transfer ID" value={batch.transferId} />
            <Detail label="Payslips available" value={`${batch.payslipsAvailable} / ${batch.employees}`} />
          </dl>
        ) : null}

        <footer className="payroll-results__modal-footer">
          {record?.externalPayrollReference ? <button type="button" className="button-secondary" onClick={() => onCopyReference(record)}><Icon name="file" /> Copy reference</button> : null}
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
