"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import type { PayrollBatchCandidate, PayrollBatchRecord } from "@/types/payroll-batches";

type PayrollBatchRecordsModalProps = { batch: PayrollBatchRecord | null; candidates: readonly PayrollBatchCandidate[]; onCancel: () => void; onAdd: (employeePeriodIds: string[]) => void; isBusy?: boolean };

export function PayrollBatchRecordsModal({ batch, candidates, onCancel, onAdd, isBusy = false }: PayrollBatchRecordsModalProps) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  if (!batch) return null;
  const availableCandidates = candidates.filter(({ item }) => item.payrollPeriod.start === batch.period.start && item.payrollPeriod.end === batch.period.end);

  function toggle(id: string, checked: boolean) { setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; }); }

  return (
    <div className="payroll-batches__modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isBusy) onCancel(); }}>
      <section className="payroll-batches__modal is-wide" role="dialog" aria-modal="true" aria-labelledby="payroll-batches-add-title">
        <header className="payroll-batches__modal-header"><div><p className="section-kicker">Ready for Payroll</p><h2 id="payroll-batches-add-title">Add records to {batch.id}</h2><p>Only server-verified records for {batch.period.label} are available.</p></div><button type="button" className="button-secondary" onClick={onCancel} disabled={isBusy} aria-label="Close add records dialog"><Icon name="close" /></button></header>
        <div className="payroll-batches__modal-table-wrap"><table className="data-table payroll-batches__summary-table payroll-batches__records-table"><caption className="sr-only">Ready employee-period records available for this batch</caption><thead><tr><th scope="col">Select</th><th scope="col">Employee</th><th scope="col">Department</th><th scope="col">Days present</th><th scope="col">Sources</th></tr></thead><tbody>{availableCandidates.length > 0 ? availableCandidates.map(({ item, sourceAttendanceIds }) => <tr key={item.id}><td><input type="checkbox" checked={selectedIds.has(item.id)} onChange={(event) => toggle(item.id, event.target.checked)} disabled={isBusy} aria-label={`Select ${item.employeeName}`} /></td><td><strong>{item.employeeName}</strong><small>{item.employeeId}</small></td><td>{item.department}</td><td>{item.attendanceSummary.presentDays}</td><td>{sourceAttendanceIds.length}</td></tr>) : <tr><td colSpan={5} className="payroll-batches__empty"><strong>No unassigned Ready for Payroll records.</strong><span>Blocked records and records already in another batch are excluded by the server.</span></td></tr>}</tbody></table></div>
        <footer className="payroll-batches__modal-footer"><span className="payroll-batches__selection-count">{selectedIds.size} selected</span><button type="button" className="button-secondary" onClick={onCancel} disabled={isBusy}>Cancel</button><button type="button" className="button-primary" onClick={() => onAdd(Array.from(selectedIds))} disabled={isBusy || selectedIds.size === 0}><Icon name="layers" /> {isBusy ? "Adding…" : "Add selected"}</button></footer>
      </section>
    </div>
  );
}
