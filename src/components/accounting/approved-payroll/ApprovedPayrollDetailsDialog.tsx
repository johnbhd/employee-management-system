"use client";

import { useEffect, useRef } from "react";

import {
  formatAccountingReturnedAmount,
  getAccountingReadinessLabel,
  getAccountingReadinessTone,
  getAccountingTransferLabel,
  getAccountingTransferTone,
} from "@/data/accounting/approved-payroll";
import {
  formatPayrollResultDateTime,
  getPayrollResultStatusLabel,
  getPayrollResultStatusTone,
} from "@/data/payroll/results";
import type { AccountingApprovedPayrollItem } from "@/types/accounting-approved-payroll";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ApprovedPayrollDetailsDialogProps = {
  record: AccountingApprovedPayrollItem;
  onClose: () => void;
};

export function ApprovedPayrollDetailsDialog({
  record,
  onClose,
}: ApprovedPayrollDetailsDialogProps) {
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
      className="accounting-approved-payroll__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
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
            <p className="section-kicker">Payroll result</p>
            <h2 id="approved-payroll-details-title">{record.payrollResultId}</h2>
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
          <p>
            {record.accountingReadiness.status === "ready"
              ? "This completed Payroll Result is ready for a future Accounting handoff."
              : "This Payroll Result is not ready for Accounting handoff."}
          </p>

          <dl className="accounting-approved-payroll__details-grid">
            <div>
              <dt>Payroll period</dt>
              <dd>{record.period.label}</dd>
            </div>
            <div>
              <dt>Payroll result ID</dt>
              <dd>{record.payrollResultId}</dd>
            </div>
            <div>
              <dt>Batch ID</dt>
              <dd>{record.references.batchId}</dd>
            </div>
            <div>
              <dt>Payroll handoff ID</dt>
              <dd>{record.references.payrollTransferId}</dd>
            </div>
            <div>
              <dt>External Payroll reference</dt>
              <dd>{record.references.externalPayrollReference ?? "—"}</dd>
            </div>
            <div>
              <dt>Result status</dt>
              <dd>
                <StatusBadge tone={getPayrollResultStatusTone(record.payrollResultStatus)}>
                  {getPayrollResultStatusLabel(record.payrollResultStatus)}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Employees submitted</dt>
              <dd>{record.employeeCount}</dd>
            </div>
            <div>
              <dt>Processed</dt>
              <dd>{record.processedCount}</dd>
            </div>
            <div>
              <dt>Pending</dt>
              <dd>{record.pendingCount}</dd>
            </div>
            <div>
              <dt>Rejected / failed</dt>
              <dd>{record.rejectedCount + record.failedCount}</dd>
            </div>
            <div>
              <dt>Payslips available</dt>
              <dd>{record.payslipAvailableCount}</dd>
            </div>
            <div>
              <dt>Returned amount</dt>
              <dd>{formatAccountingReturnedAmount(record.returnedAmount)}</dd>
            </div>
            <div>
              <dt>Accounting readiness</dt>
              <dd>
                <StatusBadge tone={getAccountingReadinessTone(record.accountingReadiness.status)}>
                  {getAccountingReadinessLabel(record.accountingReadiness.status)}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Accounting transfer</dt>
              <dd>
                <StatusBadge tone={getAccountingTransferTone(record.accountingTransfer.status)}>
                  {getAccountingTransferLabel(record.accountingTransfer.status)}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{formatPayrollResultDateTime(record.receivedAt)}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{formatPayrollResultDateTime(record.completedAt)}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{record.provider}</dd>
            </div>
          </dl>

          {record.accountingReadiness.reasons.length > 0 ? (
            <section aria-labelledby="approved-payroll-readiness-reasons-title">
              <h3 id="approved-payroll-readiness-reasons-title">Readiness details</h3>
              <ul className="accounting-approved-payroll__reason-list">
                {record.accountingReadiness.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
