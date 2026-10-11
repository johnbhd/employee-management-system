import type { PayrollHandoffRecord } from "@/data/payroll/handoff";

import { Icon } from "@/components/ui/Icon";

type PayrollHandoffRetryModalProps = {
  record: PayrollHandoffRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PayrollHandoffRetryModal({ record, onCancel, onConfirm }: PayrollHandoffRetryModalProps) {
  if (!record) return null;

  return (
    <div className="payroll-handoff__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="payroll-handoff__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-handoff-retry-title">
        <header className="payroll-handoff__modal-header">
          <div>
            <p className="section-kicker">Failed transfer</p>
            <h2 id="payroll-handoff-retry-title">Retry Transfer</h2>
            <p>{record.id}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onCancel} aria-label="Close retry confirmation">
            <Icon name="close" />
          </button>
        </header>
        <p className="payroll-handoff__confirm-copy">
          Re-queue <strong>{record.id}</strong> ({record.employees} employees, {record.period}) for transfer? It will return to Processing while it awaits a new acknowledgement. This prototype does not contact a real payroll system.
        </p>
        <footer className="payroll-handoff__modal-footer">
          <button type="button" className="button-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="button-primary" onClick={onConfirm}>
            <Icon name="refresh" /> Retry transfer
          </button>
        </footer>
      </section>
    </div>
  );
}
