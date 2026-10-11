"use client";

import { useEffect, useRef } from "react";

import type { AccountingPayrollBatch } from "@/data/accounting/dashboard";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ApprovedPayrollDetailsDialogProps = {
  batch: AccountingPayrollBatch;
  onClose: () => void;
};

export function ApprovedPayrollDetailsDialog({ batch, onClose }: ApprovedPayrollDetailsDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="accounting-approved-payroll__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="accounting-approved-payroll__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approved-payroll-details-title"
      >
        <div className="accounting-approved-payroll__modal-header">
          <div>
            <p className="section-kicker">Approved payroll record</p>
            <h2 id="approved-payroll-details-title">{batch.payrollReference}</h2>
          </div>
          <button
            type="button"
            className="accounting-approved-payroll__modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close approved payroll details"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="accounting-approved-payroll__modal-body">
          <p>{batch.detail}</p>
          <dl className="accounting-approved-payroll__details-grid">
            <div><dt>Payroll period</dt><dd>{batch.payrollPeriod}</dd></div>
            <div><dt>Employees</dt><dd>{batch.employeeCount}</dd></div>
            <div><dt>Approved amount</dt><dd>{batch.approvedAmount}</dd></div>
            <div><dt>Approval status</dt><dd><StatusBadge tone={batch.approvalTone}>{batch.approvalStatus}</StatusBadge></dd></div>
            <div><dt>Accounting status</dt><dd><StatusBadge tone={batch.accountingTone}>{batch.accountingStatus}</StatusBadge></dd></div>
            <div><dt>Transfer reference</dt><dd>{batch.transferReference}</dd></div>
            <div><dt>Last updated</dt><dd>{batch.updatedAt}</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
