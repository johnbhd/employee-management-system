import type { PayrollBatchRecord } from "@/data/payroll/batches";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PayrollBatchTableProps = {
  batches: readonly PayrollBatchRecord[];
  onView: (batch: PayrollBatchRecord) => void;
  onEdit: (batch: PayrollBatchRecord) => void;
  onSubmit: (batch: PayrollBatchRecord) => void;
  onTransfer: (batch: PayrollBatchRecord) => void;
};

export function PayrollBatchTable({ batches, onView, onEdit, onSubmit, onTransfer }: PayrollBatchTableProps) {
  return (
    <div className="payroll-batches__table-wrap">
      <table className="data-table payroll-batches__table">
        <caption className="sr-only">Payroll batches for the selected periods</caption>
        <thead>
          <tr>
            <th scope="col">Batch ID</th>
            <th scope="col">Payroll period</th>
            <th scope="col">Records</th>
            <th scope="col">Departments</th>
            <th scope="col">Created by</th>
            <th scope="col">Created at</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.length > 0 ? batches.map((batch) => (
            <tr key={batch.id}>
              <td><strong>{batch.id}</strong></td>
              <td>{batch.period}</td>
              <td>{batch.records}</td>
              <td>{batch.departments}</td>
              <td>{batch.createdBy}</td>
              <td>{batch.createdAt}</td>
              <td><StatusBadge tone={getBatchTone(batch.status)}>{batch.status}</StatusBadge></td>
              <td>
                <div className="payroll-batches__row-actions">
                  <button type="button" className="button-link" onClick={() => onView(batch)}>View details</button>
                  <details className="payroll-batches__row-menu">
                    <summary aria-label={`More actions for ${batch.id}`}><Icon name="menu" /></summary>
                    <div>
                      <button type="button" onClick={() => onView(batch)}>View details</button>
                      {batch.status !== "Transferred" ? <button type="button" onClick={() => onEdit(batch)}>Edit batch</button> : null}
                      {batch.status === "Draft" || batch.status === "Ready" ? <button type="button" onClick={() => onSubmit(batch)}>Submit to payroll</button> : null}
                      {batch.status === "Transferred" ? <button type="button" onClick={() => onTransfer(batch)}>View transfer status</button> : null}
                    </div>
                  </details>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={8} className="payroll-batches__empty">
                <strong>No batches match your filters.</strong>
                <span>Clear a filter to return to the available payroll-period batches.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function getBatchTone(status: PayrollBatchRecord["status"]) {
  switch (status) {
    case "Draft":
      return "warning" as const;
    case "Ready":
      return "info" as const;
    case "Transferred":
      return "success" as const;
    case "Blocked":
      return "danger" as const;
  }
}
