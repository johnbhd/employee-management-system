import type { PayrollBatchRecord } from "@/types/payroll-batches";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PayrollBatchTableProps = {
  batches: readonly PayrollBatchRecord[];
  onView: (batch: PayrollBatchRecord) => void;
  onRecords: (batch: PayrollBatchRecord) => void;
  onReady: (batch: PayrollBatchRecord) => void;
  onSubmit: (batch: PayrollBatchRecord) => void;
};

export function PayrollBatchTable({ batches, onView, onRecords, onReady, onSubmit }: PayrollBatchTableProps) {
  return (
    <div className="payroll-batches__table-wrap">
      <table className="data-table payroll-batches__table">
        <caption className="sr-only">Persistent payroll batches</caption>
        <thead><tr><th scope="col">Batch ID</th><th scope="col">Payroll period</th><th scope="col">Records</th><th scope="col">Departments</th><th scope="col">Created by</th><th scope="col">Created at</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
        <tbody>
          {batches.length > 0 ? batches.map((batch) => (
            <tr key={batch.id}>
              <td><strong>{batch.id}</strong></td><td>{batch.period.label}</td><td>{batch.recordCount}</td><td>{batch.departmentNames.length}</td><td>{batch.createdBy.displayName}</td><td>{formatDate(batch.createdAt)}</td><td><StatusBadge tone={getPayrollBatchTone(batch.status)}>{batch.status}</StatusBadge></td>
              <td><div className="payroll-batches__row-actions"><button type="button" className="button-link" onClick={() => onView(batch)}>View details</button><details className="payroll-batches__row-menu"><summary aria-label={`More actions for ${batch.id}`}><Icon name="menu" /></summary><div><button type="button" onClick={() => onView(batch)}>View details</button><button type="button" onClick={() => onRecords(batch)}>View records</button>{batch.status === "Draft" ? <button type="button" onClick={() => onReady(batch)}>Mark Ready</button> : null}{batch.status === "Ready" ? <button type="button" onClick={() => onSubmit(batch)}>Submit batch</button> : null}</div></details></div></td>
            </tr>
          )) : <tr><td colSpan={8} className="payroll-batches__empty"><strong>No persistent payroll batches match these filters.</strong><span>Create a Draft batch or clear a filter to continue.</span></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function getPayrollBatchTone(status: PayrollBatchRecord["status"]) {
  if (status === "Draft") return "warning" as const;
  if (status === "Ready") return "info" as const;
  if (status === "Submitted" || status === "Acknowledged") return "success" as const;
  return "danger" as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}
