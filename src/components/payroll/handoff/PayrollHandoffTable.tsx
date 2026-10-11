import type { PayrollHandoffRecord, PayrollReadyBatch } from "@/data/payroll/handoff";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getPayrollHandoffAcknowledgementTone,
  getPayrollHandoffTransferTone,
} from "@/data/payroll/handoff";

type PayrollHandoffTableProps = {
  kind: "ready" | "ongoing" | "history";
  readyBatches?: readonly PayrollReadyBatch[];
  records?: readonly PayrollHandoffRecord[];
  onSubmit?: (batch: PayrollReadyBatch) => void;
  onViewReady?: (batch: PayrollReadyBatch) => void;
  onViewRecord?: (record: PayrollHandoffRecord) => void;
  onRetry?: (record: PayrollHandoffRecord) => void;
  onCopyReference?: (record: PayrollHandoffRecord) => void;
};

export function PayrollHandoffTable({
  kind,
  readyBatches = [],
  records = [],
  onSubmit,
  onViewReady,
  onViewRecord,
  onRetry,
  onCopyReference,
}: PayrollHandoffTableProps) {
  if (kind === "ready") {
    return (
      <div className="payroll-handoff__table-wrap">
        <table className="data-table payroll-handoff__table payroll-handoff__table--ready">
          <caption className="sr-only">Payroll batches ready for handoff</caption>
          <thead>
            <tr>
              <th scope="col">Batch ID</th>
              <th scope="col">Payroll period</th>
              <th scope="col">Employees</th>
              <th scope="col">Departments</th>
              <th scope="col">Created at</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {readyBatches.length > 0 ? readyBatches.map((batch) => (
              <tr key={batch.id}>
                <td><strong>{batch.id}</strong></td>
                <td>{batch.period}</td>
                <td>{batch.employees}</td>
                <td>{batch.departments}</td>
                <td>{batch.createdAt}</td>
                <td>
                  <div className="payroll-handoff__row-actions">
                    <button type="button" className="button-link" onClick={() => onSubmit?.(batch)}>Submit</button>
                    <details className="payroll-handoff__row-menu">
                      <summary aria-label={`More actions for ${batch.id}`}><Icon name="menu" /></summary>
                      <div>
                        <button type="button" onClick={() => onSubmit?.(batch)}>Submit to payroll</button>
                        <button type="button" onClick={() => onViewReady?.(batch)}>View details</button>
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            )) : <EmptyRow colSpan={6} message="No batches are ready for handoff." />}
          </tbody>
        </table>
      </div>
    );
  }

  if (kind === "ongoing") {
    return (
      <div className="payroll-handoff__table-wrap">
        <table className="data-table payroll-handoff__table payroll-handoff__table--ongoing">
          <caption className="sr-only">Payroll batches currently processing</caption>
          <thead>
            <tr>
              <th scope="col">Batch ID</th>
              <th scope="col">Payroll period</th>
              <th scope="col">Employees</th>
              <th scope="col">Submitted at</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? records.map((record) => (
              <tr key={record.id}>
                <td><strong>{record.id}</strong></td>
                <td>{record.period}</td>
                <td>{record.employees}</td>
                <td>{record.submittedAt}</td>
                <td><StatusBadge tone={getPayrollHandoffTransferTone(record.transferStatus)}>{record.transferStatus}</StatusBadge></td>
                <td><RowActions record={record} onViewRecord={onViewRecord} /></td>
              </tr>
            )) : <EmptyRow colSpan={6} message="No batches are currently processing." />}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="payroll-handoff__table-wrap">
      <table className="data-table payroll-handoff__table payroll-handoff__table--history">
        <caption className="sr-only">Payroll handoff history</caption>
        <thead>
          <tr>
            <th scope="col">Batch ID</th>
            <th scope="col">Payroll period</th>
            <th scope="col">Employees</th>
            <th scope="col">Submitted at</th>
            <th scope="col">Transfer status</th>
            <th scope="col">Payroll acknowledgement</th>
            <th scope="col">Reference no.</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? records.map((record) => (
            <tr key={record.id}>
              <td><strong>{record.id}</strong></td>
              <td>{record.period}</td>
              <td>{record.employees}</td>
              <td>{record.submittedAt}</td>
              <td><StatusBadge tone={getPayrollHandoffTransferTone(record.transferStatus)}>{record.transferStatus}</StatusBadge></td>
              <td><StatusBadge tone={getPayrollHandoffAcknowledgementTone(record.acknowledgement)}>{record.acknowledgement}</StatusBadge></td>
              <td>{record.reference}</td>
              <td><RowActions record={record} onViewRecord={onViewRecord} onRetry={onRetry} onCopyReference={onCopyReference} /></td>
            </tr>
          )) : <EmptyRow colSpan={8} message="No handoff activity matches your filters." />}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({
  record,
  onViewRecord,
  onRetry,
  onCopyReference,
}: {
  record: PayrollHandoffRecord;
  onViewRecord?: (record: PayrollHandoffRecord) => void;
  onRetry?: (record: PayrollHandoffRecord) => void;
  onCopyReference?: (record: PayrollHandoffRecord) => void;
}) {
  return (
    <div className="payroll-handoff__row-actions">
      <button type="button" className="button-link" onClick={() => onViewRecord?.(record)}>View details</button>
      <details className="payroll-handoff__row-menu">
        <summary aria-label={`More actions for ${record.id}`}><Icon name="menu" /></summary>
        <div>
          <button type="button" onClick={() => onViewRecord?.(record)}>View details</button>
          {record.transferStatus === "Failed" ? <button type="button" onClick={() => onRetry?.(record)}>Retry transfer</button> : null}
          {record.reference !== "—" ? <button type="button" onClick={() => onCopyReference?.(record)}>Copy reference</button> : null}
        </div>
      </details>
    </div>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="payroll-handoff__empty">
        <strong>{message}</strong>
        <span>There is no additional activity to display right now.</span>
      </td>
    </tr>
  );
}
