import type { AttendanceAuditEvent } from "@/data/hr-attendance-audit";

type AuditEventTimelineProps = {
  events: readonly AttendanceAuditEvent[];
};

export function AuditEventTimeline({ events }: AuditEventTimelineProps) {
  return (
    <ol className="hr-audit-timeline">
      {events.map((event) => (
        <li key={event.id}>
          <span className="hr-audit-timeline-marker" aria-hidden="true" />
          <div>
            <strong>{event.action}</strong>
            <span>{event.actor.name} · {event.actor.role}</span>
            <small>{event.occurredAt}</small>
            {event.note && event.action !== "Correction Submitted" ? <p>{event.note}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
