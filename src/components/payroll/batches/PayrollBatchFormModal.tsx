"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Icon } from "@/components/ui/Icon";
import type { PayrollBatchPeriod } from "@/types/payroll-batches";

export type PayrollBatchFormValues = {
  periodStart: string;
  periodEnd: string;
  notes: string;
};

type PayrollBatchFormModalProps = {
  defaultPeriod: PayrollBatchPeriod;
  onCancel: () => void;
  onSubmit: (values: PayrollBatchFormValues) => void;
  isBusy?: boolean;
};

export function PayrollBatchFormModal({ defaultPeriod, onCancel, onSubmit, isBusy = false }: PayrollBatchFormModalProps) {
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.end);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) onCancel();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isBusy, onCancel]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!periodStart || !periodEnd || periodStart > periodEnd) {
      setError("Choose a valid start and end date for the payroll period.");
      return;
    }
    setError("");
    onSubmit({ periodStart, periodEnd, notes: notes.trim() });
  }

  return (
    <div className="payroll-batches__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isBusy) onCancel();
    }}>
      <section className="payroll-batches__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-batch-form-title">
        <header className="payroll-batches__modal-header">
          <div>
            <p className="section-kicker">Payroll preparation</p>
            <h2 id="payroll-batch-form-title">Create batch</h2>
            <p>Start an empty Draft batch, then add only Ready for Payroll records.</p>
          </div>
          <button type="button" className="button-secondary" onClick={onCancel} disabled={isBusy} aria-label="Close batch form"><Icon name="close" /></button>
        </header>
        <form className="payroll-batches__form" onSubmit={handleSubmit} noValidate>
          <div className="payroll-batches__form-row">
            <label><span>Period start</span><input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} disabled={isBusy} /></label>
            <label><span>Period end</span><input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} disabled={isBusy} /></label>
          </div>
          {error ? <p className="payroll-batches__form-error" role="alert">{error}</p> : null}
          <label><span>Notes <em>(optional)</em></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Batch preparation notes" disabled={isBusy} /></label>
          <footer className="payroll-batches__modal-footer">
            <button type="button" className="button-secondary" onClick={onCancel} disabled={isBusy}>Cancel</button>
            <button type="submit" className="button-primary" disabled={isBusy}><Icon name="layers" /> {isBusy ? "Creating…" : "Create draft"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
