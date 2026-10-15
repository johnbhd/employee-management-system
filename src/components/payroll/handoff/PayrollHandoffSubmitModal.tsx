import type { PayrollReadyBatch } from "@/data/payroll/handoff";

import { Icon } from "@/components/ui/Icon";

type PayrollHandoffSubmitModalProps = {
  batch: PayrollReadyBatch | null;
  onCancel: () => void;
  onConfirm: () => void;
  isBusy?: boolean;
};

export function PayrollHandoffSubmitModal({ batch, onCancel, onConfirm, isBusy = false }: PayrollHandoffSubmitModalProps) {
  if (!batch) return null;

  return (
    <div className="payroll-handoff__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isBusy) onCancel();
    }}>
      <section className="payroll-handoff__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-handoff-submit-title">
        <header className="payroll-handoff__modal-header">
          <div>
            <p className="section-kicker">Payroll handoff</p>
            <h2 id="payroll-handoff-submit-title">Submit to Existing Payroll</h2>
            <p>{batch.id}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onCancel} disabled={isBusy} aria-label="Close submit confirmation">
            <Icon name="close" />
          </button>
        </header>
        <p className="payroll-handoff__confirm-copy">
          You are about to submit <strong>{batch.includedRecords} prepared attendance records</strong> from <strong>{batch.id}</strong> ({batch.period}) for handoff. The server will revalidate the batch snapshot before invoking the configured payroll integration adapter.
        </p>
        <footer className="payroll-handoff__modal-footer">
          <button type="button" className="button-secondary" onClick={onCancel} disabled={isBusy}>Cancel</button>
          <button type="button" className="button-primary" onClick={onConfirm} disabled={isBusy}>
            <Icon name="arrow" /> {isBusy ? "Submitting…" : "Confirm & submit"}
          </button>
        </footer>
      </section>
    </div>
  );
}
