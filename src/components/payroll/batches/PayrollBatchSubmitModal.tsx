import type { PayrollBatchRecord } from "@/data/payroll/batches";

import { Icon } from "@/components/ui/Icon";

type PayrollBatchSubmitModalProps = {
  batch: PayrollBatchRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PayrollBatchSubmitModal({ batch, onCancel, onConfirm }: PayrollBatchSubmitModalProps) {
  if (!batch) return null;

  return (
    <div className="payroll-batches__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="payroll-batches__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-batch-submit-title">
        <header className="payroll-batches__modal-header">
          <div>
            <p className="section-kicker">Payroll handoff</p>
            <h2 id="payroll-batch-submit-title">Submit to Payroll</h2>
            <p>{batch.id}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onCancel} aria-label="Close submit confirmation">
            <Icon name="close" />
          </button>
        </header>
        <p className="payroll-batches__confirm-copy">
          You are about to submit <strong>{batch.records} attendance records</strong> from <strong>{batch.id}</strong> ({batch.period}) to the Existing Payroll System. Once submitted, this batch can no longer be edited.
        </p>
        <footer className="payroll-batches__modal-footer">
          <button type="button" className="button-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="button-primary" onClick={onConfirm}>
            <Icon name="arrow" /> Confirm &amp; submit
          </button>
        </footer>
      </section>
    </div>
  );
}
