"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { PayrollBatchRecord } from "@/data/payroll/batches";

import { Icon } from "@/components/ui/Icon";

type PayrollBatchFormValues = {
  period: string;
  records: number;
  departments: number;
  createdBy: string;
  notes: string;
};

type PayrollBatchFormModalProps = {
  mode: "create" | "edit";
  batch: PayrollBatchRecord | null;
  periods: readonly string[];
  getNextBatchId: (period: string) => string;
  onCancel: () => void;
  onSubmit: (values: PayrollBatchFormValues) => void;
};

export function PayrollBatchFormModal({
  mode,
  batch,
  periods,
  getNextBatchId,
  onCancel,
  onSubmit,
}: PayrollBatchFormModalProps) {
  const [period, setPeriod] = useState(batch?.period ?? periods[0]);
  const [records, setRecords] = useState(batch ? String(batch.records) : "");
  const [departments, setDepartments] = useState(batch ? String(batch.departments) : "");
  const [createdBy, setCreatedBy] = useState(batch?.createdBy ?? "Maria Santos");
  const [notes, setNotes] = useState(batch?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedRecords = Number(records);
    const parsedDepartments = Number(departments);
    const nextErrors: Record<string, string> = {};

    if (!period) nextErrors.period = "Select a payroll period.";
    if (!Number.isInteger(parsedRecords) || parsedRecords < 1) nextErrors.records = "Enter at least 1 record.";
    if (!Number.isInteger(parsedDepartments) || parsedDepartments < 1) {
      nextErrors.departments = "Enter at least 1 department.";
    } else if (parsedDepartments > 10) {
      nextErrors.departments = "Maximum of 10 departments.";
    } else if (Number.isInteger(parsedRecords) && parsedDepartments > parsedRecords) {
      nextErrors.departments = "Departments cannot exceed the number of records.";
    }
    if (!createdBy.trim()) nextErrors.createdBy = "Created by is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      period,
      records: parsedRecords,
      departments: parsedDepartments,
      createdBy: createdBy.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <div className="payroll-batches__modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="payroll-batches__modal" role="dialog" aria-modal="true" aria-labelledby="payroll-batch-form-title">
        <header className="payroll-batches__modal-header">
          <div>
            <p className="section-kicker">Payroll preparation</p>
            <h2 id="payroll-batch-form-title">{mode === "create" ? "Create batch" : "Edit batch"}</h2>
            <p>{mode === "create" ? "Prepare a new payroll batch as a draft." : batch?.id}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onCancel} aria-label="Close batch form">
            <Icon name="close" />
          </button>
        </header>

        <form className="payroll-batches__form" onSubmit={handleSubmit} noValidate>
          <label>
            <span>Payroll period</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-invalid={Boolean(errors.period)}>
              {periods.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
            {errors.period ? <small>{errors.period}</small> : null}
          </label>
          <label>
            <span>Batch ID</span>
            <input type="text" value={mode === "edit" ? batch?.id ?? "" : getNextBatchId(period)} readOnly />
          </label>
          <div className="payroll-batches__form-row">
            <label>
              <span>Total records</span>
              <input type="number" min="1" value={records} onChange={(event) => setRecords(event.target.value)} placeholder="e.g. 25" aria-invalid={Boolean(errors.records)} />
              {errors.records ? <small>{errors.records}</small> : null}
            </label>
            <label>
              <span>Departments</span>
              <input type="number" min="1" max="10" value={departments} onChange={(event) => setDepartments(event.target.value)} placeholder="e.g. 4" aria-invalid={Boolean(errors.departments)} />
              {errors.departments ? <small>{errors.departments}</small> : null}
            </label>
          </div>
          <label>
            <span>Created by</span>
            <input type="text" value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} aria-invalid={Boolean(errors.createdBy)} />
            {errors.createdBy ? <small>{errors.createdBy}</small> : null}
          </label>
          <label>
            <span>Notes <em>(optional)</em></span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Batch details or remarks" />
          </label>
          <footer className="payroll-batches__modal-footer">
            <button type="button" className="button-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="button-primary">
              <Icon name={mode === "create" ? "layers" : "check"} />
              {mode === "create" ? "Create batch" : "Save changes"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export type { PayrollBatchFormValues };
