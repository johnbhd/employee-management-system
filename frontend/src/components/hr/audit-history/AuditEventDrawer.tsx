import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AttendanceAuditEvent } from "@/data/hr-attendance-audit";

import { AuditChangeComparison } from "./AuditChangeComparison";
import { AuditEventTimeline } from "./AuditEventTimeline";

type AuditEventDrawerProps = {
  event: AttendanceAuditEvent | null;
  relatedEvents: readonly AttendanceAuditEvent[];
  onClose: () => void;
};

function outcomeTone(outcome: AttendanceAuditEvent["outcome"]) {
  if (outcome === "Approved") return "success" as const;
  if (outcome === "Rejected") return "danger" as const;
  if (outcome === "Needs Information") return "warning" as const;
  if (outcome === "Under Review") return "info" as const;
  if (outcome === "Verified") return "success" as const;
  return "muted" as const;
}

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
    <div className="hr-audit-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function AuditEventDrawer({ event, relatedEvents, onClose }: AuditEventDrawerProps) {
  if (!event) return null;

  return (
    <div className="hr-audit-drawer-layer">
      <button type="button" className="hr-audit-drawer-backdrop" onClick={onClose} aria-label="Close audit event details" />
      <aside className="hr-audit-drawer" role="dialog" aria-modal="true" aria-labelledby="hr-audit-drawer-title">
        <div className="hr-audit-drawer-header">
          <div>
            <p className="hr-section-kicker">Audit event</p>
            <h2 id="hr-audit-drawer-title">{event.action}</h2>
            <p className="hr-audit-drawer-meta">{event.id} · {event.occurredAt}</p>
          </div>
          <button type="button" className="hr-audit-close-button" onClick={onClose} aria-label="Close audit event details" autoFocus>
            <Icon name="close" />
          </button>
        </div>

        <section className="hr-audit-detail-section" aria-labelledby="hr-audit-event-summary-heading">
          <h3 id="hr-audit-event-summary-heading">Event summary</h3>
          <dl className="hr-audit-detail-list">
            <DetailRow label="Audit event ID" value={event.id} />
            <DetailRow label="Action" value={event.action} />
            <DetailRow label="Date / time" value={event.occurredAt} />
            <DetailRow label="Area" value={event.area} />
            <DetailRow label="Outcome" value={<StatusBadge tone={outcomeTone(event.outcome)}>{event.outcome}</StatusBadge>} />
          </dl>
        </section>

        <section className="hr-audit-detail-section" aria-labelledby="hr-audit-performed-by-heading">
          <h3 id="hr-audit-performed-by-heading">Performed by</h3>
          <dl className="hr-audit-detail-list">
            <DetailRow label="Actor" value={event.actor.name} />
            <DetailRow label="Actor role" value={event.actor.role} />
          </dl>
        </section>

        <section className="hr-audit-detail-section" aria-labelledby="hr-audit-employee-heading">
          <h3 id="hr-audit-employee-heading">Affected employee</h3>
          <dl className="hr-audit-detail-list">
            <DetailRow label="Employee" value={event.employee.name} />
            <DetailRow label="Employee ID" value={event.employee.employeeId} />
            <DetailRow label="Department" value={event.employee.department} />
          </dl>
        </section>

        {event.attendanceRecord ? (
          <section className="hr-audit-detail-section" aria-labelledby="hr-audit-record-heading">
            <h3 id="hr-audit-record-heading">Affected attendance record</h3>
            <dl className="hr-audit-detail-list">
              <DetailRow label="Record reference" value={event.attendanceRecord.id} />
              <DetailRow label="Attendance date" value={formatDate(event.attendanceRecord.date)} />
              <DetailRow label="Schedule" value={event.attendanceRecord.schedule} />
              <DetailRow label="Source" value={event.attendanceRecord.source} />
              <DetailRow label="Attendance status" value={event.attendanceRecord.status} />
              <DetailRow label="Validation status" value={event.attendanceRecord.validationStatus} />
            </dl>
          </section>
        ) : null}

        <section className="hr-audit-detail-section" aria-labelledby="hr-audit-change-heading">
          <h3 id="hr-audit-change-heading">{event.changes.length > 0 ? "Change details" : "Action details"}</h3>
          {event.changes.length > 0 ? (
            <AuditChangeComparison changes={event.changes} />
          ) : (
            <p className="hr-audit-note">This workflow event records an activity without a field-value change.</p>
          )}
        </section>

        {event.correctionRequest ? (
          <section className="hr-audit-detail-section" aria-labelledby="hr-audit-request-heading">
            <h3 id="hr-audit-request-heading">Related correction request</h3>
            <dl className="hr-audit-detail-list">
              <DetailRow label="Request ID" value={event.correctionRequest.id} />
              <DetailRow label="Issue type" value={event.correctionRequest.issueType} />
              <DetailRow label="Attendance date" value={formatDate(event.correctionRequest.attendanceDate)} />
              <DetailRow label="Current request status" value={event.correctionRequest.status} />
            </dl>
          </section>
        ) : null}

        {event.note ? (
          <section className="hr-audit-detail-section" aria-labelledby="hr-audit-note-heading">
            <h3 id="hr-audit-note-heading">Reason / note</h3>
            <p className="hr-audit-note">{event.note}</p>
          </section>
        ) : null}

        {relatedEvents.length > 1 ? (
          <section className="hr-audit-detail-section" aria-labelledby="hr-audit-related-heading">
            <h3 id="hr-audit-related-heading">Related activity</h3>
            <AuditEventTimeline events={relatedEvents} />
          </section>
        ) : null}

        <div className="hr-audit-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </div>
      </aside>
    </div>
  );
}
