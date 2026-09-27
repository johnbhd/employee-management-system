"use client";

import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

import type { HrEmployeeScheduleRecord } from "@/data/hr-employee-schedules";

type EmployeeScheduleDrawerProps = {
  record: HrEmployeeScheduleRecord | null;
  onClose: () => void;
};

function referenceStatusTone(status: HrEmployeeScheduleRecord["hrpsStatus"]) {
  if (status === "Synchronized") return "success" as const;
  if (status === "Needs Review") return "warning" as const;
  return "danger" as const;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="hr-schedules-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function EmployeeScheduleDrawer({ record, onClose }: EmployeeScheduleDrawerProps) {
  if (!record) return null;

  return (
    <div className="hr-schedules-drawer-layer">
      <button
        type="button"
        className="hr-schedules-drawer-backdrop"
        onClick={onClose}
        aria-label="Close employee schedule details"
      />
      <aside
        className="hr-schedules-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hr-schedules-drawer-title"
      >
        <div className="hr-schedules-drawer-header">
          <div>
            <p className="hr-section-kicker">Selected employee</p>
            <h2 id="hr-schedules-drawer-title">Employee schedule</h2>
            <p className="hr-schedules-drawer-employee">{record.employeeName}</p>
            <p className="hr-schedules-drawer-meta">{record.employeeId} · {record.department}</p>
          </div>
          <button
            type="button"
            className="hr-schedules-close-button"
            onClick={onClose}
            aria-label="Close employee schedule details"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>

        <section className="hr-schedules-detail-section" aria-labelledby="hr-schedules-reference-heading">
          <h3 id="hr-schedules-reference-heading">Employee reference</h3>
          <dl className="hr-schedules-detail-list">
            <DetailRow label="Employee ID" value={record.employeeId} />
            <DetailRow label="Name" value={record.employeeName} />
            <DetailRow label="Department" value={record.department} />
            <DetailRow label="Position" value={record.position} />
            <DetailRow label="Employment status" value={record.employmentStatus} />
          </dl>
        </section>

        <section className="hr-schedules-detail-section" aria-labelledby="hr-schedules-current-heading">
          <h3 id="hr-schedules-current-heading">Current work schedule</h3>
          <dl className="hr-schedules-detail-list">
            <DetailRow label="Schedule" value={record.schedule} />
            <DetailRow label="Work days" value={record.workDays.join(" · ")} />
            <DetailRow label="Rest days" value={record.restDayLabel} />
            <DetailRow label="Work location" value={record.workLocation} />
          </dl>
        </section>

        <section className="hr-schedules-detail-section" aria-labelledby="hr-schedules-week-heading">
          <h3 id="hr-schedules-week-heading">Weekly schedule</h3>
          <div className="hr-schedules-week-list">
            {record.weeklySchedule.map((day) => (
              <div className={`hr-schedules-week-row ${day.isWorkDay ? "" : "is-rest-day"}`} key={day.day}>
                <strong>{day.shortDay}</strong>
                <span>{day.isWorkDay ? `${day.startTime} – ${day.endTime}` : "Rest day"}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="hr-schedules-detail-section" aria-labelledby="hr-schedules-exceptions-heading">
          <h3 id="hr-schedules-exceptions-heading">Leave / holiday reference</h3>
          {record.exceptions.length > 0 ? (
            <div className="hr-schedules-exception-list">
              {record.exceptions.map((exception) => (
                <div className="hr-schedules-exception" key={`${exception.date}-${exception.type}`}>
                  <strong>{exception.date}</strong>
                  <span>{exception.type} · {exception.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="hr-schedules-empty-detail">No leave or holiday reference is available for this schedule.</p>
          )}
        </section>

        <section className="hr-schedules-detail-section" aria-labelledby="hr-schedules-hrps-heading">
          <h3 id="hr-schedules-hrps-heading">HRPS reference status</h3>
          <dl className="hr-schedules-detail-list">
            <DetailRow label="Reference status" value={<StatusBadge tone={referenceStatusTone(record.hrpsStatus)}>{record.hrpsStatus}</StatusBadge>} />
            <DetailRow label="Employee ID match" value="Matched" />
            {record.scheduleReviewReason ? <DetailRow label="Review note" value={record.scheduleReviewReason} /> : null}
          </dl>
        </section>

        <div className="hr-schedules-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </div>
      </aside>
    </div>
  );
}
