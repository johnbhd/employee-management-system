"use client";

import { useEffect, useRef, useState } from "react";

import { formatAccountingReturnedAmount } from "@/data/accounting/approved-payroll";
import { formatCampusDateTime } from "@/lib/campus-time";
import type { AccountingDashboardPayroll } from "@/types/accounting-dashboard";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { getAccountingStatusTone } from "./LatestApprovedPayroll";

type AccountingBatchDetailsProps = {
  batch: AccountingDashboardPayroll;
};

export function AccountingBatchDetails({ batch }: AccountingBatchDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function closeModal() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        type="button"
        className="button-link accounting-dashboard__details-trigger"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        View details
        <Icon name="arrow" />
      </button>
      {isOpen ? (
        <div
          className="accounting-dashboard__modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeModal();
          }}
        >
          <section
            className="accounting-dashboard__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`accounting-batch-${batch.payrollResultId}`}
          >
            <div className="accounting-dashboard__modal-header">
              <div>
                <p className="section-kicker">Payroll Result details</p>
                <h2 id={`accounting-batch-${batch.payrollResultId}`}>
                  {batch.payrollReference}
                </h2>
              </div>
              <button
                type="button"
                className="accounting-dashboard__modal-close"
                onClick={closeModal}
                ref={closeButtonRef}
                aria-label="Close Payroll Result details"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="accounting-dashboard__modal-body">
              <p>{batch.detail}</p>
              <dl className="accounting-dashboard__modal-details">
                <div>
                  <dt>Payroll Result ID</dt>
                  <dd>{batch.payrollResultId}</dd>
                </div>
                <div>
                  <dt>Payroll period</dt>
                  <dd>{batch.payrollPeriod.label}</dd>
                </div>
                <div>
                  <dt>Employees</dt>
                  <dd>{batch.employeeCount}</dd>
                </div>
                <div>
                  <dt>Returned amount</dt>
                  <dd>{formatAccountingReturnedAmount(batch.returnedAmount)}</dd>
                </div>
                <div>
                  <dt>Payroll result status</dt>
                  <dd>
                    <StatusBadge tone={getPayrollStatusTone(batch.payrollStatus)}>
                      {getPayrollStatusLabel(batch.payrollStatus)}
                    </StatusBadge>
                  </dd>
                </div>
                <div>
                  <dt>Accounting status</dt>
                  <dd>
                    <StatusBadge tone={getAccountingStatusTone(batch.accountingStatus)}>
                      {batch.accountingStatus}
                    </StatusBadge>
                  </dd>
                </div>
                <div>
                  <dt>Transfer ID</dt>
                  <dd>{batch.transferId ?? "Not transferred"}</dd>
                </div>
                <div>
                  <dt>Accounting reference</dt>
                  <dd>{batch.transferReference ?? "Not returned"}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>
                    <time dateTime={batch.lastUpdatedAt}>
                      {formatCampusDateTime(new Date(batch.lastUpdatedAt))}
                    </time>
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function getPayrollStatusLabel(status: AccountingDashboardPayroll["payrollStatus"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "completed_with_issues":
      return "Completed with issues";
    case "partially_completed":
      return "Partially completed";
    case "processing":
      return "Processing";
    case "rejected":
      return "Rejected";
    case "failed":
      return "Failed";
  }
}

function getPayrollStatusTone(status: AccountingDashboardPayroll["payrollStatus"]) {
  if (status === "completed") return "success" as const;
  if (status === "processing") return "warning" as const;
  return "danger" as const;
}
