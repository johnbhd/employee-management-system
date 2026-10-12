import { Icon } from "@/components/ui/Icon";
import type { PayrollBatchRecord } from "@/types/payroll-batches";

type PayrollBatchSubmitModalProps = {
  batch: PayrollBatchRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
  isBusy?: boolean;
};

export function PayrollBatchSubmitModal({ batch, onCancel, onConfirm, isBusy = false }: PayrollBatchSubmitModalProps) {
  if (!batch) return null;

  return (
    <div className="payroll-batches__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isBusy) onCancel();
    }}>
      <section className="payroll-batches__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-batch-submit-title">
        <header className="payroll-batches__modal-header">
          <div><p className="section-kicker">Payroll handoff preparation</p><h2 id="payroll-batch-submit-title">Submit batch</h2><p>{batch.id}</p></div>
          <button type="button" className="button-secondary" onClick={onCancel} disabled={isBusy} aria-label="Close submit confirmation"><Icon name="close" /></button>
        </header>
        <p className="payroll-batches__confirm-copy">Submit <strong>{batch.recordCount} prepared attendance records</strong> from <strong>{batch.id}</strong> ({batch.period.label})? The persisted batch becomes read-only. External Payroll handoff is handled in the next workflow step.</p>
        <footer className="payroll-batches__modal-footer">
          <button type="button" className="button-secondary" onClick={onCancel} disabled={isBusy}>Cancel</button>
          <button type="button" className="button-primary" onClick={onConfirm} disabled={isBusy}><Icon name="arrow" /> {isBusy ? "Submitting…" : "Confirm submission"}</button>
        </footer>
      </section>
    </div>
  );
}
