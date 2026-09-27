"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

import type { HrEmployeeReference } from "@/data/hr-employee-directory";

type EmployeeDetailsDrawerProps = {
  employee: HrEmployeeReference | null;
  onClose: () => void;
};

function referenceStatusTone(status: HrEmployeeReference["hrpsStatus"]) {
  if (status === "Synchronized") return "success" as const;
  if (status === "Needs Review") return "warning" as const;
  return "danger" as const;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="hr-directory-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function EmployeeDetailsDrawer({ employee, onClose }: EmployeeDetailsDrawerProps) {
  if (!employee) return null;

  return (
    <div className="hr-directory-drawer-layer">
      <button
        type="button"
        className="hr-directory-drawer-backdrop"
        onClick={onClose}
        aria-label="Close employee details"
      />
      <aside
        className="hr-directory-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hr-directory-drawer-title"
      >
        <div className="hr-directory-drawer-header">
          <div>
            <p className="hr-section-kicker">Selected employee</p>
            <h2 id="hr-directory-drawer-title">Employee reference</h2>
            <p className="hr-directory-drawer-employee">{employee.employeeName}</p>
            <p className="hr-directory-drawer-meta">{employee.employeeId} · {employee.department}</p>
          </div>
          <button
            type="button"
            className="hr-directory-close-button"
            onClick={onClose}
            aria-label="Close employee details"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>

        <section className="hr-directory-detail-section" aria-labelledby="hr-directory-employee-information-heading">
          <h3 id="hr-directory-employee-information-heading">Employee information</h3>
          <dl className="hr-directory-detail-list">
            <DetailRow label="Employee ID" value={employee.employeeId} />
            <DetailRow label="Full name" value={employee.employeeName} />
          </dl>
        </section>

        <section className="hr-directory-detail-section" aria-labelledby="hr-directory-employment-heading">
          <h3 id="hr-directory-employment-heading">Employment information</h3>
          <dl className="hr-directory-detail-list">
            <DetailRow label="Department" value={employee.department} />
            <DetailRow label="Position" value={employee.position} />
            <DetailRow
              label="Employment status"
              value={<StatusBadge tone={employee.employmentStatus === "Active" ? "success" : "muted"}>{employee.employmentStatus}</StatusBadge>}
            />
          </dl>
        </section>

        <section className="hr-directory-detail-section" aria-labelledby="hr-directory-schedule-heading">
          <h3 id="hr-directory-schedule-heading">Work schedule reference</h3>
          <dl className="hr-directory-detail-list">
            <DetailRow label="Schedule" value={employee.schedule ?? "Schedule Unavailable"} />
            <DetailRow label="Start time" value={employee.startTime ?? "Unavailable"} />
            <DetailRow label="End time" value={employee.endTime ?? "Unavailable"} />
            <DetailRow label="Work days" value={employee.workDays.join(" · ")} />
            <DetailRow label="Rest days" value={employee.restDayLabel} />
          </dl>
        </section>

        <section className="hr-directory-detail-section" aria-labelledby="hr-directory-location-heading">
          <h3 id="hr-directory-location-heading">Work location</h3>
          <p className="hr-directory-detail-note">{employee.workLocation ?? "Work location is currently unavailable."}</p>
        </section>

        <section className="hr-directory-detail-section" aria-labelledby="hr-directory-hrps-heading">
          <h3 id="hr-directory-hrps-heading">HRPS reference</h3>
          <dl className="hr-directory-detail-list">
            <DetailRow label="Reference status" value={<StatusBadge tone={referenceStatusTone(employee.hrpsStatus)}>{employee.hrpsStatus}</StatusBadge>} />
            <DetailRow label="Employee ID match" value={employee.employeeIdMatch} />
          </dl>
        </section>

        <section className="hr-directory-detail-section" aria-labelledby="hr-directory-related-heading">
          <h3 id="hr-directory-related-heading">Related attendance</h3>
          <div className="hr-directory-related-list">
            <Link href="/hr/attendance-monitoring" className="hr-directory-related-link" onClick={onClose}>
              <span className="hr-directory-related-icon" aria-hidden="true"><Icon name="clock" /></span>
              <span>
                <strong>View attendance monitoring</strong>
                <small>{employee.attendanceRecordCount} attendance reference record</small>
              </span>
              <Icon name="arrow" />
            </Link>
            <Link href="/hr/employee-schedules" className="hr-directory-related-link" onClick={onClose}>
              <span className="hr-directory-related-icon" aria-hidden="true"><Icon name="calendar" /></span>
              <span>
                <strong>View employee schedule</strong>
                <small>Open the read-only schedule reference</small>
              </span>
              <Icon name="arrow" />
            </Link>
            {employee.openCorrectionRequestCount > 0 ? (
              <Link href="/hr/correction-requests" className="hr-directory-related-link" onClick={onClose}>
                <span className="hr-directory-related-icon" aria-hidden="true"><Icon name="comment" /></span>
                <span>
                  <strong>View correction requests</strong>
                  <small>{employee.openCorrectionRequestCount} open request{employee.openCorrectionRequestCount === 1 ? "" : "s"}</small>
                </span>
                <Icon name="arrow" />
              </Link>
            ) : null}
          </div>
        </section>

        <div className="hr-directory-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </div>
      </aside>
    </div>
  );
}
