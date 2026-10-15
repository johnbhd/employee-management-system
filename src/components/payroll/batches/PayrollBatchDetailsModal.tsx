import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PayrollBatchRecord } from "@/types/payroll-batches";

import { getPayrollBatchTone } from "./PayrollBatchTable";

export type PayrollBatchDetailsMode = "details" | "records";

type PayrollBatchDetailsModalProps = { batch: PayrollBatchRecord | null; mode: PayrollBatchDetailsMode | null; onClose: () => void; onRemove: (employeePeriodId: string) => void; isBusy?: boolean };

export function PayrollBatchDetailsModal({ batch, mode, onClose, onRemove, isBusy = false }: PayrollBatchDetailsModalProps) {
  if (!batch || !mode) return null;

  return (
    <div className="payroll-batches__modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isBusy) onClose(); }}>
      <section className={`payroll-batches__modal ${mode === "records" ? "is-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="payroll-batches-modal-title">
        <header className="payroll-batches__modal-header"><div><p className="section-kicker">{mode === "records" ? "Immutable batch snapshot" : "Batch details"}</p><h2 id="payroll-batches-modal-title">{batch.id}</h2><p>{batch.recordCount} attendance records · {batch.period.label}</p></div><button type="button" className="button-secondary" onClick={onClose} disabled={isBusy} aria-label="Close batch details"><Icon name="close" /></button></header>
        {mode === "records" ? <div className="payroll-batches__modal-table-wrap"><table className="data-table payroll-batches__summary-table payroll-batches__records-table"><caption className="sr-only">Employee snapshots included in {batch.id}</caption><thead><tr><th scope="col">Employee</th><th scope="col">Department</th><th scope="col">Days present</th><th scope="col">Verified source records</th><th scope="col">Snapshot</th><th scope="col">Action</th></tr></thead><tbody>{batch.includedRecords.length > 0 ? batch.includedRecords.map((record) => <tr key={record.employeePeriodId}><td><strong>{record.employeeName}</strong><small>{record.employeeId}</small></td><td>{record.department}</td><td>{record.presentDays}</td><td>{record.sourceAttendanceIds.length}</td><td>{record.attendanceSnapshot ? <span className="payroll-batches__read-only">Frozen</span> : <span className="payroll-batches__read-only">Draft</span>}</td><td>{batch.status === "Draft" ? <button type="button" className="button-link" onClick={() => onRemove(record.employeePeriodId)} disabled={isBusy}>Remove</button> : <span className="payroll-batches__read-only">Read-only</span>}</td></tr>) : <tr><td colSpan={6} className="payroll-batches__empty">No records have been added yet.</td></tr>}</tbody></table></div> : <dl className="payroll-batches__modal-details"><div><dt>Payroll period</dt><dd>{batch.period.label}</dd></div><div><dt>Records</dt><dd>{batch.recordCount}</dd></div><div><dt>Blocked records</dt><dd>{batch.blockedCount}</dd></div><div><dt>Departments</dt><dd>{batch.departmentNames.length ? batch.departmentNames.join(", ") : "None yet"}</dd></div><div><dt>Created by</dt><dd>{batch.createdBy.displayName}</dd></div><div><dt>Created at</dt><dd>{formatDate(batch.createdAt)}</dd></div><div><dt>Updated at</dt><dd>{formatDate(batch.updatedAt)}</dd></div><div><dt>Status</dt><dd><StatusBadge tone={getPayrollBatchTone(batch.status)}>{batch.status}</StatusBadge></dd></div>{batch.frozenAt ? <div><dt>Frozen at</dt><dd>{formatDate(batch.frozenAt)}</dd></div> : null}{batch.frozenBy ? <div><dt>Frozen by</dt><dd>{batch.frozenBy.displayName}</dd></div> : null}{batch.submittedAt ? <div><dt>Submitted at</dt><dd>{formatDate(batch.submittedAt)}</dd></div> : null}{batch.notes ? <div><dt>Notes</dt><dd>{batch.notes}</dd></div> : null}</dl>}
        <footer className="payroll-batches__modal-footer">{mode === "records" ? <Link className="button-secondary" href="/payroll/verified-attendance" onClick={onClose}><Icon name="users" /> Open Verified Attendance</Link> : null}<button type="button" className="button-secondary" onClick={onClose} disabled={isBusy}>Close</button></footer>
      </section>
    </div>
  );
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value)); }
