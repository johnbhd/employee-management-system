"use client";

import { useEffect, useRef } from "react";

import type { AccountingTransaction } from "@/data/accounting/transaction-history";
import { formatPhilippinePeso } from "@/lib/format-currency";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type TransactionDetailsDialogProps = {
  transaction: AccountingTransaction;
  onClose: () => void;
};

export function TransactionDetailsDialog({
  transaction,
  onClose,
}: TransactionDetailsDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="accounting-transaction-history__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
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
            <h2 id="accounting-transaction-details-title">
              {transaction.transactionReference}
            </h2>
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
            <p>{transaction.detail}</p>
            <StatusBadge tone={transaction.statusTone}>
              {transaction.statusLabel}
            </StatusBadge>
          </div>

          <section aria-labelledby="accounting-transaction-information-title">
            <h3 id="accounting-transaction-information-title">Transaction information</h3>
            <dl className="accounting-transaction-history__details-grid">
              <div>
                <dt>Payroll reference</dt>
                <dd>{transaction.payrollReference}</dd>
              </div>
              <div>
                <dt>Payroll period</dt>
                <dd>{transaction.payrollPeriod}</dd>
              </div>
              <div>
                <dt>Employees</dt>
                <dd>{transaction.employeeCount}</dd>
              </div>
              <div>
                <dt>Approved amount</dt>
                <dd>{formatPhilippinePeso(transaction.approvedAmount)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="accounting-transaction-integration-title">
            <h3 id="accounting-transaction-integration-title">Integration information</h3>
            <dl className="accounting-transaction-history__details-grid">
              <div>
                <dt>Transaction date</dt>
                <dd>{transaction.dateTime}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><StatusBadge tone={transaction.statusTone}>{transaction.statusLabel}</StatusBadge></dd>
              </div>
              <div>
                <dt>Accounting acknowledgement</dt>
                <dd><StatusBadge tone={transaction.acknowledgementTone}>{transaction.acknowledgement}</StatusBadge></dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{transaction.lastUpdatedAt}</dd>
              </div>
            </dl>
            <p className="accounting-transaction-history__acknowledgement-detail">
              {transaction.acknowledgementDetail}
            </p>
          </section>

          {transaction.errorSummary ? (
            <section
              className="accounting-transaction-history__error"
              aria-labelledby="accounting-transaction-error-title"
            >
              <h3 id="accounting-transaction-error-title">Error summary</h3>
              <p>{transaction.errorSummary}</p>
              {transaction.lastAttempt ? <p>Last attempt: {transaction.lastAttempt}</p> : null}
              {transaction.retryStatus ? <p>{transaction.retryStatus}</p> : null}
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
