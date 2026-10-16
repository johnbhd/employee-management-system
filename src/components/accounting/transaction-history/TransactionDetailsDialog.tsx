"use client";

import { useEffect, useRef } from "react";

import type {
  AccountingAcknowledgementStatus,
  AccountingTransferStatus,
} from "@/types/accounting-transfers";
import type {
  AccountingTransactionHistoryDetail,
  AccountingTransactionHistoryItem,
} from "@/types/accounting-transaction-history";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type TransactionDetailsDialogProps = {
  transaction: AccountingTransactionHistoryItem;
  detail: AccountingTransactionHistoryDetail | null;
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function getTransferStatusLabel(status: AccountingTransferStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getTransferStatusTone(status: AccountingTransferStatus) {
  if (status === "failed") return "danger" as const;
  if (status === "submitted" || status === "prepared") return "success" as const;
  return "warning" as const;
}

function getAcknowledgementLabel(status: AccountingAcknowledgementStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "not_received":
      return "Not received";
  }
}

function getAcknowledgementTone(status: AccountingAcknowledgementStatus) {
  if (status === "accepted") return "success" as const;
  if (status === "rejected" || status === "not_received") return "danger" as const;
  return "warning" as const;
}

function getLifecycleTone(status: AccountingTransactionHistoryItem["lifecycleStatus"]) {
  if (status === "Completed") return "success" as const;
  if (status === "Failed" || status === "Rejected") return "danger" as const;
  if (status === "Not Received") return "warning" as const;
  if (status === "Awaiting Acknowledgement") return "warning" as const;
  return "info" as const;
}

export function TransactionDetailsDialog({
  transaction,
  detail,
  isLoading,
  error,
  onRetry,
  onClose,
}: TransactionDetailsDialogProps) {
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
      className="accounting-transaction-history__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="accounting-transaction-history__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accounting-transaction-details-title"
      >
        <div className="accounting-transaction-history__modal-header">
          <div>
            <p className="section-kicker">Accounting transaction</p>
            <h2 id="accounting-transaction-details-title">{transaction.transferId}</h2>
          </div>
          <button
            type="button"
            className="accounting-transaction-history__modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close transaction details"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="accounting-transaction-history__modal-body">
          <div className="accounting-transaction-history__modal-status">
            <p>
              This read-only history record reflects a Payroll Result handoff to the Existing Accounting System.
            </p>
            <StatusBadge tone={getLifecycleTone(transaction.lifecycleStatus)}>
              {transaction.lifecycleStatus}
            </StatusBadge>
          </div>

          {isLoading ? (
            <p className="accounting-transaction-history__modal-message" role="status">
              Loading the persisted transaction details...
            </p>
          ) : null}

          {error ? (
            <div className="accounting-transaction-history__error" role="alert">
              <h3>Details unavailable</h3>
              <p>{error}</p>
              <button type="button" className="button-link" onClick={onRetry}>Try again</button>
            </div>
          ) : null}

          {detail ? (
            <>
              <section aria-labelledby="accounting-transaction-payroll-title">
                <h3 id="accounting-transaction-payroll-title">Payroll Result summary</h3>
                <dl className="accounting-transaction-history__details-grid">
                  <div><dt>Payroll Result ID</dt><dd>{detail.payrollResultId}</dd></div>
                  <div><dt>Payroll period</dt><dd>{detail.payrollPeriod.label}</dd></div>
                  <div><dt>Payroll Batch ID</dt><dd>{detail.payrollBatchId}</dd></div>
                  <div><dt>Payroll Handoff ID</dt><dd>{detail.payrollHandoffId}</dd></div>
                  <div><dt>Payroll reference</dt><dd>{detail.payrollReference ?? "—"}</dd></div>
                  <div><dt>Result status</dt><dd>{detail.payrollResultStatus ?? "Unavailable"}</dd></div>
                  <div><dt>Employees</dt><dd>{detail.payrollResult?.employeeCount ?? detail.employeeCount}</dd></div>
                  <div><dt>Processed</dt><dd>{detail.payrollResult?.processedCount ?? "—"}</dd></div>
                  <div><dt>Returned at</dt><dd>{formatDateTime(detail.payrollResult?.completedAt ?? detail.payrollResult?.receivedAt ?? null)}</dd></div>
                </dl>
              </section>

              <section aria-labelledby="accounting-transaction-transfer-title">
                <h3 id="accounting-transaction-transfer-title">Accounting transfer summary</h3>
                <dl className="accounting-transaction-history__details-grid">
                  <div><dt>Accounting Transfer ID</dt><dd>{detail.transferId}</dd></div>
                  <div><dt>Prepared / submitted by</dt><dd>{(detail.preparedBy ?? detail.submittedBy).displayName}</dd></div>
                  <div><dt>Prepared / submitted at</dt><dd>{formatDateTime(detail.preparedAt ?? detail.submittedAt)}</dd></div>
                  <div><dt>Transfer status</dt><dd><StatusBadge tone={getTransferStatusTone(detail.transferStatus)}>{getTransferStatusLabel(detail.transferStatus)}</StatusBadge></dd></div>
                  <div><dt>Provider</dt><dd>{detail.provider}</dd></div>
                  <div><dt>Attempt count</dt><dd>{detail.attemptCount}</dd></div>
                </dl>
              </section>

              <section aria-labelledby="accounting-transaction-acknowledgement-title">
                <h3 id="accounting-transaction-acknowledgement-title">Acknowledgement</h3>
                <dl className="accounting-transaction-history__details-grid">
                  <div><dt>Status</dt><dd><StatusBadge tone={getAcknowledgementTone(detail.acknowledgementStatus)}>{getAcknowledgementLabel(detail.acknowledgementStatus)}</StatusBadge></dd></div>
                  <div><dt>Acknowledged at</dt><dd>{formatDateTime(detail.acknowledgedAt)}</dd></div>
                  <div><dt>Accounting reference</dt><dd>{detail.accountingReference ?? "—"}</dd></div>
                  <div><dt>Completed / failed at</dt><dd>{formatDateTime(detail.completedAt)}</dd></div>
                </dl>
              </section>

              <section aria-labelledby="accounting-transaction-timeline-title">
                <h3 id="accounting-transaction-timeline-title">Timeline</h3>
                <ol className="accounting-transaction-history__timeline">
                  {detail.timeline.map((event) => (
                    <li key={`${event.id}-${event.occurredAt}`}>
                      <span>{event.label}</span>
                      <time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time>
                    </li>
                  ))}
                </ol>
              </section>

              {detail.issueSummary ? (
                <section
                  className="accounting-transaction-history__error"
                  aria-labelledby="accounting-transaction-error-title"
                >
                  <h3 id="accounting-transaction-error-title">Issue summary</h3>
                  <p>{detail.issueSummary}</p>
                  {detail.failureCode ? <p>Failure code: {detail.failureCode}</p> : null}
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
