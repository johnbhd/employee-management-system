import type { PayrollVerifiedAttendanceRecord } from "@/data/payroll/verified-attendance";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PayrollVerifiedAttendanceDetailsModalProps = {
  record: PayrollVerifiedAttendanceRecord | null;
  onClose: () => void;
};

export function PayrollVerifiedAttendanceDetailsModal({
  record,
  onClose,
}: PayrollVerifiedAttendanceDetailsModalProps) {
  if (!record) return null;

  return (
    <div
      className="payroll-verified-attendance__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="payroll-verified-attendance__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-verified-attendance-modal-title"
      >
        <header className="payroll-verified-attendance__modal-header">
          <div>
            <p className="section-kicker">Attendance record</p>
            <h2 id="payroll-verified-attendance-modal-title">{record.employeeName}</h2>
            <p>{record.employeeId}</p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose} aria-label="Close attendance details">
            <Icon name="close" />
          </button>
        </header>
        <dl className="payroll-verified-attendance__modal-details">
          <div><dt>Department</dt><dd>{record.department}</dd></div>
          <div><dt>Payroll period</dt><dd>{record.payrollPeriod}</dd></div>
          <div><dt>Days present</dt><dd>{record.daysPresent}</dd></div>
          <div><dt>Late / undertime</dt><dd>{record.lateUndertime}</dd></div>
          <div><dt>Verification</dt><dd><StatusBadge tone={record.verificationTone}>{record.verification}</StatusBadge></dd></div>
          <div><dt>Payroll readiness</dt><dd><StatusBadge tone={record.readinessTone}>{record.readiness}</StatusBadge></dd></div>
          <div><dt>Batch status</dt><dd><StatusBadge tone={record.batchTone}>{record.batchStatus}</StatusBadge></dd></div>
        </dl>
        <footer className="payroll-verified-attendance__modal-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Close details</button>
        </footer>
      </section>
    </div>
  );
}

