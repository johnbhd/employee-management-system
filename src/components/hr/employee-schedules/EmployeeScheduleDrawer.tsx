"use client";

import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";

import type { EmployeeScheduleItem } from "@/types/hr-employee-schedule";

import {
  formatList,
  formatSchedule,
  formatTimeRange,
  getWeeklySchedule,
} from "./schedule-display";

type EmployeeScheduleDrawerProps = {
  record: EmployeeScheduleItem | null;
  onClose: () => void;
};

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

  const schedule = record.schedule;

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
            <p className="hr-schedules-drawer-employee">{record.employee.displayName}</p>
            <p className="hr-schedules-drawer-meta">
              {record.employee.employeeId} · {record.employee.department}
            </p>
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
            <DetailRow label="Employee ID" value={record.employee.employeeId} />
            <DetailRow label="Name" value={record.employee.displayName} />
            <DetailRow label="Department" value={record.employee.department} />
            <DetailRow label="Position" value={record.employee.position ?? "—"} />
            <DetailRow
              label="Employment status"
              value={record.employee.employmentStatus === "active" ? "Active" : "Inactive"}
            />
          </dl>
        </section>

        <section className="hr-schedules-detail-section" aria-labelledby="hr-schedules-current-heading">
          <h3 id="hr-schedules-current-heading">Current work schedule</h3>
          {schedule ? (
            <dl className="hr-schedules-detail-list">
              <DetailRow label="Schedule" value={formatSchedule(schedule)} />
              <DetailRow label="Break" value={formatTimeRange(schedule.breakStart, schedule.breakEnd)} />
              <DetailRow label="Shift" value={schedule.shiftLabel ?? "—"} />
              <DetailRow label="Work days" value={formatList(schedule.workDays)} />
              <DetailRow label="Rest days" value={formatList(schedule.restDays)} />
              <DetailRow label="Work location" value={schedule.workLocation ?? "—"} />
              <DetailRow label="Reference source" value="HRPS reference data" />
            </dl>
          ) : (
            <p className="hr-schedules-empty-detail">No schedule reference available.</p>
          )}
        </section>

        {schedule ? (
          <section className="hr-schedules-detail-section" aria-labelledby="hr-schedules-week-heading">
            <h3 id="hr-schedules-week-heading">Weekly schedule</h3>
            <div className="hr-schedules-week-list">
              {getWeeklySchedule(schedule).map((day) => (
                <div
                  className={`hr-schedules-week-row ${day.isWorkDay ? "" : "is-rest-day"}`}
                  key={day.day}
                >
                  <strong>{day.shortDay}</strong>
                  <span>
                    {day.isWorkDay
                      ? formatTimeRange(schedule.workStart, schedule.workEnd)
                      : "Rest day"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="hr-schedules-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
