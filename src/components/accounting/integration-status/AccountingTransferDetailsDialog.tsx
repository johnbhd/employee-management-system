"use client";

import { useEffect, useRef } from "react";

import { getAccountingTransferLabel, getAccountingTransferTone } from "@/data/accounting/approved-payroll";
import type { AccountingTransferRecord } from "@/types/accounting-transfers";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingTransferDetailsDialogProps = {
  transfer: AccountingTransferRecord;
  onClose: () => void;
};

export function AccountingTransferDetailsDialog({
  transfer,
  onClose,
}: AccountingTransferDetailsDialogProps) {
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
      className="accounting-integration-status__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="accounting-integration-status__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accounting-transfer-details-title"
      >
        <header className="accounting-integration-status__modal-header">
          <div>
            <p className="section-kicker">Accounting transfer</p>
            <h2 id="accounting-transfer-details-title">{transfer.transferId}</h2>
          </div>
          <button
            type="button"
            className="accounting-integration-status__modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close Accounting transfer details"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="accounting-integration-status__modal-body">
          <div className="accounting-integration-status__modal-status">
            <StatusBadge tone={getAccountingTransferTone(transfer.transferStatus)}>
              {getAccountingTransferLabel(transfer.transferStatus)}
            </StatusBadge>
            <StatusBadge tone={transfer.acknowledgementStatus === "accepted" ? "success" : "warning"}>
              {transfer.acknowledgementStatus === "accepted" ? "Acknowledged" : transfer.acknowledgementStatus}
            </StatusBadge>
          </div>

          <dl className="accounting-integration-status__details-grid">
            <div><dt>Payroll Result ID</dt><dd>{transfer.payrollResultId}</dd></div>
            <div><dt>Payroll Batch ID</dt><dd>{transfer.payrollBatchId}</dd></div>
            <div><dt>Payroll handoff ID</dt><dd>{transfer.payrollHandoffId}</dd></div>
            <div><dt>Payroll reference</dt><dd>{transfer.externalPayrollReference}</dd></div>
            <div><dt>Accounting reference</dt><dd>{transfer.externalAccountingReference ?? "Not assigned"}</dd></div>
            <div><dt>Payroll period</dt><dd>{transfer.period.label}</dd></div>
            <div><dt>Employees</dt><dd>{transfer.employeeCount}</dd></div>
            <div><dt>Attempt</dt><dd>{transfer.attemptCount}</dd></div>
            <div><dt>Prepared / submitted by</dt><dd>{(transfer.preparedBy ?? transfer.submittedBy).displayName}</dd></div>
            <div><dt>Prepared / submitted at</dt><dd>{new Date(transfer.preparedAt ?? transfer.submittedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</dd></div>
            <div><dt>Provider</dt><dd>{transfer.provider}</dd></div>
          </dl>

          {transfer.failureSummary ? (
            <p className="accounting-integration-status__failure" role="alert">
              <Icon name="warning" /> {transfer.failureSummary}
            </p>
          ) : null}

          <section aria-labelledby="accounting-transfer-timeline-title">
            <h3 id="accounting-transfer-timeline-title">Transfer timeline</h3>
            <ol className="accounting-integration-status__timeline">
              {transfer.timeline.map((event) => (
                <li key={`${event.id}-${event.occurredAt}`}>
                  <span>{event.label}</span>
                  <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</time>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
    </div>
  );
}
