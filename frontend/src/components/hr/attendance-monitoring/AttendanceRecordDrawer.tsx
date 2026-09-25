import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HrAttendanceMonitoringRecord } from "@/data/hr";

type AttendanceRecordDrawerProps = {
  record: HrAttendanceMonitoringRecord | null;
  onClose: () => void;
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="hr-monitoring-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function AttendanceRecordDrawer({ record, onClose }: AttendanceRecordDrawerProps) {
  if (!record) return null;

  return (
    <div className="hr-monitoring-drawer-layer">
      <button
        type="button"
        className="hr-monitoring-drawer-backdrop"
        onClick={onClose}
        aria-label="Close attendance record details"
      />
      <aside
        className="hr-monitoring-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hr-monitoring-drawer-title"
      >
        <div className="hr-monitoring-drawer-header">
          <div>
            <p className="hr-section-kicker">Selected record</p>
            <h2 id="hr-monitoring-drawer-title">Attendance details</h2>
          </div>
          <button
            type="button"
            className="hr-monitoring-close-button"
            onClick={onClose}
            aria-label="Close attendance record details"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>

        <p className="hr-monitoring-drawer-date">
          <Icon name="calendar" />
          {formatDate(record.date)}
        </p>

        <section className="hr-monitoring-detail-section" aria-labelledby="hr-monitoring-employee-heading">
          <h3 id="hr-monitoring-employee-heading">Employee information</h3>
          <dl className="hr-monitoring-detail-list">
            <DetailRow label="Employee" value={record.employeeName} />
            <DetailRow label="Employee ID" value={record.employeeId} />
            <DetailRow label="Department" value={record.department} />
            <DetailRow label="Position" value={record.position} />
            <DetailRow label="Employment status" value={record.employmentStatus} />
          </dl>
        </section>

        <section className="hr-monitoring-detail-section" aria-labelledby="hr-monitoring-record-heading">
          <h3 id="hr-monitoring-record-heading">Attendance record</h3>
          <dl className="hr-monitoring-detail-list">
            <DetailRow label="Assigned schedule" value={record.schedule} />
            <DetailRow label="Time In" value={record.timeIn} />
            <DetailRow label="Time Out" value={record.timeOut} />
            <DetailRow label="Source" value={record.source ?? "No source recorded"} />
            <DetailRow
              label="Attendance status"
              value={<StatusBadge tone={record.statusTone}>{record.status}</StatusBadge>}
            />
            <DetailRow
              label="Validation status"
              value={<StatusBadge tone={record.validationTone}>{record.validationStatus}</StatusBadge>}
            />
          </dl>
        </section>

        <section className="hr-monitoring-detail-section" aria-labelledby="hr-monitoring-evaluation-heading">
          <h3 id="hr-monitoring-evaluation-heading">Schedule and validation</h3>
          <dl className="hr-monitoring-detail-list">
            {record.lateMinutes !== undefined ? (
              <DetailRow label="Late minutes" value={`${record.lateMinutes} min`} />
            ) : null}
            {record.undertimeMinutes !== undefined ? (
              <DetailRow label="Undertime minutes" value={`${record.undertimeMinutes} min`} />
            ) : null}
            {record.overtimeMinutes !== undefined ? (
              <DetailRow label="Overtime minutes" value={`${record.overtimeMinutes} min`} />
            ) : null}
            <DetailRow label="Record reference" value={record.id} />
            {record.validationReason ? (
              <DetailRow label="Review reason" value={record.validationReason} />
            ) : null}
          </dl>
        </section>

        <div className="hr-monitoring-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
