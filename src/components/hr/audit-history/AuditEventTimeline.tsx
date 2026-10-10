import type { HrAuditHistoryItem } from "@/types/hr-audit-history";

type AuditEventTimelineProps = {
  events: readonly HrAuditHistoryItem[];
};

export function AuditEventTimeline({ events }: AuditEventTimelineProps) {
  return (
    <ol className="hr-audit-timeline">
      {events.map((event) => (
        <li key={event.id}>
          <span className="hr-audit-timeline-marker" aria-hidden="true" />
          <div>
            <strong>{event.action}</strong>
            <span>{event.actor.displayName ?? "Unknown / unavailable"} · {event.actor.role ?? "Role unavailable"}</span>
            <small>{event.occurredAt}</small>
            {event.note ? <p>{event.note}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
