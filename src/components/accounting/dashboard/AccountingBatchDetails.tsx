"use client";

import { useEffect, useRef, useState } from "react";

import type { AccountingPayrollBatch } from "@/data/accounting/dashboard";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingBatchDetailsProps = {
  batch: AccountingPayrollBatch;
};

export function AccountingBatchDetails({ batch }: AccountingBatchDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
            if (event.currentTarget === event.target) {
              closeModal();
            }
          }}
        >
          <section
            className="accounting-dashboard__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`accounting-batch-${batch.payrollReference}`}
          >
            <div className="accounting-dashboard__modal-header">
              <div>
                <p className="section-kicker">Payroll batch details</p>
                <h2 id={`accounting-batch-${batch.payrollReference}`}>{batch.payrollReference}</h2>
              </div>
              <button
                type="button"
                className="accounting-dashboard__modal-close"
                onClick={closeModal}
                ref={closeButtonRef}
                aria-label="Close payroll batch details"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="accounting-dashboard__modal-body">
              <p>{batch.detail}</p>
              <dl className="accounting-dashboard__modal-details">
                <div>
                  <dt>Payroll period</dt>
                  <dd>{batch.payrollPeriod}</dd>
                </div>
                <div>
                  <dt>Employees</dt>
                  <dd>{batch.employeeCount}</dd>
                </div>
                <div>
                  <dt>Approved amount</dt>
                  <dd>{batch.approvedAmount}</dd>
                </div>
                <div>
                  <dt>Approval status</dt>
                  <dd><StatusBadge tone={batch.approvalTone}>{batch.approvalStatus}</StatusBadge></dd>
                </div>
                <div>
                  <dt>Accounting status</dt>
                  <dd><StatusBadge tone={batch.accountingTone}>{batch.accountingStatus}</StatusBadge></dd>
                </div>
                <div>
                  <dt>Transfer reference</dt>
                  <dd>{batch.transferReference}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
