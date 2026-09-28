"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { EmployeePayslip } from "@/data/employee-payslips";
import { employeeAttendanceProfile } from "@/data/my-attendance";

type PayslipDetailsModalProps = {
  payslip: EmployeePayslip | null;
  onClose: () => void;
};

export function PayslipDetailsModal({
  payslip,
  onClose,
}: PayslipDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!payslip) {
      return;
    }

    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, payslip]);

  if (!payslip) {
    return null;
  }

  return (
    <div className="employee-payslip-modal-layer">
      <button
        type="button"
        className="employee-payslip-modal-backdrop"
        onClick={onClose}
        aria-label="Close payslip details"
      />

      <section
        className="employee-payslip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-payslip-modal-title"
      >
        <header className="employee-payslip-modal-header">
          <div className="employee-payslip-modal-heading">
            <span className="employee-payslips-heading-label">
              Payroll record
            </span>
            <h2 id="employee-payslip-modal-title">Payslip Details</h2>
            <p>{payslip.payrollPeriod}</p>
          </div>

          <div className="employee-payslip-modal-header-actions">
            <StatusBadge tone={payslip.statusTone}>
              {payslip.statusLabel}
            </StatusBadge>
            <button
              type="button"
              className="employee-payslip-modal-close"
              onClick={onClose}
              ref={closeButtonRef}
              aria-label="Close payslip details"
            >
              <Icon name="close" />
            </button>
          </div>
        </header>

        <div className="employee-payslip-modal-body">
          <section
            className="employee-payslip-modal-section"
            aria-labelledby="employee-payslip-employee-heading"
          >
            <ModalSectionHeading
              id="employee-payslip-employee-heading"
              eyebrow="Employee"
              title="Employee information"
            />
            <dl className="employee-payslip-modal-meta-grid">
              <InfoItem label="Employee Name">
                {employeeAttendanceProfile.name}
              </InfoItem>
              <InfoItem label="Employee ID">
                {employeeAttendanceProfile.employeeId}
              </InfoItem>
              <InfoItem label="Department">
                {employeeAttendanceProfile.department}
              </InfoItem>
            </dl>
          </section>

          <section
            className="employee-payslip-modal-section"
            aria-labelledby="employee-payslip-period-heading"
          >
            <ModalSectionHeading
              id="employee-payslip-period-heading"
              eyebrow="Payroll record"
              title="Payroll information"
            />
            <dl className="employee-payslip-modal-meta-grid">
              <InfoItem label="Payroll Period">
                {payslip.payrollPeriod}
              </InfoItem>
              <InfoItem label="Date Released">
                {payslip.dateReleased}
              </InfoItem>
              <InfoItem label="Status">
                <StatusBadge tone={payslip.statusTone}>
                  {payslip.statusLabel}
                </StatusBadge>
              </InfoItem>
            </dl>
          </section>

          <section
            className="employee-payslip-modal-section"
            aria-labelledby="employee-payslip-financial-heading"
          >
            <ModalSectionHeading
              id="employee-payslip-financial-heading"
              eyebrow="Payroll statement"
              title="Financial summary"
            />
            <div className="employee-payslip-modal-financial-summary">
              <FinancialSummaryItem
                label="Total Earnings"
                value={payslip.basicPay}
              />
              <FinancialSummaryItem
                label="Deductions"
                value={payslip.deductions}
              />
              <FinancialSummaryItem
                label="Net Pay"
                value={payslip.netPay}
                emphasized
              />
            </div>
          </section>

          <div className="employee-payslip-modal-detail-grid">
            <section
              className="employee-payslip-modal-detail-section"
              aria-labelledby="employee-payslip-earnings-heading"
            >
              <h3 id="employee-payslip-earnings-heading">Earnings</h3>
              <div className="employee-payslip-modal-line-item">
                <span>Basic Pay</span>
                <strong>{payslip.basicPay}</strong>
              </div>
              <div className="employee-payslip-modal-line-item is-total">
                <span>Total Earnings</span>
                <strong>{payslip.basicPay}</strong>
              </div>
            </section>

            <section
              className="employee-payslip-modal-detail-section"
              aria-labelledby="employee-payslip-deductions-heading"
            >
              <h3 id="employee-payslip-deductions-heading">Deductions</h3>
              <div className="employee-payslip-modal-line-item is-total">
                <span>Total Deductions</span>
                <strong>{payslip.deductions}</strong>
              </div>
            </section>
          </div>

          <section
            className="employee-payslip-modal-net-pay"
            aria-labelledby="employee-payslip-net-pay-heading"
          >
            <div>
              <span className="employee-payslip-modal-net-pay-label">
                Final amount
              </span>
              <h3 id="employee-payslip-net-pay-heading">Net Pay</h3>
            </div>
            <strong>{payslip.netPay}</strong>
          </section>

          <p className="employee-payslip-modal-boundary-note">
            <Icon name="info" />
            <span>
              Payroll information displayed in this application is received
              from the Existing Payroll System.
            </span>
          </p>
        </div>

        <footer className="employee-payslip-modal-footer">
          <button
            type="button"
            className="employee-secondary-button"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

function ModalSectionHeading({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="employee-payslip-modal-section-heading">
      <span>{eyebrow}</span>
      <h3 id={id}>{title}</h3>
    </div>
  );
}

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function FinancialSummaryItem({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`employee-payslip-modal-financial-item${
        emphasized ? " is-emphasized" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
