import Link from "next/link";

import {
  getPayrollBatchBreakdown,
  getPayrollBatchTone,
  type PayrollBatchRecord,
} from "@/data/payroll/batches";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PayrollBatchDetailsMode = "details" | "records" | "transfer";

type PayrollBatchDetailsModalProps = {
  batch: PayrollBatchRecord | null;
  mode: PayrollBatchDetailsMode | null;
  onClose: () => void;
};

function getTitle(mode: PayrollBatchDetailsMode) {
  switch (mode) {
    case "details":
      return "Batch details";
    case "records":
      return "Batch records";
    case "transfer":
      return "Transfer status";
  }
}

export function PayrollBatchDetailsModal({
  batch,
  mode,
  onClose,
}: PayrollBatchDetailsModalProps) {
  if (!batch || !mode) return null;

  const breakdown = getPayrollBatchBreakdown(batch);
  const statusTone = getPayrollBatchTone(batch.status);

  return (
    <div
      className="payroll-batches__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`payroll-batches__modal ${mode === "records" ? "is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-batches-modal-title"
      >
        <header className="payroll-batches__modal-header">
          <div>
            <p className="section-kicker">{getTitle(mode)}</p>
            <h2 id="payroll-batches-modal-title">
              {mode === "transfer" ? "Existing Payroll System" : batch.id}
            </h2>
            <p>{mode === "transfer" ? batch.id : `${batch.records} attendance records · ${batch.period}`}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose} aria-label="Close batch details">
            <Icon name="close" />
          </button>
        </header>

        {mode === "transfer" ? (
          <dl className="payroll-batches__modal-details">
            <div><dt>Status</dt><dd><StatusBadge tone="success">Transferred</StatusBadge></dd></div>
            <div><dt>Records transferred</dt><dd>{batch.records}</dd></div>
            <div><dt>Destination</dt><dd>Existing Payroll System</dd></div>
            <div><dt>Handoff</dt><dd>Completed</dd></div>
          </dl>
        ) : mode === "records" ? (
          <div className="payroll-batches__modal-table-wrap">
            <table className="data-table payroll-batches__summary-table">
              <caption className="sr-only">Attendance records by department in {batch.id}</caption>
              <thead><tr><th scope="col">Department</th><th scope="col">Records</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {breakdown.map((item) => (
                  <tr key={item.department}>
                    <td>{item.department}</td>
                    <td>{item.records}</td>
                    <td><StatusBadge tone={statusTone}>{getDepartmentStatus(batch.status)}</StatusBadge></td>
                  </tr>
                ))}
                <tr className="payroll-batches__total-row">
                  <td>Total</td>
                  <td>{batch.records}</td>
                  <td><StatusBadge tone={statusTone}>{getDepartmentStatus(batch.status)}</StatusBadge></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <dl className="payroll-batches__modal-details">
            <div><dt>Batch ID</dt><dd>{batch.id}</dd></div>
            <div><dt>Payroll period</dt><dd>{batch.period}</dd></div>
            <div><dt>Records</dt><dd>{batch.records}</dd></div>
            <div><dt>Departments</dt><dd>{batch.departments}</dd></div>
            <div><dt>Created by</dt><dd>{batch.createdBy}</dd></div>
            <div><dt>Created at</dt><dd>{batch.createdAt}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge tone={statusTone}>{batch.status}</StatusBadge></dd></div>
            {batch.notes ? <div><dt>Notes</dt><dd>{batch.notes}</dd></div> : null}
          </dl>
        )}

        <footer className="payroll-batches__modal-footer">
          {mode === "records" ? (
            <Link className="button-primary" href="/payroll/verified-attendance" onClick={onClose}>
              <Icon name="users" /> Open Verified Attendance
            </Link>
          ) : null}
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
}

function getDepartmentStatus(status: PayrollBatchRecord["status"]) {
  if (status === "Blocked") return "Blocked";
  if (status === "Transferred") return "Transferred";
  return "Ready";
}

export type { PayrollBatchDetailsMode };
