"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPhilippinePeso } from "@/lib/format-currency";
import type {
  EmployeeMonthlyPayslip,
  EmployeePayslip,
} from "@/types/payslip";
import type { EmployeeReference } from "@/types/employee";

export type PayslipDetailsRecord =
  | { kind: "cutoff"; payslip: EmployeePayslip }
  | { kind: "monthly"; summary: EmployeeMonthlyPayslip };

type PayslipDetailsModalProps = {
  employee: EmployeeReference | null;
  record: PayslipDetailsRecord | null;
  includedCutoffs: readonly EmployeePayslip[];
  onClose: () => void;
  onViewCutoff: (payslip: EmployeePayslip) => void;
};

export function PayslipDetailsModal({
  employee,
  record,
  includedCutoffs,
  onClose,
  onViewCutoff,
}: PayslipDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!record) {
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
  }, [onClose, record]);

  if (!record) {
    return null;
  }

  const isMonthly = record.kind === "monthly";
  const status = isMonthly ? record.summary : record.payslip;
  const title = isMonthly ? "Monthly Payroll Summary" : "Payslip Details";
  const subtitle = isMonthly ? record.summary.monthLabel : record.payslip.payrollPeriod;

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
              {isMonthly ? "Payroll month" : "Payroll record"}
            </span>
            <h2 id="employee-payslip-modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="employee-payslip-modal-header-actions">
            <StatusBadge tone={status.statusTone}>{status.statusLabel}</StatusBadge>
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
                {employee?.displayName ?? "Employee information unavailable"}
              </InfoItem>
              <InfoItem label="Employee ID">
                {employee?.employeeId ?? "Unavailable"}
              </InfoItem>
              <InfoItem label="Department">
                {employee?.department ?? "Unavailable"}
              </InfoItem>
            </dl>
          </section>

          {isMonthly ? (
            <MonthlyPayrollInformation summary={record.summary} />
          ) : (
            <CutoffPayrollInformation payslip={record.payslip} />
          )}

          {isMonthly ? (
            <MonthlyCompensationDetails summary={record.summary} />
          ) : (
            <CutoffCompensationDetails payslip={record.payslip} />
          )}

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
                label={isMonthly && record.summary.status === "in-progress" ? "Released Earnings" : "Total Earnings"}
                value={
                  isMonthly
                    ? displayAmount(record.summary.totalEarnings)
                    : displayAmount(record.payslip.earnings.totalEarnings)
                }
              />
              <FinancialSummaryItem
                label={isMonthly && record.summary.status === "in-progress" ? "Released Deductions" : "Deductions"}
                value={
                  isMonthly
                    ? displayAmount(record.summary.totalDeductions)
                    : displayAmount(record.payslip.totalDeductions)
                }
              />
              <FinancialSummaryItem
                label={isMonthly && record.summary.status === "in-progress" ? "Released Net Pay" : "Net Pay"}
                value={isMonthly ? displayAmount(record.summary.netPay) : displayAmount(record.payslip.netPay)}
                emphasized
              />
            </div>
          </section>

          {isMonthly ? (
            <MonthlyBreakdown
              summary={record.summary}
              includedCutoffs={includedCutoffs}
              onViewCutoff={onViewCutoff}
            />
          ) : (
            <CutoffBreakdown payslip={record.payslip} />
          )}

          <section
            className="employee-payslip-modal-net-pay"
            aria-labelledby="employee-payslip-net-pay-heading"
          >
            <div>
              <span className="employee-payslip-modal-net-pay-label">
                {isMonthly && record.summary.status === "in-progress" ? "Released so far" : "Final amount"}
              </span>
              <h3 id="employee-payslip-net-pay-heading">Net Pay</h3>
            </div>
            <strong>{isMonthly ? displayAmount(record.summary.netPay) : displayAmount(record.payslip.netPay)}</strong>
          </section>

          <p className="employee-payslip-modal-boundary-note">
            <Icon name="info" />
            <span>
              Payroll information displayed here is received from the Existing Payroll System.
              This application does not calculate employee payroll.
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

function CutoffPayrollInformation({ payslip }: { payslip: EmployeePayslip }) {
  return (
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
        <InfoItem label="Payroll Period">{payslip.payrollPeriod}</InfoItem>
        <InfoItem label="Date Released">{payslip.dateReleased ?? "Not released"}</InfoItem>
        <InfoItem label="Pay Frequency">{payslip.payFrequency}</InfoItem>
        <InfoItem label="Status">
          <StatusBadge tone={payslip.statusTone}>{payslip.statusLabel}</StatusBadge>
        </InfoItem>
      </dl>
    </section>
  );
}

function MonthlyPayrollInformation({ summary }: { summary: EmployeeMonthlyPayslip }) {
  return (
    <section
      className="employee-payslip-modal-section"
      aria-labelledby="employee-payslip-period-heading"
    >
      <ModalSectionHeading
        id="employee-payslip-period-heading"
        eyebrow="Payroll month"
        title="Payroll information"
      />
      <dl className="employee-payslip-modal-meta-grid">
        <InfoItem label="Payroll Month">{summary.monthLabel}</InfoItem>
        <InfoItem label="Released Cutoffs">
          {summary.releasedCutoffCount} of {summary.totalCutoffCount}
        </InfoItem>
        <InfoItem label="Pay Frequency">Semi-monthly</InfoItem>
        <InfoItem label="Status">
          <StatusBadge tone={summary.statusTone}>{summary.statusLabel}</StatusBadge>
        </InfoItem>
      </dl>
    </section>
  );
}

function CutoffCompensationDetails({ payslip }: { payslip: EmployeePayslip }) {
  return (
    <section
      className="employee-payslip-modal-section"
      aria-labelledby="employee-payslip-compensation-heading"
    >
      <ModalSectionHeading
        id="employee-payslip-compensation-heading"
        eyebrow="Pay information"
        title="Compensation details"
      />
      <dl className="employee-payslip-modal-meta-grid">
        <InfoItem label="Monthly Basic Salary">{displayAmount(payslip.monthlyBasicSalary)}</InfoItem>
        <InfoItem label="Cutoff Basic Pay">{displayAmount(payslip.cutoffBasicPay)}</InfoItem>
        <InfoItem label="Reference Daily Rate">
          {displayAmount(payslip.referenceDailyRate)} / day
        </InfoItem>
      </dl>
      <p className="employee-payslip-modal-info-note">Reference rate provided by payroll information.</p>
    </section>
  );
}

function MonthlyCompensationDetails({ summary }: { summary: EmployeeMonthlyPayslip }) {
  return (
    <section
      className="employee-payslip-modal-section"
      aria-labelledby="employee-payslip-compensation-heading"
    >
      <ModalSectionHeading
        id="employee-payslip-compensation-heading"
        eyebrow="Pay information"
        title="Compensation details"
      />
      <dl className="employee-payslip-modal-meta-grid">
        <InfoItem label="Monthly Basic Salary">{displayAmount(summary.monthlyBasicSalary)}</InfoItem>
        <InfoItem label="Reference Daily Rate">
          {displayAmount(summary.referenceDailyRate)} / day
        </InfoItem>
        <InfoItem label="Released Cutoffs">
          {summary.releasedCutoffCount} of {summary.totalCutoffCount}
        </InfoItem>
      </dl>
      <p className="employee-payslip-modal-info-note">
        {summary.status === "in-progress"
          ? "Amounts shown are released so far; the month is not final."
          : "Reference rate provided by payroll information."}
      </p>
    </section>
  );
}

function CutoffBreakdown({ payslip }: { payslip: EmployeePayslip }) {
  return (
    <div className="employee-payslip-modal-detail-grid">
      <section
        className="employee-payslip-modal-detail-section"
        aria-labelledby="employee-payslip-earnings-heading"
      >
        <h3 id="employee-payslip-earnings-heading">Earnings</h3>
        <ModalLineItem label="Basic Pay" value={displayAmount(payslip.earnings.basicPay)} />
        <ModalLineItem
          label="Total Earnings"
          value={displayAmount(payslip.earnings.totalEarnings)}
          total
        />
      </section>

      <section
        className="employee-payslip-modal-detail-section"
        aria-labelledby="employee-payslip-deductions-heading"
      >
        <h3 id="employee-payslip-deductions-heading">Deductions</h3>
        {payslip.deductions.map((deduction) => (
          <ModalLineItem
            key={deduction.label}
            label={deduction.label}
            value={displayAmount(deduction.amount)}
          />
        ))}
        <ModalLineItem
          label="Total Deductions"
          value={displayAmount(payslip.totalDeductions)}
          total
        />
      </section>
    </div>
  );
}

function MonthlyBreakdown({
  summary,
  includedCutoffs,
  onViewCutoff,
}: {
  summary: EmployeeMonthlyPayslip;
  includedCutoffs: readonly EmployeePayslip[];
  onViewCutoff: (payslip: EmployeePayslip) => void;
}) {
  return (
    <div className="employee-payslip-modal-detail-grid">
      <section
        className="employee-payslip-modal-detail-section"
        aria-labelledby="employee-payslip-monthly-summary-heading"
      >
        <h3 id="employee-payslip-monthly-summary-heading">Monthly summary</h3>
        <ModalLineItem
          label="Released Cutoffs"
          value={`${summary.releasedCutoffCount} of ${summary.totalCutoffCount}`}
        />
        <ModalLineItem
          label="Monthly Basic Salary"
          value={displayAmount(summary.monthlyBasicSalary)}
        />
        <ModalLineItem
          label={summary.status === "in-progress" ? "Released Net Pay" : "Net Pay"}
          value={displayAmount(summary.netPay)}
          total
        />
      </section>

      <section
        className="employee-payslip-modal-detail-section"
        aria-labelledby="employee-payslip-cutoffs-heading"
      >
        <h3 id="employee-payslip-cutoffs-heading">Included cutoffs</h3>
        <div className="employee-payslip-modal-cutoff-list">
          {includedCutoffs.map((payslip) => (
            <div className="employee-payslip-modal-cutoff-item" key={payslip.id}>
              <div>
                <strong>{payslip.payrollPeriod}</strong>
                <span>{payslip.dateReleased ?? "Not released"}</span>
              </div>
              <button
                type="button"
                onClick={() => onViewCutoff(payslip)}
                disabled={payslip.status !== "released"}
              >
                View Payslip
              </button>
            </div>
          ))}
        </div>
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

function ModalLineItem({
  label,
  value,
  total = false,
}: {
  label: string;
  value: string;
  total?: boolean;
}) {
  return (
    <div className={`employee-payslip-modal-line-item${total ? " is-total" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function displayAmount(value: number | null) {
  return value === null ? "—" : formatPhilippinePeso(value);
}
