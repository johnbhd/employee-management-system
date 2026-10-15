import type { PayrollVerifiedAttendanceItem } from "@/types/payroll-verified-attendance";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PayrollVerifiedAttendanceDetailsModalProps = {
  record: PayrollVerifiedAttendanceItem | null;
  onClose: () => void;
};

function formatAvailability(value: number | null) {
  return value === null ? "Unavailable" : String(value);
}

export function PayrollVerifiedAttendanceDetailsModal({
  record,
  onClose,
}: PayrollVerifiedAttendanceDetailsModalProps) {
  if (!record) {
    return null;
  }

  return (
    <div
      className="payroll-verified-attendance__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
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
          <button
            type="button"
            className="button-secondary"
            onClick={onClose}
            aria-label="Close attendance details"
          >
            <Icon name="close" />
          </button>
        </header>

        <dl className="payroll-verified-attendance__modal-details">
          <div><dt>Department</dt><dd>{record.department}</dd></div>
          <div><dt>Payroll period</dt><dd>{record.payrollPeriod.label}</dd></div>
          <div><dt>Days present</dt><dd>{record.attendanceSummary.presentDays}</dd></div>
          <div><dt>Late count</dt><dd>{formatAvailability(record.attendanceSummary.lateCount)}</dd></div>
          <div><dt>Late minutes</dt><dd>{formatAvailability(record.attendanceSummary.lateMinutes)}</dd></div>
          <div><dt>Undertime minutes</dt><dd>{formatAvailability(record.attendanceSummary.undertimeMinutes)}</dd></div>
          <div>
            <dt>HR verification</dt>
            <dd><StatusBadge tone="success">Verified</StatusBadge></dd>
          </div>
          <div><dt>Verified at</dt><dd>{record.hrVerification.verifiedAt ?? "Unavailable"}</dd></div>
          <div>
            <dt>Payroll readiness</dt>
            <dd>
              <StatusBadge tone={record.payrollReadiness.tone}>
                {record.payrollReadiness.status === "ready" ? "Ready" : "Blocked"}
              </StatusBadge>
            </dd>
          </div>
          <div><dt>Batch status</dt><dd><StatusBadge tone={record.batch.tone}>{record.batch.label}</StatusBadge></dd></div>
        </dl>

        {record.payrollReadiness.reasons.length > 0 ? (
          <div className="payroll-verified-attendance__modal-reasons">
            <h3>Blocking reasons</h3>
            <ul>
              {record.payrollReadiness.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        ) : null}

        <footer className="payroll-verified-attendance__modal-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Close details</button>
        </footer>
      </section>
    </div>
  );
}

